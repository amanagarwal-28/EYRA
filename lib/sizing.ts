/**
 * Indian ring size chart, shared by the product detail size guide and the
 * public sizing chart on /authenticity-and-care so the two cannot diverge.
 *
 * Circumference and diameter are the inner measurements of the band, in mm.
 */
export interface RingSize {
  size: number;
  circumference: number;
  diameter: number;
}

export const SIZE_CHART: readonly RingSize[] = [
  { size: 6,  circumference: 44.2, diameter: 14.1 },
  { size: 7,  circumference: 45.5, diameter: 14.5 },
  { size: 8,  circumference: 46.8, diameter: 14.9 },
  { size: 9,  circumference: 48.0, diameter: 15.3 },
  { size: 10, circumference: 49.3, diameter: 15.7 },
  { size: 11, circumference: 50.6, diameter: 16.1 },
  { size: 12, circumference: 51.9, diameter: 16.5 },
  { size: 13, circumference: 53.1, diameter: 16.9 },
  { size: 14, circumference: 54.4, diameter: 17.3 },
  { size: 15, circumference: 55.7, diameter: 17.7 },
  { size: 16, circumference: 57.0, diameter: 18.1 },
  { size: 17, circumference: 58.3, diameter: 18.6 },
  { size: 18, circumference: 59.5, diameter: 18.9 },
  { size: 19, circumference: 60.8, diameter: 19.4 },
  { size: 20, circumference: 62.1, diameter: 19.8 },
];
