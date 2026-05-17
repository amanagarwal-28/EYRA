import type { Product } from "@/components/products/types";

export interface DetailProduct extends Product {
  specs: string[];
  sizes: number[];
  rating: number;
  reviewCount: number;
}

const RING_SIZES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const RING_SPECS = ["925 Sterling", "Hallmarked", "BIS Certified", "Anti-tarnish"];
const CHAIN_SPECS = ["925 Sterling", "Nickel Free", "Hallmarked", "Anti-tarnish"];
const EARRING_SPECS = ["925 Sterling", "Anti-tarnish", "Hypoallergenic", "Hallmarked"];

export const PRODUCTS: DetailProduct[] = [
  {
    id: "1",
    name: "Eyra Signature Silver Ring",
    price: 2499,
    originalPrice: 4499,
    description: "Crafted in premium 925 sterling silver with a sleek minimal finish designed for timeless elegance.",
    images: ["/images/product-1.jpg", "/images/product-2.jpg", "/images/collection-1.jpg", "/images/product-3.jpg"],
    inStock: 15,
    type: "ring",
    specs: RING_SPECS,
    sizes: RING_SIZES,
    rating: 4.4,
    reviewCount: 128,
  },
  {
    id: "2",
    name: "Celestial Band Ring",
    price: 1899,
    originalPrice: 3299,
    description: "Delicately textured band in 925 sterling silver, perfect for everyday stacking and layering.",
    images: ["/images/product-2.jpg", "/images/product-1.jpg", "/images/collection-2.jpg", "/images/product-4.jpg"],
    inStock: 8,
    type: "ring",
    specs: RING_SPECS,
    sizes: RING_SIZES,
    rating: 4.2,
    reviewCount: 84,
  },
  {
    id: "3",
    name: "Serpentine Silver Chain",
    price: 3299,
    originalPrice: 5499,
    description: "A bold serpentine-link chain in 925 sterling silver, engineered for modern luxury and durability.",
    images: ["/images/product-3.jpg", "/images/product-1.jpg", "/images/collection-3.jpg", "/images/product-5.jpg"],
    inStock: 12,
    type: "chain",
    specs: CHAIN_SPECS,
    sizes: [],
    rating: 4.6,
    reviewCount: 210,
  },
  {
    id: "4",
    name: "Halo Drop Earrings",
    price: 1299,
    originalPrice: 2499,
    description: "Lightweight sterling silver drop earrings with a polished halo frame, perfect for day to evening.",
    images: ["/images/product-4.jpg", "/images/product-5.jpg", "/images/collection-1.jpg", "/images/product-2.jpg"],
    inStock: 20,
    type: "earring",
    specs: EARRING_SPECS,
    sizes: [],
    rating: 4.5,
    reviewCount: 176,
  },
  {
    id: "5",
    name: "Crescent Stud Earrings",
    price: 2199,
    originalPrice: 3999,
    description: "Minimalist crescent-shaped studs in 925 sterling silver — effortlessly chic for any occasion.",
    images: ["/images/product-5.jpg", "/images/product-4.jpg", "/images/collection-2.jpg", "/images/product-1.jpg"],
    inStock: 18,
    type: "earring",
    specs: EARRING_SPECS,
    sizes: [],
    rating: 4.3,
    reviewCount: 99,
  },
  {
    id: "6",
    name: "Sovereign Signet Ring",
    price: 4999,
    originalPrice: 7499,
    description: "A heavy-gauge signet ring in pure 925 sterling silver, hand-polished to a mirror finish.",
    images: ["/images/product-1.jpg", "/images/product-3.jpg", "/images/collection-3.jpg", "/images/product-2.jpg"],
    inStock: 5,
    type: "ring",
    specs: RING_SPECS,
    sizes: RING_SIZES,
    rating: 4.7,
    reviewCount: 62,
  },
  {
    id: "7",
    name: "Rope Twist Chain",
    price: 1499,
    originalPrice: 2799,
    description: "Classic rope-twist link chain in 925 sterling silver, timeless and versatile for all looks.",
    images: ["/images/product-2.jpg", "/images/product-3.jpg", "/images/collection-1.jpg", "/images/product-5.jpg"],
    inStock: 30,
    type: "chain",
    specs: CHAIN_SPECS,
    sizes: [],
    rating: 4.1,
    reviewCount: 145,
  },
  {
    id: "8",
    name: "Figaro Link Chain",
    price: 2799,
    originalPrice: 4799,
    description: "The iconic Figaro pattern reimagined in sterling silver — a staple for the modern wardrobe.",
    images: ["/images/product-3.jpg", "/images/product-2.jpg", "/images/collection-2.jpg", "/images/product-4.jpg"],
    inStock: 14,
    type: "chain",
    specs: CHAIN_SPECS,
    sizes: [],
    rating: 4.4,
    reviewCount: 88,
  },
  {
    id: "9",
    name: "Eternity Stacking Ring",
    price: 3499,
    originalPrice: 5999,
    description: "A slim eternity band set with hand-placed cubic zirconia in gleaming 925 sterling silver.",
    images: ["/images/product-4.jpg", "/images/product-1.jpg", "/images/collection-3.jpg", "/images/product-3.jpg"],
    inStock: 7,
    type: "ring",
    specs: RING_SPECS,
    sizes: RING_SIZES,
    rating: 4.8,
    reviewCount: 203,
  },
  {
    id: "10",
    name: "Luna Ear Cuff",
    price: 1199,
    originalPrice: 2199,
    description: "An adjustable ear cuff in sterling silver that adds edge and dimension without a piercing.",
    images: ["/images/product-5.jpg", "/images/product-4.jpg", "/images/collection-1.jpg", "/images/product-1.jpg"],
    inStock: 25,
    type: "earring",
    specs: EARRING_SPECS,
    sizes: [],
    rating: 4.0,
    reviewCount: 57,
  },
  {
    id: "11",
    name: "Geometric Dome Ring",
    price: 2999,
    originalPrice: 5299,
    description: "An architectural dome ring in 925 sterling silver, a statement piece for the design-forward.",
    images: ["/images/product-1.jpg", "/images/product-5.jpg", "/images/collection-2.jpg", "/images/product-2.jpg"],
    inStock: 9,
    type: "ring",
    specs: RING_SPECS,
    sizes: RING_SIZES,
    rating: 4.5,
    reviewCount: 111,
  },
  {
    id: "12",
    name: "Box Link Statement Chain",
    price: 5499,
    originalPrice: 8999,
    description: "Chunky box-link chain in heavyweight 925 sterling silver — bold, structural, and unforgettable.",
    images: ["/images/product-2.jpg", "/images/product-3.jpg", "/images/collection-3.jpg", "/images/product-4.jpg"],
    inStock: 4,
    type: "chain",
    specs: CHAIN_SPECS,
    sizes: [],
    rating: 4.6,
    reviewCount: 74,
  },
];

export function getProductById(id: string): DetailProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getSimilarProducts(id: string, limit = 8): DetailProduct[] {
  const current = PRODUCTS.find((p) => p.id === id);
  if (!current) return PRODUCTS.slice(0, limit);
  const sameType = PRODUCTS.filter((p) => p.id !== id && p.type === current.type);
  const otherTypes = PRODUCTS.filter((p) => p.id !== id && p.type !== current.type);
  return [...sameType, ...otherTypes].slice(0, limit);
}
