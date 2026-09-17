import Link from "next/link";
import { adminListOrders } from "@/lib/queries";
import { updateOrderStatus, markOrderPaid } from "../actions";
import { price, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const statuses = ["pending", "confirmed", "making", "shipped", "delivered", "cancelled"];

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const orders = await adminListOrders(statuses.includes(status ?? "") ? status : undefined);

  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders"
              className={`rounded-full px-4 py-1.5 ${status ? "border border-sand text-bark" : "bg-cocoa text-shell"}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`}
                className={`rounded-full px-4 py-1.5 ${
                  status === s ? "bg-cocoa text-shell" : "border border-sand text-bark hover:border-bark"
                }`}>
            {s}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-sand p-12 text-center text-bark">
          Nothing here yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-sand bg-white p-5">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="font-display text-lg">{order.order_number}</span>
                <span>{order.customer_name}</span>
                <a href={`tel:${order.phone}`} className="text-sm text-bark hover:text-cocoa">
                  {order.phone}
                </a>
                <span className="text-sm text-bark">{shortDate(order.created_at)}</span>
                <span className="ml-auto font-semibold">{price(order.total_paise)}</span>
              </div>

              <p className="mt-2 text-sm text-bark">
                {order.item_count} item{order.item_count === 1 ? "" : "s"} ·{" "}
                {order.address_line1}, {order.city}, {order.state} {order.postal_code} ·{" "}
                {order.payment_method.toUpperCase()} ({order.payment_status})
              </p>

              {order.customer_note && (
                <p className="mt-2 rounded-lg bg-linen px-4 py-2 text-sm">
                  {order.customer_note}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <form action={updateOrderStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <label className="sr-only" htmlFor={`status-${order.id}`}>Order status</label>
                  <select id={`status-${order.id}`} name="status" defaultValue={order.status}
                          className="field w-40 py-1.5">
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="rounded-full border border-bark px-4 py-1.5 text-sm hover:bg-bark hover:text-shell">
                    Update
                  </button>
                </form>

                {order.payment_status !== "paid" && (
                  <form action={markOrderPaid}>
                    <input type="hidden" name="id" value={order.id} />
                    <button className="text-sm text-bark underline underline-offset-4 hover:text-cocoa">
                      Mark as paid
                    </button>
                  </form>
                )}

                <Link href={`/order/${order.order_number}`}
                      className="text-sm text-bark underline underline-offset-4 hover:text-cocoa">
                  Customer&apos;s receipt
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
