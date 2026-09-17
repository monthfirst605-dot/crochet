"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-store";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [choices, setChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0] ?? ""])),
  );
  const [added, setAdded] = useState(false);

  const soldOut = !product.is_made_to_order && product.stock <= 0;
  const image = product.images[0]?.url ?? null;

  function addToCart() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image,
      pricePaise: product.price_paise,
      quantity: 1,
      options: choices,
    });
    setAdded(true);
  }

  return (
    <div className="mt-8">
      {product.options.map((option) => (
        <fieldset key={option.name} className="mb-5">
          <legend className="label">{option.name}</legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const active = choices[option.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChoices((c) => ({ ...c, [option.name]: value }))}
                  aria-pressed={active}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                    (active
                      ? "border-cocoa bg-cocoa text-shell"
                      : "border-sand bg-white text-bark hover:border-bark")
                  }
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut}
          className="rounded-full bg-sun px-7 py-3 font-semibold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-sand disabled:text-bark/60 disabled:shadow-none"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>

        {added && (
          <Link href="/cart" className="link-sun text-sm font-medium">
            Added — view cart
          </Link>
        )}
      </div>

      {product.is_made_to_order && product.lead_time_days && (
        <p className="mt-4 text-sm text-bark">
          Worked to order, ready to ship in about {product.lead_time_days} days.
        </p>
      )}
      {!product.is_made_to_order && product.stock > 0 && product.stock <= 3 && (
        <p className="mt-4 text-sm text-bark">
          {product.stock === 1 ? "Only one of these exists." : `${product.stock} left.`}
        </p>
      )}
    </div>
  );
}
