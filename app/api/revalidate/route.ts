import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * On-demand ISR revalidation, called by the Medusa backend's
 * revalidate-storefront subscriber whenever a product, variant, or price
 * changes in the admin. Without this, edits only show up once the
 * storefront's time-based revalidation window happens to expire.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  const expected = process.env.STOREFRONT_REVALIDATE_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tag } = (await req.json().catch(() => ({}))) as { tag?: string };
  const target = tag || "products";

  // A webhook needs data to expire immediately, not just be marked stale,
  // see revalidateTag's docs on { expire: 0 } for external-caller triggers.
  revalidateTag(target, { expire: 0 });

  return NextResponse.json({ revalidated: true, tag: target });
}
