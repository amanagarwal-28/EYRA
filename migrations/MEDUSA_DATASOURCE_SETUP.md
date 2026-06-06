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
