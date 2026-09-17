import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts, type ProductQuery } from "@/lib/queries";

export const revalidate = 3600;
export const metadata = { title: "Shop" };

const sorts = [
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price, low first" },
  { key: "price-desc", label: "Price, high first" },
] as const;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort = (sorts.find((s) => s.key === params.sort)?.key ?? "new") as ProductQuery["sort"];

  const [categories, { items, total }] = await Promise.all([
    getCategories(),
    getProducts({ search: params.q, sort, page, categorySlug: params.category }),
  ]);

  const perPage = 12;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const link = (next: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { q: params.q, sort: params.sort, category: params.category, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, String(v));
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="font-display text-4xl">
          {params.q ? `Searching “${params.q}”` : "The whole shop"}
        </h1>
        <p className="mt-2 text-bark">
          {total} {total === 1 ? "piece" : "pieces"}
        </p>

        <div className="mt-8 flex flex-col gap-5 border-b border-sand pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href={link({ category: undefined, page: undefined })}
              className={`rounded-full px-4 py-1.5 text-sm ${
                params.category ? "border border-sand text-bark" : "bg-cocoa text-shell"
              }`}
            >
              Everything
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={link({ category: c.slug, page: undefined })}
                className={`rounded-full px-4 py-1.5 text-sm ${
                  params.category === c.slug
                    ? "bg-cocoa text-shell"
                    : "border border-sand text-bark hover:border-bark"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <form action="/shop" className="flex gap-2">
              {params.category && <input type="hidden" name="category" value={params.category} />}
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search bags, colours, yarn"
                aria-label="Search products"
                className="field w-56"
              />
              <button className="rounded-full border border-bark px-4 text-sm hover:bg-bark hover:text-shell">
                Search
              </button>
            </form>

            <div className="flex gap-3 text-sm">
              {sorts.map((s) => (
                <Link
                  key={s.key}
                  href={link({ sort: s.key, page: undefined })}
                  className={sort === s.key ? "link-sun text-cocoa" : "text-bark hover:text-cocoa"}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-16 rounded-pebble border border-dashed border-sand p-12 text-center">
            <p className="font-display text-2xl">Nothing matches that yet</p>
            <p className="mt-2 text-bark">
              Try a broader word, or{" "}
              <Link href="/shop" className="link-sun">
                browse everything
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {items.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={link({ page: n })}
                aria-current={n === page ? "page" : undefined}
                className={`grid h-9 w-9 place-items-center rounded-full text-sm ${
                  n === page ? "bg-sun font-bold text-cocoa" : "border border-sand text-bark"
                }`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
