/**
 * Turns a courier's "estimated_delivery_days" number into an actual
 * calendar date, shared by every surface that shows a delivery estimate
 * (homepage widget, PDP, checkout) so "3 days" and "by Friday" can never
 * silently disagree between them.
 *
 * Adds calendar days directly rather than skipping weekends: the number
 * comes straight from Shiprocket's own courier data, which already reflects
 * their real operating calendar, second-guessing it by skipping Sundays
 * ourselves would just as likely introduce a new inaccuracy as remove one.
 */
export function estimatedDeliveryDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + Math.round(daysFromNow));
  return date;
}

/** "Tue, 26 Aug" */
export function formatDeliveryDateShort(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** "Tuesday, 26 August" */
export function formatDeliveryDateLong(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

/**
 * The min/max estimate from a courier as a friendly range, e.g.
 * "Tue, 26 Aug – Wed, 27 Aug", or a single date when both ends land on the
 * same day.
 */
export function formatDeliveryRange(minDays: number, maxDays: number): string {
  const from = formatDeliveryDateShort(estimatedDeliveryDate(minDays));
  const to = formatDeliveryDateShort(estimatedDeliveryDate(maxDays));
  return from === to ? from : `${from} – ${to}`;
}
