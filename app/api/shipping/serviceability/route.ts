import type { NextRequest } from "next/server";

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

/** Default parcel weight in kg — safe upper bound for silver jewelry. */
const DEFAULT_WEIGHT_KG = 0.5;

interface ShiprocketCourier {
  courier_name: string;
  estimated_delivery_days: string | number;
  cod: 0 | 1;
}

interface ShiprocketServiceabilityResponse {
  status: number;
  data?: {
    available_courier_companies?: ShiprocketCourier[];
  };
}

export interface ServiceabilityResult {
  serviceable: boolean;
  estimatedDays: number;
  availablePaymentMethods: string[];
}

export async function POST(request: NextRequest) {
  const token = process.env.SHIPROCKET_API_TOKEN;
  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE;

  if (!token || !pickupPincode) {
    // Shiprocket not yet configured — return a permissive fallback so checkout
    // is not blocked during development/staging.
    const fallback: ServiceabilityResult = {
      serviceable: true,
      estimatedDays: 5,
      availablePaymentMethods: ["prepaid", "cod"],
    };
    return Response.json(fallback);
  }

  let body: { pincode?: string };
  try {
    body = (await request.json()) as { pincode?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { pincode } = body;
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return Response.json({ error: "A valid 6-digit pincode is required." }, { status: 400 });
  }

  const params = new URLSearchParams({
    pickup_postcode: pickupPincode,
    delivery_postcode: pincode,
    weight: String(DEFAULT_WEIGHT_KG),
    cod: "1",
  });

  let shiprocketData: ShiprocketServiceabilityResponse;
  try {
    const res = await fetch(
      `${SHIPROCKET_BASE}/courier/serviceability/?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );
    shiprocketData = (await res.json()) as ShiprocketServiceabilityResponse;
  } catch {
    // Network failure — fail open so checkout isn't blocked.
    const fallback: ServiceabilityResult = {
      serviceable: true,
      estimatedDays: 5,
      availablePaymentMethods: ["prepaid", "cod"],
    };
    return Response.json(fallback);
  }

  const couriers = shiprocketData?.data?.available_courier_companies ?? [];

  if (couriers.length === 0) {
    const result: ServiceabilityResult = {
      serviceable: false,
      estimatedDays: 0,
      availablePaymentMethods: [],
    };
    return Response.json(result);
  }

  // Minimum estimated delivery days across all available couriers.
  const estimatedDays = couriers.reduce((min, c) => {
    const days = Number(c.estimated_delivery_days);
    return isNaN(days) ? min : Math.min(min, days);
  }, Infinity);

  // COD is available only if at least one courier supports it.
  const codAvailable = couriers.some((c) => c.cod === 1);

  const result: ServiceabilityResult = {
    serviceable: true,
    estimatedDays: isFinite(estimatedDays) ? estimatedDays : 5,
    // Prepaid is available whenever any courier operates on this route.
    availablePaymentMethods: codAvailable ? ["prepaid", "cod"] : ["prepaid"],
  };

  return Response.json(result);
}
