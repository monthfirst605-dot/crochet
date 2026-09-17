"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { uploadImage } from "@/lib/storage";
import { CATALOG_TAG, ORDERS_TAG } from "@/lib/queries";
import { rupeesToPaise, slugify } from "@/lib/format";
import { SESSION_COOKIE } from "@/lib/auth";
import type { ProductOption } from "@/lib/types";

export type FormState = { error?: string; ok?: string };

function refreshStorefront() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}

const text = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

function parseOptions(raw: string | null): ProductOption[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ProductOption[];
    return parsed
      .filter((o) => o?.name?.trim() && Array.isArray(o.values))
      .map((o) => ({
        name: o.name.trim(),
        values: o.values.map((v) => String(v).trim()).filter(Boolean),
      }))
      .filter((o) => o.values.length > 0);
  } catch {
    return [];
  }
}

/** Uploads any chosen files, plus any pasted URLs, and returns their public URLs. */
async function collectImageUrls(data: FormData): Promise<string[]> {
  const urls: string[] = [];

  const pasted = text(data, "image_urls");
  if (pasted) {
    urls.push(...pasted.split(/[\n,]+/).map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u)));
  }

  const files = data.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    const uploaded = await uploadImage(file);
    urls.push(uploaded.url);
  }
  return urls;
}

/* ---------------------------------------------------------------- products */

export async function saveProduct(_: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();

  const id = text(data, "id");
  const name = text(data, "name");
  if (!name) return { error: "The product needs a name." };

  const price = rupeesToPaise(text(data, "price") ?? "0");
  if (price <= 0) return { error: "Set a price above zero." };

  const compareAtRaw = text(data, "compare_at");
  const compareAt = compareAtRaw ? rupeesToPaise(compareAtRaw) : null;
  if (compareAt !== null && compareAt <= price) {
    return { error: "The compare-at price has to be higher than the price." };
  }

  const slug = slugify(text(data, "slug") ?? name);
  if (!slug) return { error: "That name doesn't make a usable web address. Add a slug by hand." };

  const values = {
    category_id: text(data, "category_id"),
    name,
    slug,
    summary: text(data, "summary"),
    description: text(data, "description"),
    materials: text(data, "materials"),
    dimensions: text(data, "dimensions"),
    care: text(data, "care"),
    price_paise: price,
    compare_at_paise: compareAt,
    sku: text(data, "sku"),
    stock: Math.max(0, Number(text(data, "stock") ?? 0) || 0),
    is_made_to_order: data.get("is_made_to_order") === "on",
    lead_time_days: text(data, "lead_time_days") ? Number(text(data, "lead_time_days")) : null,
    options: JSON.stringify(parseOptions(text(data, "options"))),
    is_active: data.get("is_active") === "on",
    is_featured: data.get("is_featured") === "on",
  };

  let productId = id;

  try {
    if (id) {
      await sql`
        update products set
          category_id = ${values.category_id}, name = ${values.name}, slug = ${values.slug},
          summary = ${values.summary}, description = ${values.description},
          materials = ${values.materials}, dimensions = ${values.dimensions}, care = ${values.care},
          price_paise = ${values.price_paise}, compare_at_paise = ${values.compare_at_paise},
          sku = ${values.sku}, stock = ${values.stock},
          is_made_to_order = ${values.is_made_to_order}, lead_time_days = ${values.lead_time_days},
          options = ${values.options}::jsonb,
          is_active = ${values.is_active}, is_featured = ${values.is_featured}
        where id = ${id}
      `;
    } else {
      const rows = await sql`
        insert into products (category_id, name, slug, summary, description, materials, dimensions,
                              care, price_paise, compare_at_paise, sku, stock, is_made_to_order,
                              lead_time_days, options, is_active, is_featured)
        values (${values.category_id}, ${values.name}, ${values.slug}, ${values.summary},
                ${values.description}, ${values.materials}, ${values.dimensions}, ${values.care},
                ${values.price_paise}, ${values.compare_at_paise}, ${values.sku}, ${values.stock},
                ${values.is_made_to_order}, ${values.lead_time_days}, ${values.options}::jsonb,
                ${values.is_active}, ${values.is_featured})
        returning id
      `;
      productId = (rows[0] as { id: string }).id;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("products_slug_key")) {
      return { error: `The web address /shop/${slug} is taken. Change the slug.` };
    }
    if (message.includes("products_sku_key")) return { error: "That SKU is already used." };
    return { error: `Couldn't save: ${message}` };
  }

  try {
    const urls = await collectImageUrls(data);
    if (urls.length > 0 && productId) {
      const startRows = await sql`
        select coalesce(max(position) + 1, 0)::int as next
        from product_images where product_id = ${productId}
      `;
      const start = (startRows[0] as { next: number }).next;
      await sql.query(
        `insert into product_images (product_id, url, position)
         select $1, u.url, $2 + (u.ord - 1)
         from unnest($3::text[]) with ordinality as u(url, ord)`,
        [productId, start, urls],
      );
    }
  } catch (err) {
    refreshStorefront();
    return {
      error: `Product saved, but the images didn't upload: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  refreshStorefront();
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function deleteProduct(data: FormData) {
  await requireAdmin();
  const id = String(data.get("id"));
  await sql`delete from products where id = ${id}`;
  refreshStorefront();
  redirect("/admin/products");
}

export async function toggleProductActive(data: FormData) {
  await requireAdmin();
  const id = String(data.get("id"));
  await sql`update products set is_active = not is_active where id = ${id}`;
  refreshStorefront();
  revalidatePath("/admin/products");
}

export async function deleteProductImage(data: FormData) {
  await requireAdmin();
  const id = String(data.get("image_id"));
  await sql`delete from product_images where id = ${id}`;
  refreshStorefront();
  revalidatePath(`/admin/products/${String(data.get("product_id"))}`);
}

export async function makePrimaryImage(data: FormData) {
  await requireAdmin();
  const imageId = String(data.get("image_id"));
  const productId = String(data.get("product_id"));
  await sql`
    update product_images
       set position = case when id = ${imageId} then -1 else position + 1 end
     where product_id = ${productId}
  `;
  refreshStorefront();
  revalidatePath(`/admin/products/${productId}`);
}

/* -------------------------------------------------------------- categories */

export async function saveCategory(_: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(data, "id");
  const name = text(data, "name");
  if (!name) return { error: "The category needs a name." };
  const slug = slugify(text(data, "slug") ?? name);
  const description = text(data, "description");
  const position = Number(text(data, "position") ?? 0) || 0;
  const isActive = data.get("is_active") === "on";

  let imageUrl = text(data, "image_url");
  try {
    const file = data.get("image");
    if (file instanceof File && file.size > 0) {
      imageUrl = (await uploadImage(file, "categories")).url;
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  try {
    if (id) {
      await sql`
        update categories set name = ${name}, slug = ${slug}, description = ${description},
                              image_url = ${imageUrl}, position = ${position}, is_active = ${isActive}
        where id = ${id}
      `;
    } else {
      await sql`
        insert into categories (name, slug, description, image_url, position, is_active)
        values (${name}, ${slug}, ${description}, ${imageUrl}, ${position}, ${isActive})
      `;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("categories_slug_key")) return { error: `The slug "${slug}" is taken.` };
    return { error: `Couldn't save: ${message}` };
  }

  refreshStorefront();
  revalidatePath("/admin/categories");
  return { ok: id ? "Category updated." : "Category added." };
}

export async function deleteCategory(data: FormData) {
  await requireAdmin();
  // Products keep existing; they just lose their category (on delete set null).
  await sql`delete from categories where id = ${String(data.get("id"))}`;
  refreshStorefront();
  revalidatePath("/admin/categories");
}

/* ------------------------------------------------------------------ orders */

export async function updateOrderStatus(data: FormData) {
  await requireAdmin();
  const id = String(data.get("id"));
  const status = String(data.get("status"));
  const allowed = ["pending", "confirmed", "making", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) return;
  await sql`update orders set status = ${status} where id = ${id}`;
  revalidateTag(ORDERS_TAG);
  revalidatePath("/admin/orders");
}

export async function markOrderPaid(data: FormData) {
  await requireAdmin();
  await sql`update orders set payment_status = 'paid' where id = ${String(data.get("id"))}`;
  revalidatePath("/admin/orders");
}

/* ------------------------------------------------------------------- admin */

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
