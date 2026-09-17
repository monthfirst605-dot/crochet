import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { getCategories, getFeaturedProducts } from "@/lib/queries";

export const revalidate = 3600;

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(6),
    getCategories(),
  ]);
  const hero = featured.find((p) => p.image_url) ?? featured[0];

  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-linen">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.05fr_0.95fr] md:pb-20 md:pt-20">
            <div>
              <h1 className="font-display text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.05]">
                Yarn goes in.
                <br />
                Something you keep
                <br />
                comes out.
              </h1>
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-bark">
                Bags, wearables and home pieces crocheted one at a time in small
                batches. Pick something ready to ship, or have it worked to your
                measurements.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  href="/shop"
                  className="rounded-full bg-cocoa px-7 py-3 font-semibold text-shell transition-transform hover:-translate-y-0.5"
                >
                  See what&apos;s ready
                </Link>
                <Link href="/about" className="link-sun font-medium">
                  How it&apos;s made
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              {/* Arch frame — the doorway shape a finished piece gets photographed in. */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-pebble bg-sand">
                {hero?.image_url ? (
                  <Image
                    src={hero.image_url}
                    alt={hero.image_alt ?? hero.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 384px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center px-8 text-center text-sm text-bark">
                    Add a featured product in the admin panel and its photo lands here.
                  </div>
                )}
              </div>

              {hero && (
                <Link
                  href={`/shop/${hero.slug}`}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sun px-5 py-2 text-sm font-bold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)]"
                >
                  {hero.name}
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="trim" style={{ "--trim": "var(--color-linen)" } as React.CSSProperties} />

        {categories.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 pt-16">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-sand bg-white px-5 py-2 text-sm text-bark transition-colors hover:border-bark hover:text-cocoa"
                >
                  {category.name}
                  <span className="ml-2 text-taupe">{category.product_count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-5 pt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl">Ready to go home with you</h2>
            <Link href="/shop" className="link-sun text-sm font-medium">
              Everything in the shop
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="mt-8 rounded-pebble border border-dashed border-sand p-10 text-center text-bark">
              Nothing is marked featured yet. Open the admin panel, tick{" "}
              <span className="font-semibold">Feature on home page</span> on a product,
              and it shows up here.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto mt-20 max-w-6xl px-5">
          <div className="rounded-pebble bg-bark px-8 py-12 text-linen sm:px-14">
            <h2 className="max-w-[20ch] font-display text-3xl text-shell">
              Want it in your size, in your colour?
            </h2>
            <p className="mt-4 max-w-[52ch] leading-relaxed text-linen/85">
              Send your measurements and the shade you have in mind. Made-to-order
              pieces take about three weeks, and you see progress photos before it ships.
            </p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? ""}`}
              className="mt-7 inline-block rounded-full bg-sun px-7 py-3 font-semibold text-cocoa"
            >
              Start a custom order
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
