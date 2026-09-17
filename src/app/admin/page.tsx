import Link from "next/link";
import { adminStats, adminListOrders } from "@/lib/queries";
import { price, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [stats, orders] = await Promise.all([adminStats(), adminListOrders()]);
  const recent = orders.slice(0, 5);

  const tiles = [
    { label: "Live products", value: stats.live_products, href: "/admin/products" },
    { label: "Drafts", value: stats.draft_products, href: "/admin/products" },
    { label: "Out of stock", value: stats.out_of_stock, href: "/admin/products" },
    { label: "Orders waiting", value: stats.pending_orders, href: "/admin/orders" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl">Overview</h1>
        <Link href="/admin/products/new"
              className="rounded-full bg-sun px-5 py-2 font-semibold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)]">
          Add a product
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href}
                className="rounded-2xl border border-sand bg-white p-5 hover:border-bark">
            <p className="font-display text-4xl">{tile.value}</p>
            <p className="mt-1 text-sm text-bark">{tile.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-cocoa p-6 text-linen">
        <p className="text-sm text-linen/70">Sales in the last 30 days</p>
        <p className="mt-1 font-display text-4xl text-shell">{price(stats.revenue_30d)}</p>
      </div>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm text-bark hover:text-cocoa">All orders</Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-sand p-8 text-center text-bark">
            No orders yet. They land here the moment someone checks out.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-sand rounded-2xl border border-sand bg-white">
            {recent.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
                <span className="font-semibold">{order.order_number}</span>
                <span>{order.customer_name}</span>
                <span className="text-bark">{shortDate(order.created_at)}</span>
                <span className="ml-auto font-semibold">{price(order.total_paise)}</span>
                <span className="rounded-full bg-linen px-3 py-0.5 text-xs">{order.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
