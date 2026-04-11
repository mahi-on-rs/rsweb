# cPanel Deployment Guide (topseal.xyz)

This project has 3 deploy targets:

- Shop (static): `https://www.topseal.xyz`
- Admin (static): `https://admpan.topseal.xyz`
- API (Node.js): `https://api.topseal.xyz`

## 1) Recommended subdomain to folder structure

Use separate document roots in cPanel:

- `www.topseal.xyz` -> `/home/<cpanel_user>/public_html/shop`
- `admpan.topseal.xyz` -> `/home/<cpanel_user>/public_html/admpan`
- `api.topseal.xyz` -> Node.js app root: `/home/<cpanel_user>/nodeapps/topseal-api`

## 2) Static files (shop + admin)

Copy these files/folders into **both** static roots (`shop` and `admpan`) so all routes/assets work from either host:

- `index.html`
- `category.html`
- `product.html`
- `contact.html`
- `admin-login.html`
- `admin-dashboard.html`
- `admin-analytics.html`
- `styles.css`
- `admin.css`
- `shop-data.js`
- `admin.js`
- `assets/`

> Why both roots? The current HTML pages use relative script/style paths, so each host needs the same static assets available.

## 3) Node API files

Upload only API source to app root:

- `api/server.js`
- `api/package.json`
- optional: `api/.env.example`

Do **not** upload `api/node_modules`; install dependencies in cPanel Node app.

## 4) Create Node app in cPanel

In **Setup Node.js App**:

- Node version: 18+ (or latest available)
- Application mode: `production`
- Application root: `/home/<cpanel_user>/nodeapps/topseal-api`
- Application URL: `api.topseal.xyz`
- Application startup file: `server.js`

Then run:

- `npm install`
- Restart the app

## 5) Environment variables for API

Set in cPanel Node app:

- `NODE_ENV=production`
- `PORT=3000` (or leave managed by cPanel if auto-set)
- `DATABASE_URL=<your Neon connection string>`
- `JWT_SECRET=<long-random-secret>`
- `ADMIN_USERNAME=<your-admin-user>`
- `ADMIN_PASSWORD=<strong-admin-password>`
- `ALLOWED_ORIGINS=https://www.topseal.xyz,https://admpan.topseal.xyz,https://api.topseal.xyz`
- `CLOUDINARY_CLOUD_NAME=<if used>`
- `CLOUDINARY_API_KEY=<if used>`
- `CLOUDINARY_API_SECRET=<if used>`

## 6) DNS/SSL checklist

- Create `A`/`CNAME` records for `www`, `admpan`, `api`
- Enable SSL certificates on all 3 hosts

Cookies are configured for secure cross-site behavior in production, so HTTPS is required for reliable admin login/session behavior.

## 7) Smoke test after deployment

1. Open `https://api.topseal.xyz/health` and confirm `{ "ok": true }`
2. Open `https://admpan.topseal.xyz/admin-login.html` and login
3. Save a setting/product in admin and confirm shop reflects data from API
4. Upload an image and confirm Cloudinary URL returns

## 8) Rollback strategy

- Keep current Render deployment active until cPanel smoke tests pass
- Lower DNS TTL before cutover
- If issue appears, switch DNS back to Render while fixing cPanel
