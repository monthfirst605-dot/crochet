-- Moon & Thread — Postgres schema (Neon)
-- Run once:  psql "$DATABASE_URL" -f db/schema.sql
-- Money is stored as INTEGER paise. Never floats for money.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------- helpers
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------- categories
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  slug        citext      not null unique,
  description text,
  image_url   text,
  position    integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists categories_active_position_idx
  on categories (is_active, position, name);

drop trigger if exists categories_touch on categories;
create trigger categories_touch before update on categories
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- products
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references categories(id) on delete set null,

  name              text        not null,
  slug              citext      not null unique,
  summary           text,                 -- one line, shown on cards
  description       text,                 -- long copy, product page
  materials         text,                 -- "100% cotton yarn, coconut shell buttons"
  dimensions        text,                 -- "38 x 34 cm, 12 cm handle drop"
  care              text,                 -- wash / care instructions

  price_paise       integer     not null check (price_paise >= 0),
  compare_at_paise  integer              check (compare_at_paise is null
                                               or compare_at_paise > price_paise),
  sku               text unique,

  stock             integer     not null default 0 check (stock >= 0),
  is_made_to_order  boolean     not null default false,
  lead_time_days    integer,

  -- Customer-selectable choices that do NOT hold their own inventory, e.g.
  -- [{"name":"Colour","values":["Ecru","Mustard","Cocoa"]},
  --  {"name":"Size","values":["S","M","L"]}]
  -- See "Why not a variants table?" in README.md.
  options           jsonb       not null default '[]'::jsonb,

  is_active         boolean     not null default true,
  is_featured       boolean     not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')),        'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')),     'B') ||
    setweight(to_tsvector('english', coalesce(materials, '')),   'C') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'D')
  ) stored
);

create index if not exists products_live_idx      on products (is_active, created_at desc);
create index if not exists products_category_idx  on products (category_id, is_active, created_at desc);
create index if not exists products_featured_idx  on products (is_featured, created_at desc) where is_active;
create index if not exists products_search_idx    on products using gin (search_tsv);

drop trigger if exists products_touch on products;
create trigger products_touch before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- images
create table if not exists product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  alt        text,
  width      integer,
  height     integer,
  position   integer not null default 0,   -- position 0 is the card/primary image
  created_at timestamptz not null default now()
);

create index if not exists product_images_order_idx on product_images (product_id, position);

-- ---------------------------------------------------------------- admin
create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  name          text,
  password_hash text   not null,          -- pbkdf2$<iters>$<salt_b64>$<hash_b64>
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- ---------------------------------------------------------------- orders
create sequence if not exists order_number_seq start 1001;

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  -- e.g. MT-26-1042-7f3a. The random tail keeps the tracking URL unguessable.
  order_number   text not null unique
                 default 'MT-' || to_char(now(), 'YY') || '-' || nextval('order_number_seq')
                              || '-' || encode(gen_random_bytes(2), 'hex'),

  customer_name  text not null,
  email          text not null,
  phone          text not null,

  address_line1  text not null,
  address_line2  text,
  city           text not null,
  state          text not null,
  postal_code    text not null,
  country        text not null default 'India',

  subtotal_paise integer not null check (subtotal_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  total_paise    integer not null check (total_paise >= 0),

  status         text not null default 'pending'
                 check (status in ('pending','confirmed','making','shipped','delivered','cancelled')),
  payment_method text not null default 'cod'
                 check (payment_method in ('cod','upi','bank_transfer')),
  payment_status text not null default 'unpaid'
                 check (payment_status in ('unpaid','paid','refunded')),

  customer_note  text,
  internal_note  text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_recent_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status, created_at desc);

drop trigger if exists orders_touch on orders;
create trigger orders_touch before update on orders
  for each row execute function set_updated_at();

-- Line items keep a snapshot of name/price/image so an edited or deleted
-- product never rewrites the history of an order that was already placed.
create table if not exists order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  product_id       uuid references products(id) on delete set null,

  name_snapshot    text    not null,
  image_snapshot   text,
  unit_price_paise integer not null check (unit_price_paise >= 0),
  quantity         integer not null check (quantity > 0),
  options          jsonb   not null default '{}'::jsonb,   -- {"Colour":"Mustard"}
  line_total_paise integer not null check (line_total_paise >= 0)
);

create index if not exists order_items_order_idx on order_items (order_id);
