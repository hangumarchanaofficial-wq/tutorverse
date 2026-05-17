create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id bigserial primary key,
  title text not null,
  description text,
  category_id bigint references public.categories(id),
  category_slug text,
  brand text,
  price numeric(12,2) not null default 0,
  original_price numeric(12,2),
  discount integer not null default 0,
  stock_qty integer not null default 0,
  image text,
  images_json jsonb not null default '[]'::jsonb,
  rating numeric(3,2) not null default 0,
  reviews_count integer not null default 0,
  sold integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carts (
  id bigserial primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  items_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  id bigserial primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  items_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id bigserial primary key,
  code text not null unique,
  type text not null check (type in ('percentage','fixed')),
  value numeric(12,2) not null,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigserial primary key,
  user_id uuid not null references auth.users(id),
  order_number text not null unique,
  invoice_number text not null unique,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  payment_method text not null,
  coupon_code text,
  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  shipping_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address text,
  shipping_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id),
  product_title text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null,
  line_total numeric(12,2) not null,
  selected_size text,
  selected_color text
);

create table if not exists public.payments (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  provider text not null,
  session_id text not null,
  status text not null,
  amount numeric(12,2) not null,
  currency text not null default 'LKR',
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out','adjustment')),
  quantity integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id bigserial primary key,
  order_id bigint not null unique references public.orders(id) on delete cascade,
  invoice_number text not null unique,
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sms_logs (
  id bigserial primary key,
  order_id bigint references public.orders(id) on delete cascade,
  phone text not null,
  message text not null,
  status text not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.carts enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.sms_logs enable row level security;
alter table public.payments enable row level security;
alter table public.stock_movements enable row level security;
alter table public.invoices enable row level security;

create policy "Public read products" on public.products for select using (is_active = true);
create policy "Public read categories" on public.categories for select using (true);
create policy "User own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "User own cart" on public.carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "User own wishlist" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "User own orders" on public.orders for select using (auth.uid() = user_id);
create policy "User own order items" on public.order_items for select using (
  exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "User own payments" on public.payments for select using (
  exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "User own invoices" on public.invoices for select using (
  exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "Public read active coupons" on public.coupons for select using (is_active = true);
create policy "Public read approved reviews" on public.reviews for select using (is_approved = true);
create policy "Users insert own reviews" on public.reviews for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
