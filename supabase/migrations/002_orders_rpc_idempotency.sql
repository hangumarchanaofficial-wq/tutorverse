-- Idempotent order keys (filled by API after successful payment record)
create table if not exists public.order_idempotency (
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key text not null,
  order_id bigint not null references public.orders (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

alter table public.order_idempotency enable row level security;

create unique index if not exists payments_session_id_unique on public.payments (session_id);

-- Atomic order + lines + stock (aggregated stock check prevents oversell on duplicate line items)
create or replace function public.create_order_transaction (
  p_user_id uuid,
  p_payment_method text,
  p_coupon_code text,
  p_shipping jsonb,
  p_items jsonb,
  p_order_number text,
  p_invoice_number text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_shipping_fee numeric(12,2);
  v_total numeric(12,2);
  v_order_id bigint;
  item jsonb;
  v_product record;
  v_coupon record;
  v_customer_name text;
  v_shipping_address text;
  v_line_total numeric(12,2);
  agg record;
begin
  if p_payment_method not in ('cod', 'card', 'bank') then
    return jsonb_build_object('ok', false, 'error', 'Invalid payment method');
  end if;

  v_customer_name := trim(both ' ' from coalesce(p_shipping->>'firstName', '') || ' ' || coalesce(p_shipping->>'lastName', ''));

  v_shipping_address :=
    coalesce(p_shipping->>'address', '') || ', ' ||
    coalesce(p_shipping->>'city', '') || ', ' ||
    coalesce(p_shipping->>'province', '') || ', ' ||
    coalesce(p_shipping->>'country', '');

  for agg in
    select
      (elem->>'product_id')::bigint as pid,
      sum((elem->>'quantity')::integer) as qty
    from jsonb_array_elements(p_items) as elem
    group by (elem->>'product_id')::bigint
  loop
    select * into v_product
    from products
    where id = agg.pid
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'error', format('Product not found or unavailable: %s', agg.pid));
    end if;

    if v_product.is_active is not true then
      return jsonb_build_object('ok', false, 'error', format('Product not found or unavailable: %s', agg.pid));
    end if;

    if v_product.stock_qty < agg.qty then
      return jsonb_build_object('ok', false, 'error', format('Insufficient stock for %s', v_product.title));
    end if;

    v_subtotal := v_subtotal + (v_product.price * agg.qty);
  end loop;

  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon
    from coupons
    where code = upper(trim(p_coupon_code)) and is_active = true;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'Invalid or inactive coupon');
    end if;

    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      return jsonb_build_object('ok', false, 'error', 'Coupon has expired');
    end if;

    if v_coupon.type = 'percentage' then
      v_discount := (v_subtotal * v_coupon.value) / 100;
    elsif v_coupon.type = 'fixed' then
      v_discount := v_coupon.value;
    end if;

    v_discount := least(v_subtotal, greatest(0, v_discount));
  end if;

  if v_subtotal > 5000 then
    v_shipping_fee := 0;
  else
    v_shipping_fee := 500;
  end if;

  v_total := greatest(0, v_subtotal - v_discount + v_shipping_fee);

  insert into orders (
    user_id,
    order_number,
    invoice_number,
    status,
    payment_status,
    payment_method,
    coupon_code,
    subtotal_amount,
    discount_amount,
    shipping_amount,
    total_amount,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_payload
  ) values (
    p_user_id,
    p_order_number,
    p_invoice_number,
    'pending',
    case when p_payment_method = 'card' then 'initiated' else 'pending' end,
    p_payment_method,
    case when p_coupon_code is not null and trim(p_coupon_code) <> '' then upper(trim(p_coupon_code)) else null end,
    v_subtotal,
    v_discount,
    v_shipping_fee,
    v_total,
    v_customer_name,
    coalesce(p_shipping->>'email', ''),
    coalesce(p_shipping->>'phone', ''),
    v_shipping_address,
    p_shipping
  )
  returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from products
    where id = (item->>'product_id')::bigint
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'error', format('Product missing during fulfillment: %s', (item->>'product_id')));
    end if;

    v_line_total := v_product.price * (item->>'quantity')::integer;

    insert into order_items (
      order_id,
      product_id,
      product_title,
      unit_price,
      quantity,
      line_total,
      selected_size,
      selected_color
    ) values (
      v_order_id,
      v_product.id,
      v_product.title,
      v_product.price,
      (item->>'quantity')::integer,
      v_line_total,
      nullif(trim(coalesce(item->>'selected_size', '')), ''),
      nullif(trim(coalesce(item->>'selected_color', '')), '')
    );

    insert into stock_movements (product_id, movement_type, quantity, reason)
    values (
      v_product.id,
      'out',
      (item->>'quantity')::integer,
      'Order ' || p_order_number
    );

    update products
    set
      stock_qty = stock_qty - (item->>'quantity')::integer,
      sold = sold + (item->>'quantity')::integer
    where id = v_product.id;
  end loop;

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

revoke all on function public.create_order_transaction (uuid, text, text, jsonb, jsonb, text, text) from public;
grant execute on function public.create_order_transaction (uuid, text, text, jsonb, jsonb, text, text) to service_role;
