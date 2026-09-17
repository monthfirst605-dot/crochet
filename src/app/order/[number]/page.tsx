import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getOrderByNumber } from "@/lib/queries";
import { price, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order placed", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await getOrderByNumber(number);
  if (!order) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="inline-block rounded-full bg-sun px-4 py-1 text-sm font-bold text-cocoa">
          Order {order.order_number}
        </p>
        <h1 className="mt-5 font-display text-4xl">Thank you, {order.customer_name.split(" ")[0]}.</h1>
        <p className="mt-4 leading-relaxed text-bark">
          Placed {shortDate(order.created_at)}. We&apos;ll message {order.phone} to confirm
          the details before anything is packed. Keep this link — it&apos;s your receipt.
        </p>

        <ul className="mt-10 divide-y divide-sand border-y border-sand">
          {order.items?.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-4">
              <span>
                {item.name_snapshot}
                <span className="text-bark"> × {item.quantity}</span>
                {Object.keys(item.options ?? {}).length > 0 && (
                  <span className="block text-sm text-bark">
                    {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-semibold">{price(item.line_total_paise)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{price(order.subtotal_paise)}</dd></div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shipping_paise === 0 ? "Free" : price(order.shipping_paise)}</dd>
          </div>
          <div className="flex justify-between text-lg font-semibold"><dt>Total</dt><dd>{price(order.total_paise)}</dd></div>
        </dl>

        <address className="mt-10 not-italic text-sm leading-relaxed text-bark">
          Shipping to
          <br />
          {order.address_line1}
          {order.address_line2 && <>, {order.address_line2}</>}
          <br />
          {order.city}, {order.state} {order.postal_code}
        </address>

        <Link href="/shop" className="mt-10 inline-block link-sun font-medium">
          Keep browsing
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
