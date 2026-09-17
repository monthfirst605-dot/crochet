# Moon & Thread

A crochet shop: a public storefront plus a separate password-protected admin panel
for products, photos, categories and orders. Postgres on Neon.

```
/                      home
/shop                  listing with category filter, search, sort, pagination
/shop/[slug]           product page, gallery, options, add to cart
/cart  /checkout       cart and checkout
/order/[number]        the customer's receipt (unguessable URL)

/admin                 overview          ← everything below is behind a login
/admin/products        list, publish/unpublish
/admin/products/new    add a product with photos
/admin/products/[id]   edit, manage photos, delete
/admin/categories      add/edit/delete categories
/admin/orders          orders with status updates
```

## The database, first

Money is `integer` paise everywhere. Never floats, never `numeric` rounding
surprises at checkout. `189000` is ₹1,890.

**Six tables.**

| Table | Holds | Notes |
|---|---|---|
| `categories` | Bags, Wearables, Home… | `position` controls the order they appear in |
| `products` | one row per listing | price, stock, copy, and a generated `search_tsv` |
| `product_images` | many rows per product | `position` 0 is the card/primary photo |
| `admin_users` | shop logins | PBKDF2 hashes, never plaintext |
| `orders` | one row per checkout | totals recomputed server-side at checkout |
| `order_items` | lines of an order | snapshots the name, price and photo |

**Three decisions worth stating.**

*No variants table.* The obvious e-commerce move is
`products → variants → inventory`, one row per colour × size. For a studio making
one piece at a time that table is mostly empty rows: a mustard tote in size M
isn't a separate SKU you keep stock of, it's an instruction for what to make.
So colour/size live in `products.options` (JSONB) as choices the shopper picks,
and the chosen values ride along on the order line in `order_items.options`.
Stock stays at the product level. If Moon & Thread ever holds real per-colour
inventory, the migration is additive: create `product_variants`, backfill one
variant per product, and point `order_items.variant_id` at it. Nothing here has
to be undone.

*Order lines are snapshots.* `order_items` stores `name_snapshot`,
`unit_price_paise` and `image_snapshot` rather than reading them through
`product_id`. Raise a price next month and last month's orders still say what the
customer actually paid. `product_id` is kept for reporting and is
`on delete set null`, so deleting a product never deletes order history.

*Checkout is one SQL statement.* The order, its items and the stock decrement
happen in a single `WITH … INSERT … INSERT … UPDATE` (see
`src/app/checkout/actions.ts`). There is no window in which an order exists
without its items.

Indexes cover the queries that actually run: `(is_active, created_at desc)` for
the shop grid, `(category_id, is_active, created_at desc)` for filtering, a GIN
index on `search_tsv` for search, and `(product_id, position)` for galleries.

## The stack, and why it's quick

- **Next.js 15 App Router**, React Server Components. The storefront ships almost
  no JavaScript — only the cart, the gallery and the admin forms are client code.
- **Neon's HTTP driver** (`@neondatabase/serverless`). One HTTP round trip per
  query, no pool to warm up, so a cold serverless request isn't waiting on a
  TCP+TLS handshake to Postgres.
- **Cached reads, tagged.** Every public query is wrapped in `unstable_cache`
  with the `catalog` tag, so pages are served from cache and the database is hit
  rarely. Saving anything in the admin calls `revalidateTag("catalog")` and the
  site updates within a second — no rebuild, no waiting for a cron.
- **Prices are never trusted from the browser.** Checkout re-reads every price
  and stock level from Postgres before writing the order.
- **Tailwind v4**, no runtime CSS-in-JS. **next/image** with AVIF/WebP.

## Setup

```bash
cp .env.example .env.local     # fill in DATABASE_URL and AUTH_SECRET
npm install

npm run db:setup               # creates the tables (needs Node 22+)
npm run db:seed                # optional sample products

npm run admin:create -- you@moonandthread.in "a-long-password" "Your Name"
npm run dev                    # http://localhost:3000, admin at /admin
```

If your Node is older than 22, run the SQL directly instead:
`psql "$DATABASE_URL" -f db/schema.sql`.

**Environment variables**

| Name | Why |
|---|---|
| `DATABASE_URL` | Neon connection string. Use the **pooled** one (`-pooler` in the host). |
| `AUTH_SECRET` | 32+ random characters. Signs the admin cookie. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | Cloudflare R2, for photo uploads. Without these you can still paste image URLs in the admin form. |
| `NEXT_PUBLIC_WHATSAPP` | Country code + number, e.g. `919000000000`. |
| `SHIPPING_FLAT_PAISE` | Flat shipping, default ₹99. |
| `FREE_SHIPPING_OVER_PAISE` | Free above this subtotal, default ₹2,000. |

## Admin panel

Sign in at `/admin/login`. The session is an HttpOnly cookie signed with
`AUTH_SECRET`; `src/middleware.ts` checks the signature on every `/admin` request
before the page renders, and each server action re-checks it, so a stale tab
can't write anything.

Adding a product: name, price and one photo are enough. Everything else —
materials, care, size, colour choices — shows up on the product page only if you
fill it in. Tick **Feature on home page** to put it on the front page.

Photos go to Cloudflare R2 (S3-compatible). To use a different store, replace
the one function in `src/lib/storage.ts`; nothing else touches storage.

## Deploying

Cloudflare Pages, via the OpenNext adapter (`@opennextjs/cloudflare`), since
this app uses Server Actions and middleware that a plain static export can't
run. Import the repo, set the build command to `npx @opennextjs/cloudflare build`,
add the environment variables including the R2 ones above, create the R2
bucket, deploy. Neon's pooled connection string is what you want in production.

Vercel, Netlify, Render, Fly or a plain `next start` on a VPS all work too —
nothing here is Cloudflare-specific except the storage function.

## What isn't built yet

- **Online payment.** Checkout records cash-on-delivery or "UPI, link sent on
  WhatsApp". Razorpay drops in at one place: after the order row is created in
  `src/app/checkout/actions.ts`, create a Razorpay order with the same
  `total_paise`, and set `payment_status = 'paid'` from their webhook.
- **Transactional email.** No email is sent on checkout; the receipt is the
  order URL. Resend or Amazon SES would slot into the same action.
- **Multiple admins with roles.** `admin_users` supports many rows, but everyone
  who can sign in can do everything.
