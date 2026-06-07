/**
 * Centralised business constants for EYRA.
 *
 * All values fall back to safe defaults but can be overridden at runtime via
 * server-side environment variables — no redeploy required when logistics
 * thresholds or tax rates change.
 *
 * Env vars (never prefixed with NEXT_PUBLIC_ — server-only):
 *   JEWELRY_HSN_CODE          BIS HSN code (default: "7113")
 *   JEWELRY_GST_RATE          GST % as a number (default: 3)
 *   SHIP_WEIGHT_RING_G        Ring weight in grams (default: 6)
 *   SHIP_WEIGHT_EARRING_G     Earring weight in grams (default: 6)
 *   SHIP_WEIGHT_CHAIN_G       Chain/necklace weight in grams (default: 15)
 *   SHIP_DEFAULT_WEIGHT_G     Fallback per-item weight in grams (default: 10)
 *   SHIP_MIN_WEIGHT_KG        Shiprocket minimum chargeable slab in kg (default: 0.5)
 *   SHIP_BOX_LENGTH_CM        Jewellery box length in cm (default: 10)
 *   SHIP_BOX_BREADTH_CM       Jewellery box breadth in cm (default: 8)
 *   SHIP_BOX_HEIGHT_CM        Jewellery box height in cm (default: 3)
 */

function envFloat(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseFloat(raw);
  return isFinite(parsed) ? parsed : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const storeConfig = {
  jewelry: {
    /** Articles of jewelry of precious metal — BIS standard HSN. */
    hsnCode: envString("JEWELRY_HSN_CODE", "7113"),
    /** GST rate (%) applied to each order item in Shiprocket payloads. */
    gstRate: envFloat("JEWELRY_GST_RATE", 3),
  },

  shipping: {
    /** Shiprocket minimum chargeable weight slab (kg). */
    minChargeableWeightKg: envFloat("SHIP_MIN_WEIGHT_KG", 0.5),
    /** Per-item weight (g) used when the product type is unrecognised. */
    defaultItemWeightG: envFloat("SHIP_DEFAULT_WEIGHT_G", 10),
    /** Per-product-type manufacturing weights (g). */
    itemWeightsG: {
      ring: envFloat("SHIP_WEIGHT_RING_G", 6),
      earring: envFloat("SHIP_WEIGHT_EARRING_G", 6),
      chain: envFloat("SHIP_WEIGHT_CHAIN_G", 15),
    } as Record<string, number>,
    /** Standard jewellery box dimensions (cm) sent to Shiprocket. */
    box: {
      length: envFloat("SHIP_BOX_LENGTH_CM", 10),
      breadth: envFloat("SHIP_BOX_BREADTH_CM", 8),
      height: envFloat("SHIP_BOX_HEIGHT_CM", 3),
    },
  },
} as const;
