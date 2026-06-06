-- =============================================================================
-- EYRA Silver Jewelry Store — Custom Extension Schema
-- Migration: init_jewelry_extensions
-- Target:    Railway PostgreSQL (standalone instance)
-- Strategy:  Additive extension tables that join onto Medusa's core schema
--            via soft TEXT references (medusa_product_id, medusa_customer_id,
--            etc.) so this schema survives independent Medusa version upgrades.
-- Run:       psql "$DATABASE_URL" -f migrations/init_jewelry_extensions.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Prerequisites
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- trigram indexes for text search


-- ---------------------------------------------------------------------------
-- Domain ENUMs
-- ---------------------------------------------------------------------------

-- The three product categories used throughout the storefront
CREATE TYPE eyra_product_type AS ENUM (
    'ring',
    'chain',
    'earring'
);

-- BIS-recognised silver fineness grades
CREATE TYPE eyra_silver_purity AS ENUM (
    'S925',   -- 92.5% silver (sterling) — primary EYRA grade
    'S950',   -- 95.0% silver
    'S999'    -- 99.9% fine silver
);

-- Primary alloy compositions tracked for base metal tracing
CREATE TYPE eyra_base_metal AS ENUM (
    'sterling_silver',    -- Ag 92.5 + Cu 7.5
    'fine_silver',        -- Ag 99.9
    'argentium_silver',   -- Ag 93.5 + Ge (tarnish-resistant variant)
    'silver_alloy'        -- other / unspecified alloy
);

-- Surface finish / plating configurations applied post-casting
CREATE TYPE eyra_plating_type AS ENUM (
    'none',
    'rhodium',            -- bright white, most tarnish-resistant
    'gold_flash_18k',
    'gold_flash_22k',
    'rose_gold_flash'
);

-- Payment method recorded at order capture time
CREATE TYPE eyra_payment_method AS ENUM (
    'cod',
    'prepaid_razorpay'
);

-- Lifecycle of a payment after Razorpay webhook events
CREATE TYPE eyra_payment_status AS ENUM (
    'pending',
    'captured',
    'failed',
    'refunded',
    'partially_refunded'
);

-- Order fulfilment pipeline
CREATE TYPE eyra_fulfillment_status AS ENUM (
    'not_fulfilled',
    'processing',          -- in the crafting / finishing stage
    'ready_to_ship',
    'shipped',
    'out_for_delivery',
    'delivered',
    'return_requested',
    'returned'
);


-- ===========================================================================
-- TABLE: eyra_jewelry_spec
-- One row per Medusa product. Holds all jewelry-domain attributes that live
-- outside Medusa's generic product model: purity parameters, base metal
-- tracing, plating configurations, and fine weight parameters.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_jewelry_spec (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ── Medusa link ──────────────────────────────────────────────────────────
    -- Soft reference to Medusa's `product.id` (format: prod_01...).
    -- No FK constraint intentionally; Medusa manages its own cascade logic.
    medusa_product_id       TEXT        NOT NULL,
    medusa_product_handle   TEXT        NOT NULL,     -- human-readable slug, doubles as URL key
    product_type            eyra_product_type NOT NULL,

    -- ── Purity parameters ────────────────────────────────────────────────────
    silver_purity           eyra_silver_purity  NOT NULL DEFAULT 'S925',
    hallmark_certified      BOOLEAN     NOT NULL DEFAULT TRUE,
    bis_certified           BOOLEAN     NOT NULL DEFAULT TRUE,
    -- BIS IS 2112 hallmarking centre code printed on the piece
    hallmark_centre_code    VARCHAR(12),

    -- ── Base metal tracing ───────────────────────────────────────────────────
    base_metal              eyra_base_metal     NOT NULL DEFAULT 'sterling_silver',
    -- ISO 3166-1 alpha-2 country of silver origin (e.g. 'IN', 'PE', 'MX')
    metal_origin_country    CHAR(2),
    -- Internal batch/lot number for supply-chain traceability
    metal_batch_ref         VARCHAR(64),
    -- Flag raised if the piece has been BIS-tested for nickel release
    nickel_free_tested      BOOLEAN     NOT NULL DEFAULT FALSE,
    hypoallergenic          BOOLEAN     NOT NULL DEFAULT FALSE,
    anti_tarnish_coated     BOOLEAN     NOT NULL DEFAULT TRUE,

    -- ── Plating configuration ────────────────────────────────────────────────
    plating_type            eyra_plating_type   NOT NULL DEFAULT 'none',
    -- Rhodium / gold flash thickness in microns (μm); NULL when plating = 'none'
    plating_micron          NUMERIC(4, 2),
    -- Number of plating passes applied (affects durability rating)
    plating_passes          SMALLINT    CHECK (plating_passes BETWEEN 1 AND 10),

    -- ── Fine weight parameters ───────────────────────────────────────────────
    -- All weights in grams; NULL allowed for pieces sold by design (not weight)
    gross_weight_grams      NUMERIC(8, 3),   -- total piece weight including stones
    net_silver_weight_grams NUMERIC(8, 3),   -- pure silver content weight
    -- Stone/setting weight in carats; NULL for plain metal pieces
    stone_weight_carats     NUMERIC(8, 3),
    stone_type              VARCHAR(64),     -- e.g. 'cubic zirconia', 'garnet'

    -- ── Review aggregates (denormalised from Medusa metadata for fast reads) ─
    avg_rating              NUMERIC(3, 2)   CHECK (avg_rating BETWEEN 0 AND 5),
    review_count            INTEGER         NOT NULL DEFAULT 0,

    -- ── Housekeeping ─────────────────────────────────────────────────────────
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

-- High-frequency lookups
CREATE UNIQUE INDEX IF NOT EXISTS uidx_jewelry_spec_medusa_product
    ON eyra_jewelry_spec (medusa_product_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_jewelry_spec_handle
    ON eyra_jewelry_spec (medusa_product_handle);

CREATE INDEX IF NOT EXISTS idx_jewelry_spec_type
    ON eyra_jewelry_spec (product_type);

CREATE INDEX IF NOT EXISTS idx_jewelry_spec_purity
    ON eyra_jewelry_spec (silver_purity);

COMMENT ON TABLE eyra_jewelry_spec IS
    'Jewelry-domain product metadata: purity, base metal tracing, plating, and weight parameters. One row per Medusa product.';


-- ===========================================================================
-- TABLE: eyra_ring_size_chart
-- Static lookup for India-standard ring sizing (sizes 6–20).
-- Stores the inner circumference and diameter used in the ProductDetailClient
-- size-guide modal. Variant-level rows allow per-variant dimension variance.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_ring_size_chart (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Soft reference to Medusa's `product_variant.id`
    medusa_variant_id   TEXT        NOT NULL,
    medusa_product_id   TEXT        NOT NULL,

    ring_size_india     SMALLINT    NOT NULL CHECK (ring_size_india BETWEEN 1 AND 32),
    circumference_mm    NUMERIC(5, 2) NOT NULL,
    diameter_mm         NUMERIC(5, 2) NOT NULL,

    -- Stock availability for this specific variant/size combination
    in_stock            BOOLEAN     NOT NULL DEFAULT TRUE,
    inventory_quantity  INTEGER     NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_ring_size_variant
    ON eyra_ring_size_chart (medusa_variant_id, ring_size_india);

CREATE INDEX IF NOT EXISTS idx_ring_size_product
    ON eyra_ring_size_chart (medusa_product_id);

-- Seed the standard India size chart (matches SIZE_CHART in ProductDetailClient)
INSERT INTO eyra_ring_size_chart
    (medusa_variant_id, medusa_product_id, ring_size_india, circumference_mm, diameter_mm)
VALUES
    -- Placeholder variant IDs; replace with real Medusa variant IDs after product import.
    -- The chart data is canonical and remains constant regardless of variant binding.
    ('__seed__', '__seed__',  6,  44.2, 14.1),
    ('__seed__', '__seed__',  7,  45.5, 14.5),
    ('__seed__', '__seed__',  8,  46.8, 14.9),
    ('__seed__', '__seed__',  9,  48.0, 15.3),
    ('__seed__', '__seed__', 10,  49.3, 15.7),
    ('__seed__', '__seed__', 11,  50.6, 16.1),
    ('__seed__', '__seed__', 12,  51.9, 16.5),
    ('__seed__', '__seed__', 13,  53.1, 16.9),
    ('__seed__', '__seed__', 14,  54.4, 17.3),
    ('__seed__', '__seed__', 15,  55.7, 17.7),
    ('__seed__', '__seed__', 16,  57.0, 18.1),
    ('__seed__', '__seed__', 17,  58.3, 18.6),
    ('__seed__', '__seed__', 18,  59.5, 18.9),
    ('__seed__', '__seed__', 19,  60.8, 19.4),
    ('__seed__', '__seed__', 20,  62.1, 19.8)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE eyra_ring_size_chart IS
    'India-standard ring size reference (sizes 6–20). Rows bind to Medusa product variants via medusa_variant_id.';


-- ===========================================================================
-- TABLE: eyra_customer
-- Bridges Clerk user identities to Medusa customer records.
-- The medusaCustomerId written to Clerk publicMetadata by lib/medusa-customer.ts
-- is the authoritative binding key; this table is the relational counterpart
-- for SQL-level joins (order history, address books, analytics).
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_customer (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ── Identity binding ─────────────────────────────────────────────────────
    -- Clerk user ID — format: user_2abc... (from Clerk dashboard)
    clerk_user_id       TEXT        NOT NULL,
    -- Medusa customer ID — format: cus_01... (from Medusa)
    medusa_customer_id  TEXT        NOT NULL,

    -- ── Profile snapshot ─────────────────────────────────────────────────────
    -- Mirrors the primary verified email address from Clerk at bind time.
    -- Authoritative source remains Clerk; this is a denormalised read cache.
    email               TEXT        NOT NULL,
    first_name          VARCHAR(128),
    last_name           VARCHAR(128),
    -- E.164 format: +919876543210
    phone               VARCHAR(16),

    -- ── Account flags ────────────────────────────────────────────────────────
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    medusa_has_account  BOOLEAN     NOT NULL DEFAULT FALSE,

    -- ── Housekeeping ─────────────────────────────────────────────────────────
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- High-frequency lookup: every authenticated request looks up by clerk_user_id
CREATE UNIQUE INDEX IF NOT EXISTS uidx_customer_clerk_id
    ON eyra_customer (clerk_user_id)
    WHERE deleted_at IS NULL;

-- Medusa-side lookup: used when reconciling order history
CREATE UNIQUE INDEX IF NOT EXISTS uidx_customer_medusa_id
    ON eyra_customer (medusa_customer_id)
    WHERE deleted_at IS NULL;

-- Email search (customer support, de-duplication)
CREATE INDEX IF NOT EXISTS idx_customer_email
    ON eyra_customer (LOWER(email));

COMMENT ON TABLE eyra_customer IS
    'Clerk ↔ Medusa customer binding table. clerk_user_id is the primary lookup key; medusa_customer_id enables Medusa Admin API joins.';
COMMENT ON COLUMN eyra_customer.clerk_user_id IS
    'Clerk user ID (user_2abc...). Indexed. Source of truth lives in Clerk; this column is the relational join key.';


-- ===========================================================================
-- TABLE: eyra_shipping_address
-- Customer address book. Supports multiple saved addresses per customer with
-- one default per customer. pan_india_pincode is explicitly indexed because
-- it is used in real-time delivery-window lookups and pincode availability
-- checks during checkout (api.postalpincode.in enrichment + caching layer).
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_shipping_address (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID        NOT NULL REFERENCES eyra_customer (id) ON DELETE CASCADE,

    -- ── Address fields ───────────────────────────────────────────────────────
    label               VARCHAR(32)  DEFAULT 'Home',  -- 'Home', 'Office', 'Other'
    full_name           VARCHAR(256) NOT NULL,
    address_line1       TEXT         NOT NULL,
    address_line2       TEXT,
    city                VARCHAR(128) NOT NULL,
    state               VARCHAR(128) NOT NULL,         -- one of 36 Indian states / UTs
    -- 6-digit India postal code; CHAR enforces exact length at the DB level
    pan_india_pincode   CHAR(6)      NOT NULL CHECK (pan_india_pincode ~ '^\d{6}$'),
    -- E.164 contact number for this delivery address
    phone               VARCHAR(16)  NOT NULL,

    -- ── Metadata ─────────────────────────────────────────────────────────────
    is_default          BOOLEAN      NOT NULL DEFAULT FALSE,
    is_verified         BOOLEAN      NOT NULL DEFAULT FALSE,  -- set TRUE after postal API confirms
    -- Latitude / longitude populated by postalpincode.in enrichment (optional)
    latitude            NUMERIC(9, 6),
    longitude           NUMERIC(9, 6),

    -- ── Housekeeping ─────────────────────────────────────────────────────────
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- Customer → addresses: used on every address-book render
CREATE INDEX IF NOT EXISTS idx_address_customer
    ON eyra_shipping_address (customer_id)
    WHERE deleted_at IS NULL;

-- High-frequency: real-time pincode delivery-window checks during checkout
CREATE INDEX IF NOT EXISTS idx_address_pincode
    ON eyra_shipping_address (pan_india_pincode)
    WHERE deleted_at IS NULL;

-- Composite: fetch default address for a customer in one index scan
CREATE UNIQUE INDEX IF NOT EXISTS uidx_address_customer_default
    ON eyra_shipping_address (customer_id)
    WHERE is_default = TRUE AND deleted_at IS NULL;

-- State-level grouping (logistics zone queries)
CREATE INDEX IF NOT EXISTS idx_address_state
    ON eyra_shipping_address (state);

COMMENT ON TABLE eyra_shipping_address IS
    'Customer saved address book. pan_india_pincode is explicitly indexed for real-time delivery-window and serviceability lookups.';
COMMENT ON COLUMN eyra_shipping_address.pan_india_pincode IS
    '6-digit India PIN code. Explicitly indexed (idx_address_pincode) for high-frequency checkout delivery queries.';


-- ===========================================================================
-- TABLE: eyra_order
-- Master order record. Bridges the EYRA storefront order reference, the
-- Medusa cart/order session, and the Razorpay payment transaction in one
-- queryable row. All monetary amounts stored in paise (integer) to match
-- Medusa's internal representation and avoid floating-point drift.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_order (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ── Order identity ───────────────────────────────────────────────────────
    -- Client-generated reference shown in UI and confirmation emails.
    -- Format: EYRA-{base36timestamp} e.g. EYRA-LRFXYZ12
    eyra_order_ref          VARCHAR(32)  NOT NULL,

    -- ── Customer binding ─────────────────────────────────────────────────────
    -- Explicit index: every "my orders" page query filters by clerk_user_id
    clerk_user_id           TEXT         NOT NULL,
    medusa_customer_id      TEXT,
    customer_id             UUID         REFERENCES eyra_customer (id) ON DELETE SET NULL,

    -- ── Medusa session links ──────────────────────────────────────────────────
    -- Soft references; Medusa manages its own cascade
    medusa_cart_id          TEXT,        -- cart_01... (localStorage key: eyra_cart_id)
    medusa_order_id         TEXT,        -- order_01... (set after Medusa order confirmation)
    medusa_payment_collection_id TEXT,   -- paycol_01...
    medusa_payment_session_id    TEXT,   -- payses_01...

    -- ── Razorpay transaction ──────────────────────────────────────────────────
    -- order_id from Razorpay (server-generated via /api/razorpay/create-order)
    razorpay_order_id       TEXT,
    -- payment_id from Razorpay handler callback (razorpay_payment_id)
    razorpay_payment_id     TEXT,
    -- Signature from Razorpay for server-side HMAC verification
    razorpay_signature      TEXT,

    -- ── Payment details ───────────────────────────────────────────────────────
    payment_method          eyra_payment_method   NOT NULL,
    payment_status          eyra_payment_status   NOT NULL DEFAULT 'pending',

    -- ── Fulfilment ────────────────────────────────────────────────────────────
    fulfillment_status      eyra_fulfillment_status NOT NULL DEFAULT 'not_fulfilled',
    -- Tracking number from the courier once shipped
    tracking_number         VARCHAR(128),
    courier_name            VARCHAR(64),

    -- ── Shipping address snapshot ─────────────────────────────────────────────
    -- Full address snapshot at order capture time (address may be edited later)
    shipping_address_id     UUID         REFERENCES eyra_shipping_address (id) ON DELETE SET NULL,
    snapshot_full_name      VARCHAR(256) NOT NULL,
    snapshot_address_line1  TEXT         NOT NULL,
    snapshot_address_line2  TEXT,
    snapshot_city           VARCHAR(128) NOT NULL,
    snapshot_state          VARCHAR(128) NOT NULL,
    snapshot_pincode        CHAR(6)      NOT NULL,
    snapshot_phone          VARCHAR(16)  NOT NULL,

    -- ── Monetary totals (paise = rupees × 100) ────────────────────────────────
    subtotal_paise          INTEGER      NOT NULL DEFAULT 0,
    gst_paise               INTEGER      NOT NULL DEFAULT 0,    -- 3% GST
    delivery_paise          INTEGER      NOT NULL DEFAULT 0,    -- 0 if subtotal ≥ ₹499
    discount_paise          INTEGER      NOT NULL DEFAULT 0,
    total_paise             INTEGER      NOT NULL DEFAULT 0,    -- subtotal + gst + delivery − discount
    currency_code           CHAR(3)      NOT NULL DEFAULT 'INR',

    -- ── Housekeeping ──────────────────────────────────────────────────────────
    placed_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    paid_at                 TIMESTAMPTZ,
    shipped_at              TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Enforce unique EYRA ref per order
    CONSTRAINT chk_order_total_positive  CHECK (total_paise >= 0)
);

-- High-frequency: "my orders" page — every lookup goes through clerk_user_id
CREATE INDEX IF NOT EXISTS idx_order_clerk_user
    ON eyra_order (clerk_user_id, placed_at DESC);

-- High-frequency: Razorpay webhook verification queries by order_id
CREATE INDEX IF NOT EXISTS idx_order_razorpay_order_id
    ON eyra_order (razorpay_order_id)
    WHERE razorpay_order_id IS NOT NULL;

-- Razorpay payment_id lookup (support queries, refund flows)
CREATE INDEX IF NOT EXISTS idx_order_razorpay_payment_id
    ON eyra_order (razorpay_payment_id)
    WHERE razorpay_payment_id IS NOT NULL;

-- Storefront order reference lookup (confirmation page, email deeplinks)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_order_eyra_ref
    ON eyra_order (eyra_order_ref);

-- Medusa cart reconciliation
CREATE INDEX IF NOT EXISTS idx_order_medusa_cart
    ON eyra_order (medusa_cart_id)
    WHERE medusa_cart_id IS NOT NULL;

-- Snapshot pincode (logistics analytics, zone-level fulfilment reporting)
CREATE INDEX IF NOT EXISTS idx_order_snapshot_pincode
    ON eyra_order (snapshot_pincode);

-- Status filters (ops dashboard queries)
CREATE INDEX IF NOT EXISTS idx_order_fulfillment_status
    ON eyra_order (fulfillment_status, placed_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_payment_status
    ON eyra_order (payment_status, placed_at DESC);

COMMENT ON TABLE eyra_order IS
    'Master order record. Bridges EYRA storefront ref, Medusa cart/order session, and Razorpay transaction. Amounts in paise.';
COMMENT ON COLUMN eyra_order.clerk_user_id IS
    'Clerk user ID. Explicitly indexed (idx_order_clerk_user) — primary key for "my orders" page queries.';
COMMENT ON COLUMN eyra_order.razorpay_order_id IS
    'Razorpay order_id (order_xxx) from Medusa payment session. Indexed (idx_order_razorpay_order_id) for webhook event matching.';
COMMENT ON COLUMN eyra_order.razorpay_payment_id IS
    'Razorpay payment_id (pay_xxx) from the modal handler callback. Indexed for support and refund flows.';


-- ===========================================================================
-- TABLE: eyra_order_item
-- Line items for each order. Records the Medusa variant binding, ring size
-- selection, and price at the time of purchase (snapshot pricing).
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_order_item (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID        NOT NULL REFERENCES eyra_order (id) ON DELETE CASCADE,

    -- ── Medusa links ─────────────────────────────────────────────────────────
    medusa_line_item_id     TEXT,        -- line_item_01... from Medusa cart
    medusa_variant_id       TEXT,        -- variant_01...
    medusa_product_id       TEXT,        -- prod_01...

    -- ── Product snapshot (immutable at order time) ────────────────────────────
    product_name            VARCHAR(256) NOT NULL,
    product_type            eyra_product_type NOT NULL,
    -- Ring size (India scale 6–20); NULL for chains and earrings
    ring_size_india         SMALLINT     CHECK (ring_size_india BETWEEN 1 AND 32),

    -- ── Pricing snapshot (paise) ──────────────────────────────────────────────
    unit_price_paise        INTEGER      NOT NULL CHECK (unit_price_paise >= 0),
    original_price_paise    INTEGER      NOT NULL CHECK (original_price_paise >= 0),
    quantity                SMALLINT     NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    total_price_paise       INTEGER      NOT NULL CHECK (total_price_paise >= 0),

    -- ── Housekeeping ──────────────────────────────────────────────────────────
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_item_order
    ON eyra_order_item (order_id);

CREATE INDEX IF NOT EXISTS idx_order_item_medusa_variant
    ON eyra_order_item (medusa_variant_id)
    WHERE medusa_variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_item_medusa_product
    ON eyra_order_item (medusa_product_id)
    WHERE medusa_product_id IS NOT NULL;

COMMENT ON TABLE eyra_order_item IS
    'Line items per order with immutable price and product snapshots at order capture time.';


-- ===========================================================================
-- TABLE: eyra_pincode_cache
-- Caches responses from api.postalpincode.in to reduce external API calls
-- during high-traffic checkout sessions. pan_india_pincode is the primary
-- lookup key and carries the most targeted index in the schema.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_pincode_cache (
    pan_india_pincode   CHAR(6)      PRIMARY KEY CHECK (pan_india_pincode ~ '^\d{6}$'),
    district            VARCHAR(128) NOT NULL,
    state               VARCHAR(128) NOT NULL,
    post_office_name    VARCHAR(256),
    is_serviceable      BOOLEAN      NOT NULL DEFAULT TRUE,
    -- TTL: postalpincode.in data is stable; re-fetch after 90 days
    cached_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

-- Used by checkout to determine if the cache entry is still fresh
CREATE INDEX IF NOT EXISTS idx_pincode_cache_expires
    ON eyra_pincode_cache (expires_at)
    WHERE is_serviceable = TRUE;

-- Trigram index for partial/fuzzy pincode search in admin tools
CREATE INDEX IF NOT EXISTS idx_pincode_cache_trgm
    ON eyra_pincode_cache USING gin (pan_india_pincode gin_trgm_ops);

COMMENT ON TABLE eyra_pincode_cache IS
    'TTL cache for api.postalpincode.in responses. pan_india_pincode is the primary key. Cache entries expire after 90 days.';
COMMENT ON COLUMN eyra_pincode_cache.pan_india_pincode IS
    '6-digit India PIN code. Primary key and high-frequency lookup key for real-time checkout delivery queries.';


-- ===========================================================================
-- Updated_at trigger function
-- ===========================================================================

CREATE OR REPLACE FUNCTION eyra_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_jewelry_spec_updated_at
    BEFORE UPDATE ON eyra_jewelry_spec
    FOR EACH ROW EXECUTE FUNCTION eyra_set_updated_at();

CREATE OR REPLACE TRIGGER trg_customer_updated_at
    BEFORE UPDATE ON eyra_customer
    FOR EACH ROW EXECUTE FUNCTION eyra_set_updated_at();

CREATE OR REPLACE TRIGGER trg_address_updated_at
    BEFORE UPDATE ON eyra_shipping_address
    FOR EACH ROW EXECUTE FUNCTION eyra_set_updated_at();

CREATE OR REPLACE TRIGGER trg_order_updated_at
    BEFORE UPDATE ON eyra_order
    FOR EACH ROW EXECUTE FUNCTION eyra_set_updated_at();

CREATE OR REPLACE TRIGGER trg_ring_size_updated_at
    BEFORE UPDATE ON eyra_ring_size_chart
    FOR EACH ROW EXECUTE FUNCTION eyra_set_updated_at();


-- ===========================================================================
-- Schema version record
-- ===========================================================================

CREATE TABLE IF NOT EXISTS eyra_schema_migration (
    version     VARCHAR(64)  PRIMARY KEY,
    applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    description TEXT
);

INSERT INTO eyra_schema_migration (version, description)
VALUES ('0001_init_jewelry_extensions', 'Initial jewelry extension schema: jewelry_spec, ring_size_chart, customer, shipping_address, order, order_item, pincode_cache')
ON CONFLICT (version) DO NOTHING;


COMMIT;

-- =============================================================================
-- INDEX SUMMARY — high-frequency search lookups
-- =============================================================================
-- Table                    Column                    Index name
-- ─────────────────────────────────────────────────────────────────────────────
-- eyra_customer            clerk_user_id             uidx_customer_clerk_id
-- eyra_order               clerk_user_id             idx_order_clerk_user
-- eyra_shipping_address    pan_india_pincode         idx_address_pincode
-- eyra_pincode_cache       pan_india_pincode         PRIMARY KEY
-- eyra_order               razorpay_order_id         idx_order_razorpay_order_id
-- eyra_order               razorpay_payment_id       idx_order_razorpay_payment_id
-- eyra_order               eyra_order_ref            uidx_order_eyra_ref
-- eyra_jewelry_spec        medusa_product_id         uidx_jewelry_spec_medusa_product
-- eyra_ring_size_chart     medusa_variant_id         uidx_ring_size_variant
-- =============================================================================
