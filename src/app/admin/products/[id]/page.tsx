import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetProduct, adminListCategories } from "@/lib/queries";
import { ProductForm } from "@/components/product-form";
import { deleteProduct, deleteProductImage, makePrimaryImage } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [product, categories] = await Promise.all([adminGetProduct(id), adminListCategories()]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-bark hover:text-cocoa">← Products</Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{product.name}</h1>
        <Link href={`/shop/${product.slug}`} className="text-sm text-bark hover:text-cocoa">
          View in shop
        </Link>
      </div>

      {saved && (
        <p className="mt-4 rounded-xl bg-sun px-4 py-3 text-sm font-medium text-cocoa">Saved.</p>
      )}

      {product.images.length > 0 && (
        <section className="mt-8 rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-xl">Current photos</h2>
          <p className="mt-1 text-sm text-bark">The first one is used on shop cards.</p>
          <ul className="mt-4 flex flex-wrap gap-4">
            {product.images.map((image, index) => (
              <li key={image.id} className="w-32">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-linen">
                  <Image src={image.url} alt={image.alt ?? ""} fill sizes="128px" className="object-cover" />
                  {index === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold text-cocoa">
                      Main
                    </span>
                  )}
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  {index !== 0 && (
                    <form action={makePrimaryImage}>
                      <input type="hidden" name="image_id" value={image.id} />
                      <input type="hidden" name="product_id" value={product.id} />
                      <button className="text-bark underline underline-offset-2 hover:text-cocoa">
                        Make main
                      </button>
                    </form>
                  )}
                  <form action={deleteProductImage} className="ml-auto">
                    <input type="hidden" name="image_id" value={image.id} />
                    <input type="hidden" name="product_id" value={product.id} />
                    <button className="text-bark underline underline-offset-2 hover:text-cocoa">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <ProductForm categories={categories} product={product} />
      </div>

      <section className="mt-12 rounded-2xl border border-sand p-6">
        <h2 className="font-display text-lg">Delete this product</h2>
        <p className="mt-1 text-sm text-bark">
          Its photos go too. Past orders keep their own copy of the name and price,
          so your order history stays intact.
        </p>
        <form action={deleteProduct} className="mt-4">
          <input type="hidden" name="id" value={product.id} />
          <button className="rounded-full border border-cocoa px-5 py-2 text-sm hover:bg-cocoa hover:text-shell">
            Delete permanently
          </button>
        </form>
      </section>
    </div>
  );
}
