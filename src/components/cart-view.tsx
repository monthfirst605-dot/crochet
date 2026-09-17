"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, lineKey } from "./cart-store";
import { price } from "@/lib/format";

export function CartView() {
  const { lines, setQuantity, remove, subtotal, ready } = useCart();

  if (!ready) return <p className="mt-10 text-bark">Opening your cart…</p>;

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-pebble border border-dashed border-sand p-12 text-center">
        <p className="font-display text-2xl">Nothing in here yet</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-cocoa px-6 py-2.5 font-semibold text-shell"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <ul className="divide-y divide-sand border-y border-sand">
        {lines.map((line) => {
          const key = lineKey(line);
          return (
            <li key={key} className="flex gap-4 py-5">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-linen">
                {line.image && (
                  <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link href={`/shop/${line.slug}`} className="font-display text-lg">
                  {line.name}
                </Link>
                {Object.keys(line.options).length > 0 && (
                  <p className="mt-0.5 text-sm text-bark">
                    {Object.entries(line.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-sand">
                    <button
                      type="button"
                      onClick={() => setQuantity(key, line.quantity - 1)}
                      aria-label={`Fewer ${line.name}`}
                      className="h-8 w-8 rounded-l-full text-lg leading-none hover:bg-linen"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(key, line.quantity + 1)}
                      aria-label={`More ${line.name}`}
                      className="h-8 w-8 rounded-r-full text-lg leading-none hover:bg-linen"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(key)}
                    className="text-sm text-bark underline underline-offset-4 hover:text-cocoa"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 font-semibold">{price(line.pricePaise * line.quantity)}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
        <p className="text-bark">
          Subtotal <span className="ml-2 text-xl font-semibold text-cocoa">{price(subtotal)}</span>
          <br />
          <span className="text-sm">Shipping is added at checkout.</span>
        </p>
        <Link
          href="/checkout"
          className="rounded-full bg-sun px-8 py-3 font-semibold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)]"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
