import Image from "next/image";
import Link from "next/link";
import { adminListProducts, adminListCategories } from "@/lib/queries";
import { toggleProductActive } from "../actions";
import { price } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [products, categories] = await Promise.all([
    adminListProducts(q),
    adminListCategories(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl">Products</h1>
        <div className="flex items-center gap-4">
          <form action="/admin/products" className="flex gap-2">
            <input name="q" defaultValue={q ?? ""} placeholder="Search by name"
                   aria-label="Search products" className="field w-48" />
            <button className="rounded-full border border-bark px-4 text-sm">Search</button>
          </form>
          <Link href="/admin/products/new"
                className="rounded-full bg-sun px-5 py-2 font-semibold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)]">
            Add a product
          </Link>
        </div>
      </div>

      {categories.length === 0 && (
        <p className="mt-6 rounded-2xl bg-linen p-4 text-sm">
          Add a category first so products have somewhere to sit.{" "}
          <Link href="/admin/categories" className="link-sun font-medium">Categories</Link>
        </p>
      )}

      {products.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-sand p-12 text-center text-bark">
          {q ? `Nothing matches “${q}”.` : "No products yet. Add your first one."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-sand bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-sand text-left text-bark">
              <tr>
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-linen">
                        {product.image_url && (
                          <Image src={product.image_url} alt="" fill sizes="48px" className="object-cover" />
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/products/${product.id}`} className="font-semibold hover:underline">
                          {product.name}
                        </Link>
                        <p className="text-xs text-taupe">
                          {product.image_count} photo{product.image_count === 1 ? "" : "s"}
                          {product.is_featured && " · featured"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-bark">{product.category_name ?? "—"}</td>
                  <td className="p-4">{price(product.price_paise)}</td>
                  <td className="p-4">
                    {product.is_made_to_order
                      ? <span className="text-bark">made to order</span>
                      : product.stock === 0
                        ? <span className="font-semibold text-cocoa">0</span>
                        : product.stock}
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${
                      product.is_active ? "bg-sun text-cocoa" : "bg-linen text-bark"
                    }`}>
                      {product.is_active ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <form action={toggleProductActive} className="inline">
                      <input type="hidden" name="id" value={product.id} />
                      <button className="text-bark underline underline-offset-4 hover:text-cocoa">
                        {product.is_active ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
