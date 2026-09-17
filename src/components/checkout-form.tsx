"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "./cart-store";
import { placeOrder } from "@/app/checkout/actions";
import { price } from "@/lib/format";

export function CheckoutForm({
  shippingPaise,
  freeOverPaise,
}: {
  shippingPaise: number;
  freeOverPaise: number;
}) {
  const { lines, subtotal, clear, ready } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const shipping = subtotal >= freeOverPaise ? 0 : shippingPaise;

  if (ready && lines.length === 0) {
    return (
      <div className="mt-10 rounded-pebble border border-dashed border-sand p-12 text-center">
        <p className="font-display text-2xl">Your cart is empty</p>
        <Link href="/shop" className="mt-6 inline-block link-sun font-medium">
          Find something first
        </Link>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await placeOrder({
        customer_name: String(data.get("customer_name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        address_line1: String(data.get("address_line1") ?? ""),
        address_line2: String(data.get("address_line2") ?? ""),
        city: String(data.get("city") ?? ""),
        state: String(data.get("state") ?? ""),
        postal_code: String(data.get("postal_code") ?? ""),
        payment_method: data.get("payment_method") === "upi" ? "upi" : "cod",
        customer_note: String(data.get("customer_note") ?? ""),
        lines,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      clear();
      router.push(`/order/${result.orderNumber}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="customer_name">Full name</label>
            <input id="customer_name" name="customer_name" required autoComplete="name" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Mobile number</label>
            <input id="phone" name="phone" required inputMode="tel" autoComplete="tel"
                   placeholder="9876543210" className="field" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>

        <div>
          <label className="label" htmlFor="address_line1">Address</label>
          <input id="address_line1" name="address_line1" required autoComplete="address-line1"
                 placeholder="House and street" className="field" />
          <input name="address_line2" autoComplete="address-line2" placeholder="Landmark, area (optional)"
                 className="field mt-3" />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="city">City</label>
            <input id="city" name="city" required autoComplete="address-level2" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="state">State</label>
            <input id="state" name="state" required autoComplete="address-level1" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="postal_code">PIN code</label>
            <input id="postal_code" name="postal_code" required inputMode="numeric"
                   autoComplete="postal-code" className="field" />
          </div>
        </div>

        <fieldset>
          <legend className="label">How you&apos;ll pay</legend>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-3 rounded-lg border border-sand bg-white p-3">
              <input type="radio" name="payment_method" value="cod" defaultChecked />
              Cash on delivery
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-sand bg-white p-3">
              <input type="radio" name="payment_method" value="upi" />
              UPI — we send a payment link on WhatsApp to confirm
            </label>
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="customer_note">Anything we should know?</label>
          <textarea id="customer_note" name="customer_note" rows={3}
                    placeholder="Measurements, gift note, delivery timing" className="field" />
        </div>
      </div>

      <aside className="h-fit rounded-pebble bg-linen p-6">
        <h2 className="font-display text-xl">Your order</h2>

        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((line) => (
            <li key={`${line.productId}-${JSON.stringify(line.options)}`} className="flex justify-between gap-3">
              <span>
                {line.name}
                <span className="text-bark"> × {line.quantity}</span>
                {Object.keys(line.options).length > 0 && (
                  <span className="block text-xs text-bark">
                    {Object.values(line.options).join(" · ")}
                  </span>
                )}
              </span>
              <span className="shrink-0">{price(line.pricePaise * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-sand pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{price(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{shipping === 0 ? "Free" : price(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-sand pt-3 text-lg font-semibold">
            <dt>Total</dt><dd>{price(subtotal + shipping)}</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-cocoa px-4 py-3 text-sm text-shell">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-sun px-6 py-3 font-semibold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)] disabled:opacity-60"
        >
          {pending ? "Placing your order…" : "Place order"}
        </button>
        <p className="mt-3 text-xs text-bark">
          Nothing is charged online. We confirm on WhatsApp before anything ships.
        </p>
      </aside>
    </form>
  );
}
