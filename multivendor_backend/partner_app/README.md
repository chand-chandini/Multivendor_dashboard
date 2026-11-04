# partner_app — vendor + delivery partner mobile API

Serves the React Native app in `D:\projects\multivendor_delivery` (vendor and
delivery partner in one app). Mounted at `/partner_app` by `app.js`; the admin
(`dashboard_api`), `super_admin` and `public_app` mounts are not touched by anything
in this folder.

```
partner_app/
  routes/routes.js          every route, with the auth middleware per group
  controllers/authCtrl.js   login, OTP, password reset, account, switch role
  controllers/vendorCtrl.js store, orders, menu, coupons, earnings, settlements
  controllers/deliveryCtrl.js requests, active trip, trips, earnings, profile
  middleware/auth.js        JWT sign + requireAuth(role)
  lib/db.js                 promise wrapper over utils/dbutils.sqlinjection
  lib/format.js             row → view-ready JSON (₹ grouping, distances, labels)
  lib/branding.js           tenant_branding → the app's theme
  lib/colour.js             derives the shades around a picked colour
  lib/notifications.js      in-app notifications
  lib/orderHistory.js       order_status_history rows
```

## Contract

Responses use the project envelope: `{ status, message, ... }` where `status` is
`200` ok, `202` refused with a message the app shows as-is, `401` auth, `500` error.

`GET /getvendorstate` and `GET /getpartnerstate` return the whole workspace
(`{ status: 200, data: { … } }`). Everything else is a `POST` action returning
`{ status, message }`; the app refetches the state afterwards and every 15 seconds.

Auth is `Authorization: Bearer <token>` from `/login`, `/verifyotp` or `/switchrole`.
The token carries `{ ref_id, role, tenant_id, mobile }` and is workspace-specific:
`requireAuth('vendor')` rejects a delivery token and vice versa. Set `MV_JWT_SECRET`
in `.env` — without it a development secret is used.

### Routes

| Auth | Routes |
|---|---|
| public | `POST /login` `/sendotp` `/verifyotp` `/resetpassword` · `GET /getbranding` |
| any role | `GET /getaccount` · `POST /switchrole` |
| vendor | `GET /getvendorstate` · `POST /updatestoreonline` `/updatestorebusy` `/updateweeklyholiday` `/acceptorder` `/rejectorder` `/extendpreptime` `/markorderready` `/confirmhandover` `/updateproductavailability` `/saveproduct` `/deleteproduct` `/savecoupon` `/togglecoupon` `/vendor/readnotifications` |
| delivery | `GET /getpartnerstate` · `POST /updateonline` `/acceptrequest` `/rejectrequest` `/reachedstore` `/confirmpickup` `/arrivedcustomer` `/completedelivery` `/faildelivery` `/ratehandover` `/updatepreferences` `/delivery/readnotifications` |

### Order flow

```
0 placed ──accept──> 2 preparing ──markready──> 7 ready ──handover/confirmpickup──> 3 out_for_delivery ──completedelivery──> 4 delivered
   │                                                                                        │
   └──reject──> 6 rejected                                                    faildelivery ──> 5 cancelled
```

`/acceptorder` sets `prep_minutes` (plus 10 minutes when the store is in busy mode),
generates the handover code and the customer OTP, and offers the order to up to three
nearby online partners (`delivery_assignments`, status 0). `/markorderready` offers it
if nobody holds it yet. The first partner to `/acceptrequest` gets it; the other
offers are closed.

The partner never receives the handover code or the customer OTP: `/confirmpickup`
and `/completedelivery` compare what was typed against the order row. Sign-in OTPs and
new customer OTPs are written to the server console — there is no SMS gateway yet.

## Theming

The app's colours are the ones the tenant picks in the admin dashboard, read from
`tenant_branding`. One row per workspace: `brand_scope = 'vendor_app'` or
`'delivery_app'`, with `'partner_app'` used for both when a workspace row is
missing.

| Column | In the app |
|---|---|
| `primary_color` | the workspace accent — buttons, selected chips, hero cards, tab bar |
| `secondary_color` | the soft fill behind tiles, the active tab pill and soft pills |
| `button_color` | button fill, when it should differ from the accent |
| `header_color` | app background (returned; the app still uses its own surface) |
| `logo_light` / `logo_dark` / `logo_icon` / `login_bg_image` | image URLs |
| `font_family`, `sidebar_color`, `custom_css` | ignored — Inter is bundled, the rest is dashboard-only |

Only the accent has to be set: `lib/colour.js` derives the darker shade, the soft
fill, the border and the wash around it, and picks a light or dark label colour by
WCAG luminance. A tenant with no rows gets the app's built-in palette.

`GET /getbranding` is public so the sign-in screen is themed before anyone signs
in; it resolves the tenant from `?tenant=`, or on its own when the install has a
single active tenant. Signed-in payloads (`/login`, `/verifyotp`, `/switchrole`,
`/getaccount`, `/getvendorstate`, `/getpartnerstate`) carry the same object, so a
colour changed in the dashboard reaches an open app on its next poll.

## Database

Run once, from `database/`:

```sh
mysql -u root multivendor_saas_db < migration_partner_app.sql      # additive, re-runnable
mysql -u root --default-character-set=utf8mb4 multivendor_saas_db < seed_partner_app_demo.sql
```

The seed owns ids 9000–9999 and deletes them before inserting, so re-running it resets
the demo and re-dates it to today. It creates Amma's Kitchen (food) and Sri Balaji
Stores (grocery), partners Ravi Kumar and Karthik R., today's orders in every state,
six days of history, settlements, coupons and notifications.

Demo sign-ins (mobile / password): `9840721536` / `123456` holds both roles,
`9840700001` is vendor-only, `9840700002` is partner-only.

## Known gaps

- **Passwords are plain text**, matching how the admin dashboard stores them.
  `passwordMatches()` in `authCtrl.js` also accepts a bcrypt hash when `bcryptjs` is
  installed, so both sides can be moved to hashing later.
- `app.js` logs every request body, so passwords and OTPs land in the console. It is
  shared with the other mounts; turn it off outside development.
- No push notifications and no live location: the app polls.

## Franchise workspace

A third role, `franchise` (an area franchisee), alongside `vendor` and `delivery`. Run `database/migration_franchise.sql` (re-runnable) and optionally `database/seed_franchise_demo.sql` (mobile `9840700009`, password `123456`).

- `franchises` table; `vendors.franchise_id` and `delivery_partners.franchise_id` link accounts to it (set from SQL or the admin dashboard — there is no in-app way to add them). `support_tickets.franchise_id` records who raised a ticket.
- `/login`, `/sendotp`, `/verifyotp`, `/switchrole` accept `role: 'franchise'`; one mobile number can hold any mix of the three roles.
- `GET /getfranchisestate` — profile, today / 30-day totals, last 7 days, weekly statements, linked vendors and partners.
- `POST /franchise/setvendorblocked`, `POST /franchise/setpartnerblocked` `{ id, blocked }` — only rows with this franchise's `franchise_id`.
- Commission = `franchises.commission_percentage` of `orders.sub_total` for delivered orders from the franchise's vendors, counted on `delivered_at`. It is computed on read; there is no payout ledger yet.
