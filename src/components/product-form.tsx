"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProduct, type FormState } from "@/app/admin/actions";
import { paiseToRupees, slugify } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

type OptionRow = { name: string; values: string };

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [madeToOrder, setMadeToOrder] = useState(product?.is_made_to_order ?? false);
  const [options, setOptions] = useState<OptionRow[]>(
    (product?.options ?? []).map((o) => ({ name: o.name, values: o.values.join(", ") })),
  );

  const optionsJson = JSON.stringify(
    options
      .filter((o) => o.name.trim() && o.values.trim())
      .map((o) => ({
        name: o.name.trim(),
        values: o.values.split(",").map((v) => v.trim()).filter(Boolean),
      })),
  );

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="options" value={optionsJson} />

      <div className="space-y-6">
        <section className="rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-xl">The basics</h2>

          <div className="mt-5 space-y-5">
            <div>
              <label className="label" htmlFor="name">Product name</label>
              <input
                id="name" name="name" required className="field" value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!product) setSlug(slugify(e.target.value));
                }}
              />
            </div>

            <div>
              <label className="label" htmlFor="slug">Web address</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-taupe">/shop/</span>
                <input id="slug" name="slug" className="field" value={slug}
                       onChange={(e) => setSlug(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="summary">One-line summary</label>
              <input id="summary" name="summary" className="field" maxLength={160}
                     defaultValue={product?.summary ?? ""}
                     placeholder="Shown under the name on shop cards" />
            </div>

            <div>
              <label className="label" htmlFor="description">Description</label>
              <textarea id="description" name="description" rows={6} className="field"
                        defaultValue={product?.description ?? ""}
                        placeholder="Blank lines start a new paragraph." />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-xl">Photos</h2>
          <p className="mt-1 text-sm text-bark">
            The first photo is the one shoppers see on the shop grid. JPG or PNG, up to 8 MB each.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="images">Upload files</label>
              <input id="images" name="images" type="file" accept="image/*" multiple
                     className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-cocoa file:px-4 file:py-2 file:text-shell" />
            </div>
            <div>
              <label className="label" htmlFor="image_urls">…or paste image links</label>
              <textarea id="image_urls" name="image_urls" rows={2} className="field"
                        placeholder="https://… (one per line)" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-xl">Details on the product page</h2>
          <div className="mt-5 space-y-5">
            <div>
              <label className="label" htmlFor="materials">Materials</label>
              <input id="materials" name="materials" className="field"
                     defaultValue={product?.materials ?? ""} placeholder="100% cotton yarn" />
            </div>
            <div>
              <label className="label" htmlFor="dimensions">Size</label>
              <input id="dimensions" name="dimensions" className="field"
                     defaultValue={product?.dimensions ?? ""} placeholder="38 x 34 cm" />
            </div>
            <div>
              <label className="label" htmlFor="care">Care</label>
              <input id="care" name="care" className="field"
                     defaultValue={product?.care ?? ""} placeholder="Hand wash cold, dry flat" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Choices for the shopper</h2>
            <button type="button"
                    onClick={() => setOptions([...options, { name: "", values: "" }])}
                    className="rounded-full border border-bark px-3 py-1 text-sm hover:bg-bark hover:text-shell">
              Add a choice
            </button>
          </div>
          <p className="mt-1 text-sm text-bark">
            Colour, size and so on. These don&apos;t track stock separately — they come
            through on the order so you know what to make.
          </p>

          <div className="mt-4 space-y-3">
            {options.length === 0 && <p className="text-sm text-taupe">No choices set.</p>}
            {options.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_2fr_auto] items-center gap-3">
                <input
                  className="field" placeholder="Colour" value={row.name}
                  onChange={(e) => setOptions(options.map((o, i) =>
                    i === index ? { ...o, name: e.target.value } : o))}
                />
                <input
                  className="field" placeholder="Ecru, Cocoa, Mustard" value={row.values}
                  onChange={(e) => setOptions(options.map((o, i) =>
                    i === index ? { ...o, values: e.target.value } : o))}
                />
                <button type="button" aria-label="Remove this choice"
                        onClick={() => setOptions(options.filter((_, i) => i !== index))}
                        className="px-2 text-bark hover:text-cocoa">✕</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-xl">Price and stock</h2>
          <div className="mt-5 space-y-5">
            <div>
              <label className="label" htmlFor="price">Price (₹)</label>
              <input id="price" name="price" required inputMode="decimal" className="field"
                     defaultValue={paiseToRupees(product?.price_paise)} placeholder="1890" />
            </div>
            <div>
              <label className="label" htmlFor="compare_at">Was (₹, optional)</label>
              <input id="compare_at" name="compare_at" inputMode="decimal" className="field"
                     defaultValue={paiseToRupees(product?.compare_at_paise)} />
            </div>
            <div>
              <label className="label" htmlFor="sku">SKU (optional)</label>
              <input id="sku" name="sku" className="field" defaultValue={product?.sku ?? ""} />
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="is_made_to_order" defaultChecked={madeToOrder}
                     onChange={(e) => setMadeToOrder(e.target.checked)} />
              Made to order
            </label>

            {madeToOrder ? (
              <div>
                <label className="label" htmlFor="lead_time_days">Ready in (days)</label>
                <input id="lead_time_days" name="lead_time_days" type="number" min={1}
                       className="field" defaultValue={product?.lead_time_days ?? 21} />
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="stock">How many you have</label>
                <input id="stock" name="stock" type="number" min={0} className="field"
                       defaultValue={product?.stock ?? 1} />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6">
          <h2 className="font-display text-xl">Where it appears</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" className="field"
                      defaultValue={product?.category_id ?? ""}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} />
              Live in the shop
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} />
              Feature on home page
            </label>
          </div>
        </section>

        {state.error && (
          <p role="alert" className="rounded-xl bg-cocoa px-4 py-3 text-sm text-shell">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending}
                  className="rounded-full bg-sun px-7 py-3 font-semibold text-cocoa shadow-[0_2px_0_var(--color-sun-deep)] disabled:opacity-60">
            {pending ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
          <Link href="/admin/products" className="text-sm text-bark hover:text-cocoa">Cancel</Link>
        </div>
      </aside>
    </form>
  );
}
