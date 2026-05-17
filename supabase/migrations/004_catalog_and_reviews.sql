-- §5.3 Marketing flags so the storefront can surface featured / best seller /
-- new arrival sections from the database instead of hard-coded heuristics.
alter table public.products
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_best_seller boolean not null default false,
  add column if not exists is_new_arrival boolean not null default false;

create index if not exists products_is_featured_idx on public.products (is_featured) where is_featured = true;
create index if not exists products_is_best_seller_idx on public.products (is_best_seller) where is_best_seller = true;
create index if not exists products_is_new_arrival_idx on public.products (is_new_arrival) where is_new_arrival = true;

-- §5.9 Keep products.rating and products.reviews_count in lock-step with
-- approved reviews. The trigger fires on insert / update / delete and only
-- considers approved reviews, so admin moderation toggles propagate.
create or replace function public.refresh_product_rating(p_product_id bigint)
returns void
language plpgsql
as $$
declare
  v_avg numeric(3,2);
  v_count integer;
begin
  select coalesce(round(avg(rating)::numeric, 2), 0), count(*)
  into v_avg, v_count
  from public.reviews
  where product_id = p_product_id and is_approved = true;

  update public.products
  set rating = coalesce(v_avg, 0), reviews_count = coalesce(v_count, 0)
  where id = p_product_id;
end;
$$;

create or replace function public.reviews_aggregate_trigger()
returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'DELETE') then
    perform public.refresh_product_rating(OLD.product_id);
    return OLD;
  elsif (TG_OP = 'UPDATE') and OLD.product_id <> NEW.product_id then
    perform public.refresh_product_rating(OLD.product_id);
    perform public.refresh_product_rating(NEW.product_id);
    return NEW;
  else
    perform public.refresh_product_rating(NEW.product_id);
    return NEW;
  end if;
end;
$$;

drop trigger if exists reviews_after_change on public.reviews;
create trigger reviews_after_change
after insert or update or delete on public.reviews
for each row execute function public.reviews_aggregate_trigger();

-- Backfill once so existing rows are correct.
do $$
declare r record;
begin
  for r in select distinct product_id from public.reviews loop
    perform public.refresh_product_rating(r.product_id);
  end loop;
end $$;
