import Link from "next/link";

export function SiteFooter() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP;
  return (
    <footer className="mt-24">
      <div className="trim" style={{ "--trim": "var(--color-bark)" } as React.CSSProperties} />
      <div className="bg-bark text-linen">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl text-shell">Moon &amp; Thread</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-linen/80">
              Every piece is worked by hand, one at a time. Small batches, no two
              stitches counted twice.
            </p>
          </div>

          <div className="text-sm">
            <p className="mb-3 font-semibold text-shell">Shop</p>
            <ul className="space-y-2 text-linen/80">
              <li><Link href="/shop" className="hover:text-sun">All pieces</Link></li>
              <li><Link href="/shop?sort=new" className="hover:text-sun">Just listed</Link></li>
              <li><Link href="/cart" className="hover:text-sun">Your cart</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="mb-3 font-semibold text-shell">Say hello</p>
            <ul className="space-y-2 text-linen/80">
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} className="hover:text-sun">
                    Message us on WhatsApp
                  </a>
                </li>
              )}
              <li>Custom orders and sizing welcome.</li>
              <li>Ships across India.</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-linen/15">
          <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-linen/60">
            © {new Date().getFullYear()} Moon &amp; Thread. Handmade in India.
          </p>
        </div>
      </div>
    </footer>
  );
}
