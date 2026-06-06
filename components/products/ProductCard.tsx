"use client";

import Image from "next/image";
import type { Product } from "./types";
import { useCartStore } from "@/store/useStore";

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const inCart = useCartStore((s) =>
    s.items.some((i) => i.product.id === product.id)
  );
  return (
    <article className="group flex flex-col items-center gap-[15px] py-8 px-6 h-full bg-white hover:bg-[#F7F7F7] transition-colors duration-200">
      {/* Image container */}
      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden">
        <button
          aria-label="Quick view"
          className="absolute top-3 right-3 w-[42px] h-[42px] rounded-full bg-white border border-[#B4B4B4] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </button>

        <div className="relative w-[70%] h-[70%]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 206px"
          />
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-col items-center gap-[7px] w-full">
        <h3 className="font-sans font-normal text-[20px] leading-[30px] text-center text-black w-full">
          {product.name}
        </h3>
        <p className="font-sans font-normal text-[15px] leading-[22px] text-center text-[#A0A0A0] line-clamp-2 w-full">
          {product.description}
        </p>
        <div className="flex items-center gap-[13px] mt-1">
          <span className="font-sans font-medium text-[24px] leading-[36px] text-black">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <span className="font-sans font-normal text-[20px] leading-[30px] text-[#AAAAAA] line-through">
            ₹{product.originalPrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Add to cart */}
      <div className="mt-auto w-full flex justify-center pt-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!inCart) addToCart(product, null);
          }}
          className={`w-full max-w-[310px] flex items-center justify-center px-8 py-[14px] font-sans font-medium text-[18px] leading-[20px] rounded-full transition-colors duration-200 ${inCart
              ? "bg-black text-white"
              : "bg-black text-white hover:bg-[#1a1a1a]"
            }`}
          style={{ boxShadow: "inset 0px 6px 10px rgba(211,211,211,0.3)" }}
        >
          {inCart ? "Added to cart" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
