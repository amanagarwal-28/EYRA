/**
 * Indian GST invoice helpers.
 *
 * GST rule this encodes: sales within the seller's home state split the tax
 * into CGST + SGST (each half the total rate); sales to any other state use
 * IGST at the full rate instead. Both cases show the same total tax, this
 * only affects how it's itemized on the invoice, which is a real, must-not-
 * get-wrong-by-hand compliance detail rather than a display choice.
 */

/** Official GST state codes, the first two digits of every GSTIN. */
export const GST_STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  haryana: "06",
  delhi: "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  chattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  "daman and diu": "25",
  "dadra and nagar haveli": "26",
  maharashtra: "27",
  "andhra pradesh (old)": "28",
  karnataka: "29",
  goa: "30",
  lakshadweep: "31",
  kerala: "32",
  "tamil nadu": "33",
  puducherry: "34",
  "andaman and nicobar islands": "35",
  telangana: "36",
  "andhra pradesh": "37",
  ladakh: "38",
};

export function gstStateCode(stateName: string): string {
  return GST_STATE_CODES[stateName.trim().toLowerCase()] ?? "-";
}

export interface GstBreakdown {
  isInterState: boolean;
  /** Each of CGST/SGST, or the full rate for IGST, always sums to `totalRate`. */
  rate: number;
  totalRate: number;
  cgst: number;
  sgst: number;
  igst: number;
}

/**
 * Split a taxable amount into CGST+SGST or IGST based on whether the buyer's
 * state matches the seller's registered state.
 *
 * @param taxableValue amount in rupees the tax rate applies to
 * @param totalRatePercent e.g. 3 for the standard jewelry GST rate
 */
export function computeGst(
  taxableValue: number,
  totalRatePercent: number,
  buyerState: string,
  sellerState: string
): GstBreakdown {
  const isInterState =
    buyerState.trim().toLowerCase() !== sellerState.trim().toLowerCase();
  const halfRate = totalRatePercent / 2;

  if (isInterState) {
    return {
      isInterState,
      rate: totalRatePercent,
      totalRate: totalRatePercent,
      cgst: 0,
      sgst: 0,
      igst: Math.round((taxableValue * totalRatePercent) / 100),
    };
  }

  return {
    isInterState,
    rate: halfRate,
    totalRate: totalRatePercent,
    cgst: Math.round((taxableValue * halfRate) / 100),
    sgst: Math.round((taxableValue * halfRate) / 100),
    igst: 0,
  };
}
