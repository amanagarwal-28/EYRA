export {};

declare global {
  interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  interface RazorpayPrefill {
    name?: string;
    email?: string;
    contact?: string;
    method?: "card" | "netbanking" | "wallet" | "emi" | "upi";
  }

  interface RazorpayTheme {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  }

  interface RazorpayModal {
    backdropclose?: boolean;
    escape?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    ondismiss?: () => void;
    animation?: boolean;
  }

  interface RazorpayRetry {
    enabled?: boolean;
    max_count?: number;
  }

  interface RazorpayOptions {
    /** Your Razorpay publishable key (NEXT_PUBLIC_RAZORPAY_KEY_ID). */
    key: string;
    /** Payment amount in smallest currency unit (paise for INR). */
    amount: number;
    currency: string;
    name?: string;
    description?: string;
    image?: string;
    /** Server-generated Razorpay order ID. Required for signature verification. */
    order_id?: string;
    prefill?: RazorpayPrefill;
    notes?: Record<string, string>;
    theme?: RazorpayTheme;
    modal?: RazorpayModal;
    retry?: RazorpayRetry;
    /** Called by Razorpay after a successful payment capture. */
    handler?: (response: RazorpayPaymentResponse) => void;
    callback_url?: string;
    redirect?: boolean;
    customer_id?: string;
    timeout?: number;
    remember_customer?: boolean;
    readonly?: Partial<Record<keyof RazorpayPrefill, boolean>>;
    send_sms_hash?: boolean;
    allow_rotation?: boolean;
    recurring?: boolean;
    subscription_id?: string;
    subscription_card_change?: boolean;
  }

  interface RazorpayInstance {
    open(): void;
    close(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
  }

  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
