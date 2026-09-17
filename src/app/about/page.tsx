import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "How it's made" };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-4xl">How it&apos;s made</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-bark">
          <p>
            Moon &amp; Thread is a one-person studio. Every bag, cardigan and throw
            here was worked stitch by stitch, usually over several evenings, and
            nothing is assembled from machine-made panels.
          </p>
          <p>
            Yarn is bought in small lots, so colours shift slightly between batches.
            If you want two pieces to match, order them together and they will be
            worked from the same lot.
          </p>
          <p>
            Ready pieces ship within two working days. Made-to-order pieces take
            about three weeks, and you will see photos before it goes in the box.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
