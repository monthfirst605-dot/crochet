"use server";

import { revalidateTag } from "next/cache";
import { sql } from "@/lib/db";
import { getPricesForIds, CATALOG_TAG, ORDERS_TAG } from "@/lib/queries";
import type { CartLine } from "@/lib/types";

export type CheckoutInput = {
  customer_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  payment_method: "cod" | "upi";
  customer_note?: string;
  lines: CartLine[];
};

export type CheckoutResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

const SHIPPING = Number(process.env.SHIPPING_FLAT_PAISE ?? 9900);
const FREE_OVER = Number(process.env.FREE_SHIPPING_OVER_PAISE ?? 200000);

function validate(input: CheckoutInput): string | null {
  if (!input.lines?.length) return "Your cart is empty.";
  if (!input.customer_name?.trim()) return "Add the name the parcel should go to.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email ?? "")) return "That email address doesn't look right.";
  if (!/^[6-9]\d{9}$/.test((input.phone ?? "").replace(/\D/g, "").slice(-10))) {
    return "Enter a 10-digit Indian mobile number.";
  }
  if (!input.address_line1?.trim()) return "Add a street address.";
  if (!input.city?.trim()) return "Add a city.";
  if (!input.state?.trim()) return "Add a state.";
  if (!/^\d{6}$/.test(input.postal_code ?? "")) return "PIN code should be 6 digits.";
  return null;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const problem = validate(input);
  if (problem) return { ok: false, error: problem };

  // Prices and availability are re-read from the database. Whatever the browser
  // sent as a price is ignored.
  const ids = [...new Set(input.lines.map((l) => l.productId))];
  const live = await getPricesForIds(ids);
  const byId = new Map(live.map((p) => [p.id, p]));

  const items = [];
  for (const line of input.lines) {
    const product = byId.get(line.productId);
    if (!product || !product.is_active) {
      return { ok: false, error: `${line.name} is no longer available. Remove it and try again.` };
    }
    const quantity = Math.max(1, Math.min(99, Math.trunc(line.quantity)));
    if (!product.is_made_to_order && product.stock < quantity) {
      return {
        ok: false,
        error:
          product.stock === 0
            ? `${product.name} just sold out.`
            : `Only ${product.stock} of ${product.name} left.`,
      };
    }
    items.push({
      product_id: product.id,
      name_snapshot: product.name,
      image_snapshot: product.image_url,
      unit_price_paise: product.price_paise,
      quantity,
      options: line.options ?? {},
      line_total_paise: product.price_paise * quantity,
    });
  }

  const subtotal = items.reduce((n, i) => n + i.line_total_paise, 0);
  const shipping = subtotal >= FREE_OVER ? 0 : SHIPPING;
  const total = subtotal + shipping;

  // One statement, so an order can never exist without its items.
  const stockMoves = Object.entries(
    items.reduce<Record<string, number>>((acc, i) => {
      acc[i.product_id] = (acc[i.product_id] ?? 0) + i.quantity;
      return acc;
    }, {}),
  ).map(([product_id, quantity]) => ({ product_id, quantity }));

  const rows = await sql.query(
    `with new_order as (
       insert into orders (customer_name, email, phone, address_line1, address_line2,
                           city, state, postal_code, subtotal_paise, shipping_paise,
                           total_paise, payment_method, customer_note)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       returning id, order_number
     ),
     new_items as (
       insert into order_items (order_id, product_id, name_snapshot, image_snapshot,
                                unit_price_paise, quantity, options, line_total_paise)
       select o.id, x.product_id, x.name_snapshot, x.image_snapshot,
              x.unit_price_paise, x.quantity, x.options, x.line_total_paise
       from new_order o, jsonb_to_recordset($14::jsonb) as x(
         product_id uuid, name_snapshot text, image_snapshot text,
         unit_price_paise int, quantity int, options jsonb, line_total_paise int
       )
       returning 1
     ),
     stock_moves as (
       update products p
          set stock = greatest(p.stock - m.quantity, 0)
       from jsonb_to_recordset($15::jsonb) as m(product_id uuid, quantity int)
       where p.id = m.product_id and not p.is_made_to_order
       returning 1
     )
     select order_number from new_order`,
    [
      input.customer_name.trim(),
      input.email.trim().toLowerCase(),
      input.phone.replace(/\D/g, "").slice(-10),
      input.address_line1.trim(),
      input.address_line2?.trim() || null,
      input.city.trim(),
      input.state.trim(),
      input.postal_code.trim(),
      subtotal,
      shipping,
      total,
      input.payment_method === "upi" ? "upi" : "cod",
      input.customer_note?.trim() || null,
      JSON.stringify(items),
      JSON.stringify(stockMoves),
    ],
  );

  const orderNumber = (rows as { order_number: string }[])[0]?.order_number;
  if (!orderNumber) return { ok: false, error: "The order didn't save. Nothing was charged — try again." };

  revalidateTag(CATALOG_TAG);   // stock changed
  revalidateTag(ORDERS_TAG);
  return { ok: true, orderNumber };
}

export async function quoteShipping(subtotal: number) {
  return subtotal >= FREE_OVER ? 0 : SHIPPING;
}
