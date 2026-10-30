-- ============================================================================
--  MOSCOW — Supabase schema
--  Run once in the Supabase SQL editor, then put these in .env.local:
--
--    NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
--    SUPABASE_SERVICE_ROLE_KEY=<service role key>     # server only, never public
--    SUPABASE_STORAGE_BUCKET=mosco-media
--
--  The app flips from the local JSON store to Supabase automatically on the
--  next restart. No code changes are required.
--
--  SECURITY MODEL
--  Row Level Security is ON for every table with NO permissive policies for
--  `anon` or `authenticated`. That is deliberate: the browser never talks to
--  the database. All reads and writes go through Next.js server code using the
--  service-role key, which bypasses RLS. If the anon key ever leaks, it grants
--  nothing. Only the storage bucket is publicly readable, so product
--  photographs can be served from a CDN.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- products --
create table if not exists public.products (
  id                 text primary key,
  slug               text not null unique,
  sku                text not null,
  name               text not null,
  name_ar            text,
  subtitle           text,
  subtitle_ar        text,
  description        text not null default '',
  description_ar     text,
  details            jsonb not null default '[]'::jsonb,
  details_ar         jsonb not null default '[]'::jsonb,
  price              integer not null default 0,
  compare_at_price   integer,
  category           text not null default '',
  collections        jsonb not null default '[]'::jsonb,
  images             jsonb not null default '[]'::jsonb,
  colors             jsonb not null default '[]'::jsonb,
  sizes              jsonb not null default '[]'::jsonb,
  garment_type       text not null default 'top',
  intrinsic_fit      text not null default 'regular',
  size_note          text,
  size_note_ar       text,
  badges             jsonb not null default '[]'::jsonb,
  popularity         integer not null default 0,
  sold_count         integer not null default 0,
  status             text not null default 'draft',
  featured           boolean not null default false,
  seo_title          text,
  seo_description    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint products_status_check check (status in ('active','draft','archived')),
  constraint products_fit_check    check (intrinsic_fit in ('slim','regular','oversized')),
  constraint products_type_check   check (garment_type in ('top','bottom','set','accessory','footwear')),
  constraint products_price_check  check (price >= 0)
);

create index if not exists products_status_idx   on public.products (status);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_idx  on public.products (created_at desc);
create index if not exists products_collections_idx on public.products using gin (collections);

-- ------------------------------------------------------------- collections --
create table if not exists public.collections (
  id             text primary key,
  slug           text not null unique,
  name           text not null,
  name_ar        text,
  description    text,
  description_ar text,
  image          text,
  kind           text not null default 'collection',
  position       integer not null default 0,
  featured       boolean not null default false,
  visible        boolean not null default true,
  auto_badge     text,
  created_at     timestamptz not null default now(),
  constraint collections_kind_check check (kind in ('category','collection'))
);

create index if not exists collections_position_idx on public.collections (position asc);

-- --------------------------------------------------------------- customers --
create table if not exists public.customers (
  id            text primary key,
  email         text not null unique,
  phone         text not null default '',
  full_name     text not null default '',
  -- scrypt hash produced by the app ("scrypt$<salt>$<hash>"). Never a plaintext
  -- password, and never readable by any client role.
  password_hash text not null,
  role          text not null default 'customer',
  addresses     jsonb not null default '[]'::jsonb,
  wishlist      jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint customers_role_check check (role in ('customer','admin'))
);

create index if not exists customers_email_idx on public.customers (lower(email));

-- ------------------------------------------------------------------ orders --
create table if not exists public.orders (
  id                text primary key,
  order_number      text not null unique,
  customer_id       text references public.customers (id) on delete set null,
  full_name         text not null,
  phone             text not null,
  email             text,
  city              text not null,
  address           text not null,
  notes             text,
  items             jsonb not null default '[]'::jsonb,
  subtotal          integer not null default 0,
  shipping          integer not null default 0,
  discount          integer not null default 0,
  discount_code     text,
  total             integer not null default 0,
  payment_method    text not null default 'cod',
  payment_status    text not null default 'unpaid',
  payment_proof_url text,
  status            text not null default 'pending',
  timeline          jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_status_check  check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  constraint orders_payment_check check (payment_method in ('cod','instapay')),
  constraint orders_paystat_check check (payment_status in ('unpaid','proof_submitted','paid','refunded'))
);

create index if not exists orders_created_idx  on public.orders (created_at desc);
create index if not exists orders_status_idx   on public.orders (status);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_phone_idx    on public.orders (phone);

-- --------------------------------------------------------------- discounts --
create table if not exists public.discounts (
  id           text primary key,
  code         text not null unique,
  type         text not null default 'percent',
  value        numeric not null default 0,
  min_subtotal integer not null default 0,
  active       boolean not null default true,
  starts_at    timestamptz,
  expires_at   timestamptz,
  usage_limit  integer,
  used         integer not null default 0,
  created_at   timestamptz not null default now(),
  constraint discounts_type_check check (type in ('percent','fixed','free_shipping'))
);

create index if not exists discounts_code_idx on public.discounts (upper(code));

-- ---------------------------------------------------------------- settings --
-- Single row, id = 'settings'.
create table if not exists public.settings (
  id                        text primary key default 'settings',
  brand_name                text not null default 'MOSCOW',
  tagline                   text not null default '',
  tagline_ar                text,
  contact_email             text not null default '',
  contact_phone             text not null default '',
  whatsapp                  text,
  instagram                 text,
  tiktok                    text,
  address_line              text,
  address_line_ar           text,
  shipping_flat             integer not null default 80,
  free_shipping_threshold   integer not null default 5000,
  shipping_rates            jsonb not null default '[]'::jsonb,
  instapay_handle           text not null default '',
  instapay_name             text not null default '',
  instapay_instructions     text not null default '',
  instapay_instructions_ar  text,
  home_hero_title           text not null default '',
  home_hero_title_ar        text,
  home_hero_sub             text not null default '',
  home_hero_sub_ar          text,
  home_story_title          text not null default '',
  home_story_title_ar       text,
  home_story_body           text not null default '',
  home_story_body_ar        text,
  home_story_image          text,
  about_body                text,
  about_body_ar             text,
  banners                   jsonb not null default '[]'::jsonb,
  fit_ai                    jsonb not null default '{}'::jsonb,
  updated_at                timestamptz not null default now(),
  constraint settings_singleton check (id = 'settings')
);

-- -------------------------------------------------------- newsletter / msgs --
create table if not exists public.newsletter (
  id         text primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id         text primary key,
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_created_idx on public.messages (created_at desc);

-- ============================================================================
--  Atomic stock movement
--  `items` is [{"product_id":"…","size":"M","qty":2}, …].
--  A negative qty returns units to stock (used when an order is cancelled).
--  SECURITY INVOKER so it can never be called with more privilege than the
--  caller already has.
-- ============================================================================
create or replace function public.mosco_decrement_stock(items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  item        jsonb;
  v_product   text;
  v_size      text;
  v_qty       integer;
begin
  for item in select * from jsonb_array_elements(coalesce(items, '[]'::jsonb))
  loop
    v_product := item ->> 'product_id';
    v_size    := item ->> 'size';
    v_qty     := coalesce((item ->> 'qty')::integer, 0);

    if v_product is null or v_size is null or v_qty = 0 then
      continue;
    end if;

    update public.products p
       set sizes = (
             select jsonb_agg(
                      case
                        when row_value ->> 'size' = v_size then
                          jsonb_set(
                            row_value,
                            '{stock}',
                            to_jsonb(
                              greatest(0, coalesce((row_value ->> 'stock')::integer, 0) - v_qty)
                            )
                          )
                        else row_value
                      end
                      order by idx
                    )
             from jsonb_array_elements(p.sizes) with ordinality as t(row_value, idx)
           ),
           sold_count = greatest(0, coalesce(p.sold_count, 0) + v_qty),
           updated_at = now()
     where p.id = v_product;
  end loop;
end;
$$;

-- ============================================================================
--  Row Level Security — deny by default
--  Enabled everywhere, with no policies granted to anon/authenticated. Only the
--  service-role key (server-side only) can read or write.
-- ============================================================================
alter table public.products    enable row level security;
alter table public.collections enable row level security;
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.discounts   enable row level security;
alter table public.settings    enable row level security;
alter table public.newsletter  enable row level security;
alter table public.messages    enable row level security;

alter table public.products    force row level security;
alter table public.collections force row level security;
alter table public.customers   force row level security;
alter table public.orders      force row level security;
alter table public.discounts   force row level security;
alter table public.settings    force row level security;
alter table public.newsletter  force row level security;
alter table public.messages    force row level security;

-- Belt and braces: remove the default grants so a leaked anon key is inert.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- ----------------------------------------------------------------------------
--  OPTIONAL — public catalogue reads straight from the browser.
--  Only enable this if you later add client-side fetching. The app as shipped
--  does NOT need it, because every read happens in server components.
-- ----------------------------------------------------------------------------
-- grant select on public.products, public.collections to anon, authenticated;
-- create policy "public can read active products"
--   on public.products for select to anon, authenticated
--   using (status = 'active');
-- create policy "public can read visible collections"
--   on public.collections for select to anon, authenticated
--   using (visible = true);

-- ============================================================================
--  Storage bucket for product photography, banners and InstaPay proofs
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mosco-media',
  'mosco-media',
  true,
  8388608, -- 8 MB
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may READ media (images are served to shoppers from the CDN).
drop policy if exists "mosco media public read" on storage.objects;
create policy "mosco media public read"
  on storage.objects for select
  using (bucket_id = 'mosco-media');

-- Nobody may WRITE from a browser. Uploads go through /api/upload, which runs
-- on the server with the service-role key and checks the admin session first.
-- (Payment proofs are the one shopper-facing upload and still pass through that
-- route, so they are validated and re-encoded before they ever reach storage.)

-- ============================================================================
--  Seed: settings row + the eight collections.
--  Products are intentionally NOT seeded here — upload the real photographs and
--  create them in the admin dashboard, or let the app's own seeder run once.
-- ============================================================================
insert into public.settings (id) values ('settings')
on conflict (id) do nothing;

insert into public.collections (id, slug, name, name_ar, kind, position, featured, visible, auto_badge)
values
  ('col_new_arrivals', 'new-arrivals',  'New Arrivals',  'وصل حديثاً',     'collection', 1, true,  true,  'new'),
  ('col_best_sellers', 'best-sellers',  'Best Sellers',  'الأكثر مبيعاً',  'collection', 2, true,  true,  'bestseller'),
  ('col_sale',         'sale',          'Sale',          'تخفيضات',        'collection', 8, false, true,  'sale'),
  ('col_denim',        'denim',         'Denim',         'دنيم',           'category',   3, true,  true,  null),
  ('col_jackets',      'jackets',       'Jackets',       'جاكيتات',        'category',   4, true,  true,  null),
  ('col_pants',        'pants',         'Pants',         'بناطيل',         'category',   5, true,  true,  null),
  ('col_matching_sets','matching-sets', 'Matching Sets', 'أطقم',           'category',   6, true,  true,  null),
  ('col_accessories',  'accessories',   'Accessories',   'إكسسوارات',      'category',   7, false, true,  null)
on conflict (id) do nothing;

-- ============================================================================
--  After running this file:
--   1. Create your admin account by signing up on the site, then promote it:
--        update public.customers set role = 'admin' where email = 'you@example.com';
--      (or let the app seed it from ADMIN_EMAIL / ADMIN_PASSWORD on first boot)
--   2. CHANGE THE DEFAULT ADMIN PASSWORD immediately.
--   3. Set AUTH_SECRET to a random 48-byte string: openssl rand -base64 48
-- ============================================================================
