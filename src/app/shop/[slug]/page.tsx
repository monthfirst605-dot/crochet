import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { price } from "@/lib/format";

export const revalidate = 3600;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.summary ?? undefined,
    openGraph: {
      title: product.name,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category_id, 3);
  const details = [
    ["Materials", product.materials],
    ["Size", product.dimensions],
    ["Care", product.care],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <nav className="text-sm text-bark">
          <Link href="/shop" className="hover:text-cocoa">Shop</Link>
          {product.category_slug && (
            <>
              <span className="px-2 text-taupe">/</span>
              <Link href={`/shop?category=${product.category_slug}`} className="hover:text-cocoa">
                {product.category_name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-6 grid gap-12 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight">
              {product.name}
            </h1>

            <p className="mt-4 flex items-baseline gap-3 text-2xl font-semibold">
              {price(product.price_paise)}
              {product.compare_at_paise && (
                <span className="text-base font-normal text-taupe line-through">
                  {price(product.compare_at_paise)}
                </span>
              )}
            </p>

            {product.summary && (
              <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-bark">
                {product.summary}
              </p>
            )}

            <AddToCart product={product} />

            {product.description && (
              <div className="mt-10 max-w-[58ch] space-y-4 leading-relaxed text-bark">
                {product.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {details.length > 0 && (
              <dl className="mt-10 divide-y divide-sand border-y border-sand text-sm">
                {details.map(([term, value]) => (
                  <div key={term} className="grid grid-cols-[7rem_1fr] gap-4 py-3">
                    <dt className="font-semibold text-bark">{term}</dt>
                    <dd className="text-cocoa">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-2xl">Worked in the same spirit</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
