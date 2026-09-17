import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "./db";
import type { Category, Order, Product, ProductCard } from "./types";

export const CATALOG_TAG = "catalog";
export const ORDERS_TAG = "orders";

const CARD_COLUMNS = `
  p.id, p.name, p.slug, p.summary, p.price_paise, p.compare_at_paise,
  p.stock, p.is_made_to_order,
  c.name as category_name, c.slug as category_slug,
  img.url as image_url, img.alt as image_alt
`;

const CARD_JOINS = `
  from products p
  left join categories c on c.id = p.category_id
  left join lateral (
    select url, alt from product_images i
    where i.product_id = p.id order by i.position, i.created_at limit 1
  ) img on true
`;

/* ------------------------------------------------------------------ public */

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const rows = await sql`
      select c.id, c.name, c.slug, c.description, c.image_url, c.position, c.is_active,
             count(p.id) filter (where p.is_active) ::int as product_count
      from categories c
      left join products p on p.category_id = c.id
      where c.is_active
      group by c.id
      order by c.position, c.name
    `;
    return rows as Category[];
  },
  ["categories"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export const getFeaturedProducts = unstable_cache(
  async (limit = 4): Promise<ProductCard[]> => {
    const rows = await sql.query(
      `select ${CARD_COLUMNS} ${CARD_JOINS}
       where p.is_active and p.is_featured
       order by p.created_at desc limit $1`,
      [limit],
    );
    return rows as ProductCard[];
  },
  ["featured"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export type ProductQuery = {
  categorySlug?: string;
  search?: string;
  sort?: "new" | "price-asc" | "price-desc";
  page?: number;
  perPage?: number;
};

export const getProducts = unstable_cache(
  async (query: ProductQuery = {}): Promise<{ items: ProductCard[]; total: number }> => {
    const { categorySlug, search, sort = "new", page = 1, perPage = 12 } = query;

    const where: string[] = ["p.is_active"];
    const params: unknown[] = [];

    if (categorySlug) {
      params.push(categorySlug);
      where.push(`c.slug = $${params.length}`);
    }
    if (search) {
      params.push(search);
      where.push(`p.search_tsv @@ websearch_to_tsquery('english', $${params.length})`);
    }

    const order =
      sort === "price-asc" ? "p.price_paise asc" :
      sort === "price-desc" ? "p.price_paise desc" :
      "p.created_at desc";

    const clause = where.join(" and ");
    params.push(perPage, (Math.max(page, 1) - 1) * perPage);

    const [items, counted] = await Promise.all([
      sql.query(
        `select ${CARD_COLUMNS} ${CARD_JOINS} where ${clause}
         order by ${order} limit $${params.length - 1} offset $${params.length}`,
        params,
      ),
      sql.query(
        `select count(*)::int as total from products p
         left join categories c on c.id = p.category_id where ${clause}`,
        params.slice(0, params.length - 2),
      ),
    ]);

    return {
      items: items as ProductCard[],
      total: (counted as { total: number }[])[0]?.total ?? 0,
    };
  },
  ["products"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const rows = await sql`
      select p.*, c.name as category_name, c.slug as category_slug,
             coalesce(
               (select json_agg(json_build_object(
                  'id', i.id, 'url', i.url, 'alt', i.alt, 'position', i.position)
                  order by i.position, i.created_at)
                from product_images i where i.product_id = p.id),
               '[]'::json
             ) as images
      from products p
      left join categories c on c.id = p.category_id
      where p.slug = ${slug} and p.is_active
      limit 1
    `;
    return (rows[0] as Product) ?? null;
  },
  ["product"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export const getRelatedProducts = unstable_cache(
  async (productId: string, categoryId: string | null, limit = 3): Promise<ProductCard[]> => {
    const rows = await sql.query(
      `select ${CARD_COLUMNS} ${CARD_JOINS}
       where p.is_active and p.id <> $1
         and ($2::uuid is null or p.category_id = $2::uuid)
       order by p.is_featured desc, p.created_at desc limit $3`,
      [productId, categoryId, limit],
    );
    return rows as ProductCard[];
  },
  ["related"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

/** Live prices, never cached — the cart must not check out against stale money. */
export async function getPricesForIds(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await sql.query(
    `select p.id, p.name, p.price_paise, p.stock, p.is_made_to_order, p.is_active,
            (select url from product_images i where i.product_id = p.id
             order by i.position limit 1) as image_url
     from products p where p.id = any($1::uuid[])`,
    [ids],
  );
  return rows as {
    id: string; name: string; price_paise: number; stock: number;
    is_made_to_order: boolean; is_active: boolean; image_url: string | null;
  }[];
}

/* ------------------------------------------------------------------- admin */

export async function adminListProducts(search?: string) {
  const rows = await sql.query(
    `select p.id, p.name, p.slug, p.price_paise, p.stock, p.is_active, p.is_featured,
            p.is_made_to_order, p.updated_at,
            c.name as category_name,
            (select url from product_images i where i.product_id = p.id
             order by i.position limit 1) as image_url,
            (select count(*)::int from product_images i where i.product_id = p.id) as image_count
     from products p
     left join categories c on c.id = p.category_id
     where ($1::text is null or p.name ilike '%' || $1 || '%')
     order by p.updated_at desc limit 200`,
    [search?.trim() || null],
  );
  return rows as (ProductCard & {
    is_active: boolean; is_featured: boolean; image_count: number; updated_at: string;
  })[];
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  const rows = await sql`
    select p.*, coalesce(
      (select json_agg(json_build_object(
         'id', i.id, 'url', i.url, 'alt', i.alt, 'position', i.position)
         order by i.position, i.created_at)
       from product_images i where i.product_id = p.id), '[]'::json) as images
    from products p where p.id = ${id} limit 1
  `;
  return (rows[0] as Product) ?? null;
}

export async function adminListCategories(): Promise<Category[]> {
  const rows = await sql`
    select c.*, count(p.id)::int as product_count
    from categories c
    left join products p on p.category_id = c.id
    group by c.id order by c.position, c.name
  `;
  return rows as Category[];
}

export async function adminListOrders(status?: string) {
  const rows = await sql.query(
    `select o.*, (select count(*)::int from order_items i where i.order_id = o.id) as item_count
     from orders o
     where ($1::text is null or o.status = $1)
     order by o.created_at desc limit 200`,
    [status || null],
  );
  return rows as (Order & { item_count: number })[];
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const rows = await sql`
    select o.*, coalesce(
      (select json_agg(json_build_object(
         'id', i.id, 'name_snapshot', i.name_snapshot, 'image_snapshot', i.image_snapshot,
         'unit_price_paise', i.unit_price_paise, 'quantity', i.quantity,
         'options', i.options, 'line_total_paise', i.line_total_paise))
       from order_items i where i.order_id = o.id), '[]'::json) as items
    from orders o where o.order_number = ${orderNumber} limit 1
  `;
  return (rows[0] as Order) ?? null;
}

export async function adminStats() {
  const rows = await sql`
    select
      (select count(*)::int from products where is_active)                       as live_products,
      (select count(*)::int from products where not is_active)                   as draft_products,
      (select count(*)::int from products where is_active and stock = 0
         and not is_made_to_order)                                               as out_of_stock,
      (select count(*)::int from categories where is_active)                     as categories,
      (select count(*)::int from orders where status = 'pending')                as pending_orders,
      (select coalesce(sum(total_paise), 0)::int from orders
         where status not in ('cancelled') and created_at > now() - interval '30 days')
                                                                                 as revenue_30d
  `;
  return rows[0] as {
    live_products: number; draft_products: number; out_of_stock: number;
    categories: number; pending_orders: number; revenue_30d: number;
  };
}
