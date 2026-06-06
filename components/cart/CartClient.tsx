"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useStore";

const DELIVERY_THRESHOLD = 499;
const DELIVERY_CHARGE = 99;
const DISCOUNT_CODE = "EYRA500";
const DISCOUNT_AMOUNT = 500;

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DE2E2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function CartClient() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(() =>
    new Set(items.map((i) => `${i.product.id}-${i.size ?? "null"}`))
  );
  const [discountInput, setDiscountInput] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");

  function itemKey(productId: string, size: number | null) {
    return `${productId}-${size ?? "null"}`;
  }

  function toggleCheck(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    const allKeys = items.map((i) => itemKey(i.product.id, i.size));
    const allChecked = allKeys.every((k) => checkedKeys.has(k));
    setCheckedKeys(allChecked ? new Set() : new Set(allKeys));
  }

  const checkedItems = useMemo(
    () => items.filter((i) => checkedKeys.has(itemKey(i.product.id, i.size))),
    [items, checkedKeys]
  );

  const subtotal = checkedItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const originalTotal = checkedItems.reduce(
    (sum, i) => sum + i.product.originalPrice * i.quantity,
    0
  );
  const productDiscount = originalTotal - subtotal;
  const extraDiscount = discountApplied && subtotal > 0 ? DISCOUNT_AMOUNT : 0;
  const deliveryCharge = subtotal > DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal - extraDiscount + deliveryCharge;

  function applyDiscount() {
    if (discountInput.trim().toUpperCase() === DISCOUNT_CODE) {
      setDiscountApplied(true);
      setDiscountError("");
    } else {
      setDiscountApplied(false);
      setDiscountError("Invalid discount code.");
    }
  }

  const allChecked =
    items.length > 0 &&
    items.every((i) => checkedKeys.has(itemKey(i.product.id, i.size)));

  if (items.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-24 flex flex-col items-center gap-6">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#CFCFCF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <p className="font-sans font-normal text-[20px] text-[#909090]">Your cart is empty</p>
        <Link
          href="/products"
          className="px-8 py-[14px] bg-black text-white font-sans font-medium text-[16px] rounded-full hover:bg-[#1a1a1a] transition-colors duration-200"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-10 pb-20">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Cart items */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-sans font-medium text-[18px] leading-[27px] text-black">
              Shopping cart
            </h1>
            {/* Select all */}
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 font-sans font-normal text-[14px] text-[#626262] hover:text-black transition-colors duration-200"
            >
              <span
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                  allChecked ? "bg-black border-black" : "border-[#CFCFCF]"
                }`}
              >
                {allChecked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              Select all
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const key = itemKey(item.product.id, item.size);
              const checked = checkedKeys.has(key);
              const discountPct = Math.round(
                ((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100
              );

              return (
                <div key={key} className="flex gap-4 p-4 bg-white border border-[#E1E1E1] rounded-2xl">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCheck(key)}
                    aria-label={checked ? "Deselect item" : "Select item"}
                    className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-150 ${
                      checked ? "bg-black border-black" : "border-[#CFCFCF] hover:border-black"
                    }`}
                  >
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Product image */}
                  <div
                    className="relative w-[79px] h-[79px] flex-shrink-0 rounded-2xl overflow-hidden bg-[#F9F9F9]"
                    style={{ border: "1px solid #E1E1E1", boxShadow: "0px 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-contain p-2"
                      sizes="79px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="font-sans font-normal text-[18px] leading-[27px] text-black truncate">
                      {item.product.name}
                    </p>
                    {item.size && (
                      <p className="font-sans font-normal text-[13px] text-[#909090]">Size: {item.size}</p>
                    )}

                    {/* Price row */}
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="font-sans font-semibold text-[18px] leading-[27px] text-black">
                        ₹{item.product.price.toLocaleString("en-IN")}
                      </span>
                      <span className="font-sans font-normal text-[15px] text-[#AAAAAA] line-through">
                        ₹{item.product.originalPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="font-sans font-normal text-[13px] text-black">
                        {discountPct}% OFF
                      </span>
                    </div>

                    {/* Delivery label */}
                    <p className="font-sans font-normal text-[13px]" style={{ color: "#E46C3C" }}>
                      {item.product.price > DELIVERY_THRESHOLD ? "Free Delivery" : `Delivery charges: ₹${DELIVERY_CHARGE}`}
                    </p>
                  </div>

                  {/* Right: qty stepper + remove */}
                  <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
                    <button
                      aria-label="Remove item"
                      onClick={() => removeFromCart(item.product.id, item.size)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FFF0F0] transition-colors duration-200"
                    >
                      <TrashIcon />
                    </button>

                    {/* Qty stepper */}
                    <div className="flex items-center border border-[#CFCFCF] rounded-lg overflow-hidden">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        className="w-[26px] h-[26px] flex items-center justify-center text-black hover:bg-[#F7F7F7] transition-colors duration-150"
                      >
                        <MinusIcon />
                      </button>
                      <span className="w-8 text-center font-sans font-medium text-[18px] leading-none text-black select-none">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        className="w-[26px] h-[26px] flex items-center justify-center text-black hover:bg-[#F7F7F7] transition-colors duration-150"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div
          className="w-full lg:w-[380px] flex-shrink-0 rounded-2xl p-6 flex flex-col gap-4 lg:sticky lg:self-start"
          style={{ background: "#F7F7F7", top: "calc(var(--nav-height) + 2rem)" }}
        >
          <h2 className="font-sans font-medium text-[18px] leading-[27px] text-black">
            Order Summary
          </h2>

          <div className="flex flex-col gap-3 text-[14px] font-sans font-normal">
            {/* Estimated total */}
            <div className="flex items-center justify-between">
              <span className="text-[#000000]">
                Estimated total ({checkedItems.length} {checkedItems.length === 1 ? "item" : "items"}) :
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[#7D7D7D] line-through">
                  ₹{originalTotal.toLocaleString("en-IN")}
                </span>
                <span className="text-black font-medium">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            {/* Sub total */}
            <div className="flex items-center justify-between">
              <span className="text-[#626262]">Sub Total</span>
              <span className="text-black">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {/* Product discount */}
            <div className="flex items-center justify-between">
              <span className="text-[#626262]">Product Discount</span>
              <span className="text-black">− ₹{productDiscount.toLocaleString("en-IN")}</span>
            </div>
            {/* Discount code savings */}
            {discountApplied && (
              <div className="flex items-center justify-between">
                <span className="text-[#626262]">Coupon ({DISCOUNT_CODE})</span>
                <span className="text-black">− ₹{DISCOUNT_AMOUNT.toLocaleString("en-IN")}</span>
              </div>
            )}
            {/* Delivery charge */}
            <div className="flex items-center justify-between">
              <span className="text-[#626262]">Delivery Charge</span>
              {deliveryCharge === 0 ? (
                <span className="font-medium" style={{ color: "#47B10A" }}>FREE</span>
              ) : (
                <span className="text-black">₹{deliveryCharge}</span>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-[#DFDFDF]" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="font-sans font-semibold text-[16px] text-black">TOTAL</span>
            <span className="font-sans font-semibold text-[18px] text-black">
              ₹{Math.max(0, total).toLocaleString("en-IN")}
            </span>
          </div>

          {/* Discount code input */}
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Discount code"
              value={discountInput}
              onChange={(e) => {
                setDiscountInput(e.target.value);
                setDiscountError("");
              }}
              className="flex-1 px-4 py-2.5 border border-[#DFDFDF] rounded-2xl bg-white font-sans font-normal text-[14px] text-black placeholder:text-[#AAAAAA] outline-none focus:border-black transition-colors duration-200"
            />
            <button
              onClick={applyDiscount}
              className="px-5 py-2.5 bg-black text-white font-sans font-medium text-[14px] rounded-full hover:bg-[#1a1a1a] transition-colors duration-200 whitespace-nowrap"
            >
              Apply
            </button>
          </div>
          {discountApplied && (
            <p className="font-sans font-normal text-[12px]" style={{ color: "#47B10A" }}>
              Discount applied! ₹{DISCOUNT_AMOUNT} off.
            </p>
          )}
          {discountError && (
            <p className="font-sans font-normal text-[12px] text-[#DE2E2E]">{discountError}</p>
          )}

          {/* Proceed to pay */}
          <button
            disabled={checkedItems.length === 0}
            className="w-full flex items-center justify-center py-[14px] bg-black text-white font-sans font-medium text-[18px] rounded-full hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
            style={{ boxShadow: "inset 0px 6px 10px rgba(211,211,211,0.3)" }}
          >
            Proceed to pay
          </button>

          {/* View refund policy */}
          <div className="text-center">
            <Link
              href="/refund-policy"
              className="font-sans font-normal text-[13px] text-[#626262] underline underline-offset-2 hover:text-black transition-colors duration-200"
            >
              View refund policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
