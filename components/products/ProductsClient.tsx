"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "./types";

type ProductType = "ring" | "chain" | "earring";
type SortOption = "trending" | "price-asc" | "price-desc" | "newest";
type PriceRange = "all" | "under-1500" | "1500-2500" | "2500-4000" | "above-4000";


const PRICE_RANGES: { label: string; value: PriceRange }[] = [
  { label: "All prices", value: "all" },
  { label: "Under ₹1,500", value: "under-1500" },
  { label: "₹1,500 – ₹2,500", value: "1500-2500" },
  { label: "₹2,500 – ₹4,000", value: "2500-4000" },
  { label: "Above ₹4,000", value: "above-4000" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Trending", value: "trending" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
];

const TYPE_OPTIONS: { label: string; value: ProductType }[] = [
  { label: "Rings", value: "ring" },
  { label: "Chains", value: "chain" },
  { label: "Earrings", value: "earring" },
];

function priceInRange(price: number, range: PriceRange): boolean {
  switch (range) {
    case "under-1500": return price < 1500;
    case "1500-2500": return price >= 1500 && price <= 2500;
    case "2500-4000": return price > 2500 && price <= 4000;
    case "above-4000": return price > 4000;
    default: return true;
  }
}

interface FilterPanelProps {
  selectedTypes: ProductType[];
  onTypeChange: (t: ProductType[]) => void;
  priceRange: PriceRange;
  onPriceChange: (r: PriceRange) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
}

function FilterPanel({
  selectedTypes,
  onTypeChange,
  priceRange,
  onPriceChange,
  sortBy,
  onSortChange,
}: FilterPanelProps) {
  function toggleType(type: ProductType) {
    onTypeChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type]
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* By Type */}
      <div>
        <p className="font-sans font-medium text-[13px] tracking-[0.18em] uppercase text-black mb-4">
          By Type
        </p>
        <div className="flex flex-col gap-3">
          {TYPE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              className="flex items-center gap-3 cursor-pointer group text-left"
              onClick={() => toggleType(value)}
            >
              <span
                className={`w-4 h-4 border rounded-sm flex items-center justify-center shrink-0 transition-colors duration-150 ${
                  selectedTypes.includes(value)
                    ? "bg-black border-black"
                    : "border-[#CFCFCF] group-hover:border-black"
                }`}
              >
                {selectedTypes.includes(value) && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
                    <path
                      d="M1 3.5L3.5 6L8 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="font-sans font-light text-[14px] leading-[21px] text-[#626262] group-hover:text-black transition-colors duration-150">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-[#CFCFCF]" />

      {/* By Price */}
      <div>
        <p className="font-sans font-medium text-[13px] tracking-[0.18em] uppercase text-black mb-4">
          By Price
        </p>
        <div className="flex flex-col gap-3">
          {PRICE_RANGES.map(({ label, value }) => (
            <button
              key={value}
              className="flex items-center gap-3 cursor-pointer group text-left"
              onClick={() => onPriceChange(value)}
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                  priceRange === value
                    ? "border-black"
                    : "border-[#CFCFCF] group-hover:border-black"
                }`}
              >
                {priceRange === value && (
                  <span className="w-2 h-2 rounded-full bg-black block" />
                )}
              </span>
              <span className="font-sans font-light text-[14px] leading-[21px] text-[#626262] group-hover:text-black transition-colors duration-150">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-[#CFCFCF]" />

      {/* Sort By */}
      <div>
        <p className="font-sans font-medium text-[13px] tracking-[0.18em] uppercase text-black mb-4">
          Sort By
        </p>
        <div className="flex flex-col gap-3">
          {SORT_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              className="flex items-center gap-3 cursor-pointer group text-left"
              onClick={() => onSortChange(value)}
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                  sortBy === value
                    ? "border-black"
                    : "border-[#CFCFCF] group-hover:border-black"
                }`}
              >
                {sortBy === value && (
                  <span className="w-2 h-2 rounded-full bg-black block" />
                )}
              </span>
              <span className="font-sans font-light text-[14px] leading-[21px] text-[#626262] group-hover:text-black transition-colors duration-150">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductsClient({ products }: { products: Product[] }) {
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedTypes.length > 0) {
      result = result.filter((p) => selectedTypes.includes(p.type));
    }
    result = result.filter((p) => priceInRange(p.price, priceRange));
    if (sortBy === "price-asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [selectedTypes, priceRange, sortBy]);

  const panelProps: FilterPanelProps = {
    selectedTypes,
    onTypeChange: setSelectedTypes,
    priceRange,
    onPriceChange: setPriceRange,
    sortBy,
    onSortChange: setSortBy,
  };

  function clearFilters() {
    setSelectedTypes([]);
    setPriceRange("all");
    setSortBy("trending");
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
      {/* Breadcrumb */}
      <div className="py-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-sans font-normal text-[16px] leading-[24px]">
          <a href="/" className="text-[#5F5F5F] hover:text-black transition-colors duration-200 text-center">
            Home
          </a>
          <span className="text-[#5F5F5F] mx-1">›</span>
          <span className="text-black">Products</span>
        </nav>
      </div>

      <div className="w-full h-px bg-[#CFCFCF]" />

      {/* Page title + mobile filter toggle */}
      <div className="flex items-center justify-between py-5">
        <h1 className="font-sans font-normal text-[28px] leading-[42px] text-black">
          All Products ({filtered.length} results)
        </h1>
        <button
          className="lg:hidden flex items-center gap-2 font-sans font-light text-[14px] text-[#626262] border border-[#CFCFCF] px-4 py-2 rounded-full hover:border-black hover:text-black transition-colors duration-200"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal size={15} strokeWidth={1.5} />
          Filters
        </button>
      </div>

      <div className="w-full h-px bg-[#CFCFCF]" />

      {/* Main layout */}
      <div className="flex gap-0 pb-20">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:block w-[220px] shrink-0 border-r border-[#CFCFCF] py-8 pr-8 mr-10 sticky top-[calc(var(--nav-height)+2rem)] self-start"
          aria-label="Product filters"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sans font-medium text-[16px] leading-[24px] text-black">
              Filters
            </h2>
            {(selectedTypes.length > 0 || priceRange !== "all") && (
              <button
                className="font-sans font-light text-[12px] text-[#909090] hover:text-black underline underline-offset-2 transition-colors duration-200"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
          <FilterPanel {...panelProps} />
        </aside>

        {/* Product grid */}
        <div className="flex-1 py-8 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="font-sans font-normal text-[18px] text-[#909090] text-center">
                No products match your filters.
              </p>
              <button
                className="font-sans font-medium text-[14px] text-black underline underline-offset-2 hover:text-[#626262] transition-colors duration-200"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t border-l border-[#CFCFCF]">
              {filtered.map((product) => (
                <div key={product.id} className="border-b border-r border-[#CFCFCF]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            className="fixed inset-y-0 left-0 w-[300px] bg-white z-50 lg:hidden overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-[#CFCFCF]">
              <h2 className="font-sans font-medium text-[16px] leading-[24px] text-black">
                Filters
              </h2>
              <button
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-[#626262] hover:text-black transition-colors duration-200"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-6">
              <FilterPanel {...panelProps} />
              <div className="mt-8">
                <button
                  className="w-full flex items-center justify-center px-8 py-[14px] bg-black text-white font-sans font-medium text-[16px] rounded-full hover:bg-[#1a1a1a] transition-colors duration-200"
                  onClick={() => setDrawerOpen(false)}
                >
                  View {filtered.length} results
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
