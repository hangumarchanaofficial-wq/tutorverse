# TWOWAY Backend

## Stack
- Node.js + Express API
- Supabase Postgres + Auth + RLS
- AWS SNS for SMS notifications
- Stripe (optional, falls back to mock if key is missing)

## Setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Fill Supabase and AWS/Stripe keys.
3. Run migrations in order:
   - `supabase/migrations/001_init_schema.sql`
   - `supabase/migrations/002_orders_rpc_idempotency.sql` (defines `create_order_transaction`, `order_idempotency`, unique `payments.session_id`). If this fails on `payments_session_id_unique`, deduplicate `session_id` rows first.
   - `supabase/migrations/003_harden_order_flow.sql` (claim-first idempotency, `reviews(user_id, product_id)` unique, RPC includes apartment + postal code in `shipping_address`).
   - `supabase/migrations/004_catalog_and_reviews.sql` (`is_featured` / `is_best_seller` / `is_new_arrival` flags + reviews-aggregate trigger that keeps `products.rating` and `products.reviews_count` in sync).
4. Install and run:
   - `npm install`
   - `npm run start:backend` (from repo root) or `npm --prefix backend run dev`

## Main Endpoints

### Public catalogue
- `GET /api/health` — 503 if database unreachable
- `GET /api/products` — filters: `category`, `q`, `featured=true`, `best_seller=true`, `new_arrival=true`, `limit`
- `GET /api/products/:id` — product + approved reviews
- `GET /api/products/:id/reviews` — paginated approved reviews
- `GET /api/categories`

### Customer (auth)
- `GET /api/me` — profile bundle
- `PATCH /api/me` — `full_name`, `phone`
- `POST /api/cart/sync`, `GET /api/cart`
- `POST /api/wishlist/sync`, `GET /api/wishlist`
- `POST /api/coupons/validate` — rate-limited per user
- `POST /api/orders` — rate-limited per user; optional header `Idempotency-Key` 8–128 chars, claim-first race-free; concurrent retries with the same key converge on a single order
- `GET /api/orders/my`, `GET /api/orders/:id`
- `POST /api/reviews` — one approved review per (user, product)
- `GET /api/invoice/:orderId` — own order PDF

### Payment webhooks
- `POST /api/payments/stripe-webhook` — Stripe-signed (raw body)
- `POST /api/payments/payhere-webhook` — PayHere notify URL (form-urlencoded; signature-checked)
- `POST /api/payments/webhook` — non-Stripe providers / dev tools; **disabled unless `INTERNAL_WEBHOOK_SECRET` is set**; caller must send `X-Internal-Webhook-Secret`

### Admin (role = admin)
- `GET /api/admin/analytics` — counts, revenue (all/7d/30d), pending reviews, recent orders, 14-day sales bucket
- `GET /api/admin/orders` (`limit`, `offset`, `status`), `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status` — fires SMS on processing/completed/cancelled
- `GET /api/admin/invoice/:orderId` — admin-side PDF download for any order
- `GET /api/admin/products` (`limit`, `offset`, `q`, `is_active`)
- `POST /api/admin/products`, `PATCH /api/admin/products/:id`, `DELETE /api/admin/products/:id` (soft delete)
- `POST /api/admin/products/import` — `{ items: [...] }`, max 500 rows
- `GET /api/admin/categories`, `POST /api/admin/categories`, `PATCH /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`
- `GET /api/admin/coupons`, `POST /api/admin/coupons`, `PATCH /api/admin/coupons/:id`, `DELETE /api/admin/coupons/:id`
- `GET /api/admin/reviews` (`status=pending|approved|all`), `PATCH /api/admin/reviews/:id` (approve/reject), `DELETE /api/admin/reviews/:id`
- `GET /api/admin/stock-report`

## Frontend Env
Use root `.env` values:
- `REACT_APP_API_BASE_URL`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
