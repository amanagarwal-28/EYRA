"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
/* ── Clerk appearance — matches Figma exactly ───────────── */
const appearance = {
  variables: {
    colorPrimary: "#000000",
    colorText: "#3D3D3D",
    colorTextSecondary: "#888888",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#3D3D3D",
    borderRadius: "12px",
    fontFamily: "Poppins, sans-serif",
    fontSize: "16px",
  },
  elements: {
    /* Strip Clerk's built-in card chrome */
    rootBox: "w-full",
    card: "shadow-none border-0 bg-transparent p-0 gap-6 w-full",

    /* Hide Clerk's internal header — we render our own logo + title */
    header: "hidden",

    /* Input fields: 56px tall, #EBEBEB border, 12px radius */
    formFieldInput:
      "h-14 border border-[#EBEBEB] rounded-xl text-base px-4 text-[#3D3D3D] placeholder:text-[#888888] focus:border-[#AAAAAA] focus:ring-0 focus:outline-none",
    formFieldLabel: "text-sm text-[#5D5D5D] font-normal",

    /* "Keep me signed in" checkbox */
    formFieldCheckboxInput: "accent-[#4167F2]",
    formFieldCheckboxLabel: "text-[#5D5D5D]",

    /* "Forgot password?" link */
    formFieldAction: "text-[#4167F2] text-base font-normal",

    /* Sign In / primary button */
    formButtonPrimary:
      "bg-black rounded-full h-[52px] text-lg font-medium hover:bg-[#1a1a1a] shadow-[inset_0px_6px_10px_rgba(211,211,211,0.3)] normal-case",

    /* OR divider */
    dividerLine: "border-[#DBDBDB]",
    dividerText: "text-[#DBDBDB] text-base",

    /* Continue with Google */
    socialButtonsBlockButton:
      "border border-[#E3E3E3] rounded-full h-[52px] bg-white text-black hover:bg-[#F7F7F7]",
    socialButtonsBlockButtonText: "text-lg font-medium text-black",

    /* Footer "Don't have an account? Sign up" */
    footerActionText: "text-[#6D6D6D] text-base",
    footerActionLink: "text-[#4167F2] text-base font-normal",
  },
};

/* ── Decorative left panel ──────────────────────────────── */
function AuthLeft() {
  return (
    <div className="relative hidden lg:flex flex-col w-[48%] flex-shrink-0 overflow-hidden rounded-none"
      style={{ margin: "20px 0 20px 17px", minHeight: "calc(100vh - 40px)" }}
    >
      <Image
        src="/images/hero-bg.jpg"
        alt="EYRA jewellery editorial"
        fill
        className="object-cover object-center"
        priority
        sizes="48vw"
      />

      {/* Semi-transparent white rectangles (Figma decorative overlay) */}
      <div className="absolute top-[47px] left-[22px] w-[74px] h-[78px] bg-white/20" />
      <div className="absolute top-[86px] left-[59px] w-[74px] h-[78px] bg-white/20" />
      <div className="absolute top-[144px] right-[22px] w-[74px] h-[78px] bg-white/20" />
      <div className="absolute top-[206px] right-[40px] w-[74px] h-[78px] bg-white/20" />

      {/* Gradient for readability of bottom text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Bottom text + dot indicators */}
      <div className="absolute bottom-[80px] inset-x-0 flex flex-col items-center gap-3 px-10">
        <h2 className="font-sans font-bold text-[40px] leading-[60px] text-white text-center">
          Forever starts here
        </h2>
        <p className="font-sans font-normal text-[16px] leading-[22px] text-[#EFEFEF] text-center max-w-[435px]">
          Discover timeless 925 sterling silver jewellery crafted for modern
          elegance, everyday luxury, and effortless expression.
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-[52px] inset-x-0 flex items-center justify-center gap-[3px]">
        <div className="w-2 h-2 rounded-full bg-white" />
        <div className="w-2 h-2 rounded-full bg-[#6A6A6A]" />
        <div className="w-2 h-2 rounded-full bg-[#6A6A6A]" />
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-white">
      <AuthLeft />

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-between min-h-screen px-8 lg:px-[62px] py-9">
        {/* Back button */}
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 px-3 py-2 text-[16px] font-sans font-normal text-[#3D3D3D] rounded-lg"
            style={{
              background: "linear-gradient(360deg, #FFFFFF 50.48%, #EBEBEB 100%)",
              border: "0.6px solid #D1D1D1",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
        </div>

        {/* Form — vertically centred */}
        <div className="flex flex-col items-center gap-6 max-w-[412px] w-full mx-auto">
          {/* EYRA logo */}
          <Logo variant="dark" size="md" />

          {/* Page title */}
          <h1 className="font-sans font-normal text-[32px] leading-[48px] text-[#3D3D3D] text-center w-full">
            Log in to Eyra
          </h1>

          {/* Clerk sign-in form */}
          <SignIn
            appearance={appearance}
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>

        {/* Page footer */}
        <div className="flex justify-between font-sans font-normal text-[20px] leading-[30px] text-[#787878]">
          <Link href="/privacy-policy" className="hover:text-black transition-colors duration-200">
            Privacy policy
          </Link>
          <span>Copyright 2026</span>
        </div>
      </div>
    </div>
  );
}
