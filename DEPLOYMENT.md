# Deployment Guide (Amplify + App Runner)

This project deploys in two parts:

- Frontend + admin SPA on AWS Amplify Hosting
- Express API backend on AWS App Runner

## 1) Deploy backend (App Runner)

Create an App Runner service from this repository and use `apprunner.yaml`.

Required backend environment variables:

- `NODE_ENV=production`
- `FRONTEND_ORIGIN=https://<your-amplify-domain>`
- `SUPABASE_URL=...`
- `SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `PAYMENT_PROVIDER=stripe` (or `payhere`)
- `STRIPE_SECRET_KEY=...` (if Stripe is used)
- `STRIPE_WEBHOOK_SECRET=...` (if Stripe webhook is used)
- `PAYHERE_MERCHANT_ID=...` (if PayHere is used)
- `PAYHERE_MERCHANT_SECRET=...` (if PayHere is used)
- `PAYHERE_SANDBOX=false` (set `true` only for test)
- `PAYHERE_RETURN_URL=...`
- `PAYHERE_CANCEL_URL=...`
- `PAYHERE_NOTIFY_URL=...`
- `INTERNAL_WEBHOOK_SECRET=...` (optional)
- `ADMIN_ROLE_BYPASS=false`

After deployment, copy your backend URL:

- `https://<app-runner-service-url>`

## 2) Deploy frontend (Amplify Hosting)

Amplify uses `amplify.yml` in repo root.

Set Amplify environment variables:

- `REACT_APP_API_BASE_URL=https://<app-runner-service-url>/api`
- `REACT_APP_SUPABASE_URL=...`
- `REACT_APP_SUPABASE_ANON_KEY=...`
- `REACT_APP_ADMIN_BYPASS=false`

## 3) Configure Amplify rewrites (required for /admin routes)

In Amplify Console -> Rewrites and redirects, add:

- **Source address**:
  `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>`
- **Target address**: `/index.html`
- **Type**: `200 (Rewrite)`

This ensures deep links like `/admin/orders` and `/admin/products` work.

## 4) Redeploy frontend after backend URL is set

After setting `REACT_APP_API_BASE_URL`, trigger a new Amplify build so frontend points to the live backend.
