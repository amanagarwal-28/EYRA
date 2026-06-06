# Linking `init_jewelry_extensions` into Medusa's Core Data Layer

A structured checklist for connecting the EYRA custom schema to the Medusa
backend running against the Railway PostgreSQL instance.

---

## 1 · Provision the Railway PostgreSQL database

- [ ] Create a new **PostgreSQL** service in the Railway project dashboard
- [ ] Copy the auto-generated `DATABASE_URL` connection string
      (format: `postgresql://postgres:<password>@<host>.railway.internal:<port>/<db>`)
- [ ] Confirm the service is reachable from the Medusa backend service
      (both services must be in the same Railway project for private networking)

---

## 2 · Set environment variables

Add the following to both the **Railway Medusa service** and your local `.env`:

```env
# Primary datasource — used by Medusa core AND by init_jewelry_extensions.sql
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>

# Medusa Admin API key — required by lib/medusa-customer.ts for customer sync
MEDUSA_ADMIN_API_KEY=<admin_api_key_from_medusa_dashboard>

# Razorpay — required by app/api/razorpay/create-order/route.ts
NEXT_PUBLIC_RAZORPAY_KEY_ID=<rzp_live_or_test_key_id>
```

> **Railway tip:** Use the **Reference Variable** syntax in Railway to avoid
> copy-pasting: set `DATABASE_URL` as `${{Postgres.DATABASE_URL}}` and Railway
> resolves it automatically at runtime.

---

## 3 · Run the extension migration

The EYRA custom tables live in the **same database** as Medusa core but are
prefixed `eyra_` to avoid naming collisions. Run the migration once after the
database is provisioned:

```bash
# From the project root — Railway CLI or local psql with DATABASE_URL exported
psql "$DATABASE_URL" -f migrations/init_jewelry_extensions.sql
```

Verify it ran cleanly:

```sql
SELECT version, applied_at FROM eyra_schema_migration ORDER BY applied_at;
-- Should return: 0001_init_jewelry_extensions
```

- [ ] Migration ran without errors
- [ ] `eyra_schema_migration` row inserted
- [ ] Ring size chart seeded: `SELECT COUNT(*) FROM eyra_ring_size_chart;` → 15 rows

---

## 4 · Configure Medusa's datasource (`medusa-config.ts`)

Medusa v2 reads the database connection from the `DATABASE_URL` environment
variable. Confirm the datasource block in your Medusa backend's
`medusa-config.ts` uses the standard placeholder:

```typescript
// medusa-config.ts  (in your Medusa backend repo — not the Next.js frontend)
import { defineConfig } from "@medusajs/framework/config";

export default defineConfig({
  projectConfig: {
    // Standard datasource string parameter — Railway injects this at runtime
    databaseUrl: process.env.DATABASE_URL,

    databaseDriverOptions:
      process.env.NODE_ENV === "production"
        ? {
            ssl: {
              // Railway PostgreSQL requires SSL in production
              rejectUnauthorized: false,
            },
          }
        : {},

    // Increase pool size if you expect concurrent checkout sessions
    databaseExtra: {
      max: 20,       // connection pool ceiling
      idleTimeoutMillis: 30_000,
    },

    http: {
      storeCors: process.env.STORE_CORS ?? "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS  ?? "http://localhost:7001",
      authCors:  process.env.AUTH_CORS   ?? "http://localhost:3000",
      jwtSecret: process.env.JWT_SECRET  ?? "supersecret",
      cookieSecret: process.env.COOKIE_SECRET ?? "supersecret",
    },
  },
});
```

- [ ] `databaseUrl: process.env.DATABASE_URL` is set (never hardcoded)
- [ ] `ssl: { rejectUnauthorized: false }` included for Railway production
- [ ] `DATABASE_URL` exported in `.env` for local development

---

## 5 · Run Medusa's own migrations

After setting `DATABASE_URL`, let Medusa create its core schema before your
extension tables are joined:

```bash
# Inside the Medusa backend directory
npx medusa migrations run
```

- [ ] Medusa core migrations completed without errors
- [ ] Tables `product`, `customer`, `cart`, `order`, `product_variant` confirmed present

---

## 6 · Bind the EYRA extension tables to Medusa's data source

The `eyra_*` tables use **soft references** (plain `TEXT` columns like
`medusa_product_id`, `medusa_customer_id`) rather than hard FK constraints into
Medusa's schema. This means:

- No TypeORM entity registration is required in Medusa's module system
- The tables are queryable from **any PostgreSQL client** connected to the same
  `DATABASE_URL` — including a Medusa custom API route or a standalone script
- Medusa schema upgrades will **not** cascade-drop the `eyra_*` tables

To query EYRA tables from a Medusa custom route, inject `__pg_connection__` or
use the raw datasource:

```typescript
// Example: custom Medusa route reading eyra_order
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  // Or use raw pg pool from the datasource for EYRA custom tables:
  const pgClient = req.scope.resolve("__pg_connection__");
  const { rows } = await pgClient.query(
    `SELECT * FROM eyra_order WHERE clerk_user_id = $1 ORDER BY placed_at DESC`,
    [req.auth_context?.actor_id]
  );
  res.json({ orders: rows });
};
```

- [ ] Confirm `eyra_*` tables are visible in Railway's database browser
- [ ] Test a raw `SELECT` from a Medusa custom route or `psql` session

---

## 7 · Populate `eyra_jewelry_spec` after Medusa product import

Once products are imported into Medusa, bind each `medusa_product_id` to its
jewelry spec row. The ring size chart `__seed__` rows also need updating:

```sql
-- Example: bind the size chart rows to a real variant
UPDATE eyra_ring_size_chart
SET medusa_variant_id = 'variant_01JXXX',
    medusa_product_id = 'prod_01JYYY'
WHERE medusa_variant_id = '__seed__'
  AND ring_size_india = 7;

-- Example: insert a jewelry spec for an imported product
INSERT INTO eyra_jewelry_spec (
    medusa_product_id, medusa_product_handle, product_type,
    silver_purity, hallmark_certified, bis_certified,
    base_metal, anti_tarnish_coated,
    gross_weight_grams, net_silver_weight_grams
) VALUES (
    'prod_01JYYY', 'eyra-signature-silver-ring', 'ring',
    'S925', TRUE, TRUE,
    'sterling_silver', TRUE,
    4.200, 3.885
);
```

- [ ] At least one `eyra_jewelry_spec` row inserted per product category
- [ ] `__seed__` rows in `eyra_ring_size_chart` replaced with real variant IDs

---

## 8 · Verify indexes

Confirm the three high-priority indexes are active and used by the query planner:

```sql
-- clerk_user_id — my-orders page, customer sync lookups
EXPLAIN ANALYZE
  SELECT * FROM eyra_order WHERE clerk_user_id = 'user_2abc' ORDER BY placed_at DESC;
-- Expected: Index Scan using idx_order_clerk_user

-- pan_india_pincode — checkout delivery-window query
EXPLAIN ANALYZE
  SELECT * FROM eyra_pincode_cache WHERE pan_india_pincode = '400001';
-- Expected: Index Scan using eyra_pincode_cache_pkey

-- razorpay_order_id — webhook event reconciliation
EXPLAIN ANALYZE
  SELECT * FROM eyra_order WHERE razorpay_order_id = 'order_NbEkof23W';
-- Expected: Index Scan using idx_order_razorpay_order_id
```

- [ ] All three `EXPLAIN ANALYZE` queries show **Index Scan** (not Seq Scan)
- [ ] No unused indexes flagged in `pg_stat_user_indexes`

---

## 9 · Future migrations

All subsequent schema changes must follow the same naming convention and
be applied before Medusa migrations to avoid ID conflicts:

```
migrations/
  0001_init_jewelry_extensions.sql    ← this file
  0002_add_loyalty_points.sql         ← next migration
  0003_add_product_certifications.sql ← etc.
```

Each file must:
1. Wrap all statements in `BEGIN; … COMMIT;`
2. Use `IF NOT EXISTS` / `IF EXISTS` guards for idempotency
3. Insert a row into `eyra_schema_migration` with the version string

---

*Last updated: 2026-06-06*

---
---

# Production Database Configuration — Railway Handover Reference

This section is a self-contained reference for the exact environment variables
and CLI commands needed to wire the Medusa backend to the live Railway
PostgreSQL instance. Copy the template blocks verbatim; replace only the
bracketed placeholders.

---

## A · Environment variable template

Paste the following into your **Railway Medusa service** environment panel
(Settings → Variables → Raw Editor) and into your local `medusa-backend/.env`.
Never commit populated values to version control.

```env
# ─────────────────────────────────────────────────────────────────────────────
# A1. PRIMARY DATASOURCE
# ─────────────────────────────────────────────────────────────────────────────

# Full PostgreSQL connection string.
# Structure: postgresql://[user]:[password]@[host]:[port]/[db]
#
#   [user]     → Railway supplies this as PGUSER  (default: postgres)
#   [password] → Railway supplies this as PGPASSWORD
#   [host]     → Internal hostname, e.g. postgres.railway.internal
#                Use the PUBLIC host (containers.railway.app) only for
#                connections outside the Railway private network (e.g. local CLI)
#   [port]     → Railway supplies this as PGPORT  (default: 5432)
#   [db]       → Railway supplies this as PGDATABASE (default: railway)
#
# In Railway, set this as a Reference Variable so it auto-updates if the
# Postgres service is redeployed:
#   Value →  ${{Postgres.DATABASE_URL}}
#
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db]

# Explicitly declares the database driver.
# Medusa uses this to select the correct TypeORM dialect.
# Must be exactly the string "postgres" — no variant spellings.
DATABASE_TYPE=postgres

# ─────────────────────────────────────────────────────────────────────────────
# A2. CONNECTION POOL THRESHOLDS
# These are read by medusa-config.ts → databaseExtra and control how many
# concurrent PostgreSQL connections Medusa keeps open against Railway.
# ─────────────────────────────────────────────────────────────────────────────

# Minimum connections held open in the pool at all times.
# Set to 2 so the first request after idle doesn't pay a cold-connect penalty.
DB_POOL_MIN=2

# Maximum simultaneous connections in the pool.
# Railway Hobby plan: PostgreSQL allows up to 100 max_connections by default.
# Reserve headroom for Railway's own internal monitoring connections.
# Recommended ceiling for a single Medusa instance: 20.
# Scale up to 50 if running multiple Medusa replicas behind a load balancer.
DB_POOL_MAX=20

# Milliseconds an idle connection is kept alive before being released.
# 30 s balances Railway's 60 s idle connection timeout with pool responsiveness.
DB_POOL_IDLE_TIMEOUT=30000

# Milliseconds Medusa waits to acquire a free connection before throwing.
# 5 s covers typical traffic bursts without hanging end-user requests.
DB_POOL_ACQUIRE_TIMEOUT=5000

# Milliseconds before an individual SQL statement is forcibly cancelled.
# Guards against runaway queries locking the pool during heavy checkout load.
DB_STATEMENT_TIMEOUT=30000

# ─────────────────────────────────────────────────────────────────────────────
# A3. MEDUSA RUNTIME SECRETS
# ─────────────────────────────────────────────────────────────────────────────

# Admin API token — created in Medusa Dashboard → Settings → API key management
# Used by lib/medusa-customer.ts (GET /admin/customers, POST /admin/customers)
MEDUSA_ADMIN_API_KEY=[admin_api_key]

# JWT and cookie secrets — generate with: openssl rand -base64 48
JWT_SECRET=[min_48_char_random_string]
COOKIE_SECRET=[min_48_char_random_string]

# ─────────────────────────────────────────────────────────────────────────────
# A4. CORS ORIGINS
# ─────────────────────────────────────────────────────────────────────────────

# The Railway URL of your deployed Next.js storefront
STORE_CORS=https://[your-nextjs-service].up.railway.app
# The Railway URL (or custom domain) of your Medusa admin panel
ADMIN_CORS=https://[your-admin-panel].up.railway.app
AUTH_CORS=https://[your-nextjs-service].up.railway.app

# ─────────────────────────────────────────────────────────────────────────────
# A5. RAZORPAY
# ─────────────────────────────────────────────────────────────────────────────

# Public key — safe to expose to the browser (prefixed NEXT_PUBLIC_)
NEXT_PUBLIC_RAZORPAY_KEY_ID=[rzp_live_xxxxxxxxxxxxxxxx]
# Secret key — server-side only, never prefix with NEXT_PUBLIC_
RAZORPAY_KEY_SECRET=[live_secret_key]

# ─────────────────────────────────────────────────────────────────────────────
# A6. CLERK
# ─────────────────────────────────────────────────────────────────────────────

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[pk_live_xxxxxxxxxxxxxxxx]
CLERK_SECRET_KEY=[sk_live_xxxxxxxxxxxxxxxx]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# ─────────────────────────────────────────────────────────────────────────────
# A7. MEDUSA BACKEND URL (read by Next.js storefront)
# ─────────────────────────────────────────────────────────────────────────────

NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://[your-medusa-service].up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=[pub_key_from_medusa_dashboard]
```

---

## B · `medusa-config.ts` — wiring the pool variables

Update the datasource block in your Medusa backend to read all pool thresholds
from environment variables so Railway can tune them without a redeploy:

```typescript
// medusa-config.ts  (Medusa backend repo root — not the Next.js frontend)
import { defineConfig } from "@medusajs/framework/config";

export default defineConfig({
  projectConfig: {
    // ── Primary datasource ──────────────────────────────────────────────────
    // DATABASE_URL is the single source of truth. Railway injects it as a
    // Reference Variable (${{Postgres.DATABASE_URL}}) at runtime.
    databaseUrl: process.env.DATABASE_URL,

    databaseDriverOptions:
      process.env.NODE_ENV === "production"
        ? { ssl: { rejectUnauthorized: false } }  // required by Railway TLS
        : {},

    // ── Connection pool thresholds ──────────────────────────────────────────
    // All values read from env so they can be changed in Railway without
    // touching source code or triggering a full rebuild.
    databaseExtra: {
      min:                parseInt(process.env.DB_POOL_MIN           ?? "2"),
      max:                parseInt(process.env.DB_POOL_MAX           ?? "20"),
      idleTimeoutMillis:  parseInt(process.env.DB_POOL_IDLE_TIMEOUT  ?? "30000"),
      acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT ?? "5000"),
      statement_timeout:  parseInt(process.env.DB_STATEMENT_TIMEOUT  ?? "30000"),
    },

    // ── HTTP / CORS ──────────────────────────────────────────────────────────
    http: {
      storeCors:    process.env.STORE_CORS    ?? "http://localhost:3000",
      adminCors:    process.env.ADMIN_CORS    ?? "http://localhost:7001",
      authCors:     process.env.AUTH_CORS     ?? "http://localhost:3000",
      jwtSecret:    process.env.JWT_SECRET    ?? "supersecret",
      cookieSecret: process.env.COOKIE_SECRET ?? "supersecret",
    },
  },
});
```

> **Pool sizing guide**
>
> | Concurrent visitors | `DB_POOL_MAX` | Notes |
> |---|---|---|
> | < 500 / day | 10 | Railway Hobby — conserve connections |
> | 500 – 5 000 / day | 20 | Default recommendation |
> | 5 000 – 20 000 / day | 40 | Scale Medusa to 2 replicas, split pool |
> | > 20 000 / day | 50 + PgBouncer | Add connection pooler in front of Railway Postgres |

---

## C · CLI — push local table structures to Railway

Three approaches ordered by complexity. Use whichever matches your setup.

### C1 · Railway CLI (recommended — no credentials in shell history)

The Railway CLI authenticates via browser OAuth; credentials never touch your
terminal or `.env` file.

```bash
# Install the Railway CLI once (globally)
npm install --global @railway/cli

# Authenticate via browser
railway login

# Link the CLI to your Railway project
# Run from the project root; select the correct environment (production)
railway link

# Confirm the target database is reachable
railway run psql --version

# ── Run EYRA extension migration ──────────────────────────────────────────────
railway run psql "$DATABASE_URL" \
  --set ON_ERROR_STOP=1 \
  -f migrations/init_jewelry_extensions.sql

# Verify the migration was applied
railway run psql "$DATABASE_URL" \
  -c "SELECT version, applied_at FROM eyra_schema_migration ORDER BY applied_at;"

# ── Run Medusa core migrations (from your Medusa backend directory) ───────────
cd ../medusa-backend          # adjust path to your Medusa repo
railway run npx medusa migrations run
```

### C2 · Direct psql with Railway public host (no CLI install needed)

Use Railway's **public** connection string when connecting from outside the
Railway private network (i.e. your local machine). Find it in:
Railway Dashboard → Postgres service → Connect tab → Public URL.

```bash
# Export once for the session — never commit this value
export RAILWAY_DB_URL="postgresql://postgres:[password]@[public-host].railway.app:[public-port]/railway"

# Dry-run first: show all statements without executing
psql "$RAILWAY_DB_URL" \
  --set ON_ERROR_STOP=1 \
  --echo-all \
  --single-transaction \
  --no-psqlrc \
  -f migrations/init_jewelry_extensions.sql \
  2>&1 | head -80   # preview first 80 lines

# Execute for real
psql "$RAILWAY_DB_URL" \
  --set ON_ERROR_STOP=1 \
  --single-transaction \
  -f migrations/init_jewelry_extensions.sql

# Confirm tables created
psql "$RAILWAY_DB_URL" -c "\dt eyra_*"
```

> **`--single-transaction`** wraps the entire file in one transaction.
> If any statement fails the whole migration rolls back — no partial state.
> Matches the `BEGIN; … COMMIT;` already in the SQL file (nested transactions
> are safe in PostgreSQL).

### C3 · npm script shorthand (add to `package.json` for team convenience)

```json
// package.json  (Next.js storefront root)
{
  "scripts": {
    "db:migrate:prod": "railway run psql \"$DATABASE_URL\" --set ON_ERROR_STOP=1 --single-transaction -f migrations/init_jewelry_extensions.sql",
    "db:migrate:local": "psql \"$DATABASE_URL\" --set ON_ERROR_STOP=1 --single-transaction -f migrations/init_jewelry_extensions.sql",
    "db:status": "railway run psql \"$DATABASE_URL\" -c \"SELECT version, applied_at FROM eyra_schema_migration ORDER BY applied_at;\""
  }
}
```

```bash
# Push to Railway production
npm run db:migrate:prod

# Check what migrations have run
npm run db:status
```

---

## D · Post-push verification checklist

After running the migration against the live Railway database, confirm the
following before starting the Medusa server:

- [ ] `\dt eyra_*` in psql lists all 7 extension tables
- [ ] `SELECT version, applied_at FROM eyra_schema_migration;` returns `0001_init_jewelry_extensions`
- [ ] `SELECT COUNT(*) FROM eyra_ring_size_chart;` returns **15**
- [ ] `EXPLAIN SELECT * FROM eyra_order WHERE clerk_user_id = 'test';` shows `Index Scan` (not `Seq Scan`) — index is built even on an empty table
- [ ] Railway service logs show no `FATAL: password authentication failed` or `SSL SYSCALL` errors after Medusa connects with `DATABASE_URL`
- [ ] `SELECT current_setting('max_connections');` returns a value ≥ `DB_POOL_MAX + 5`
