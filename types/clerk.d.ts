export {};

declare global {
  interface UserPublicMetadata {
    /** Medusa customer ID bound on first sign-in. Used to look up order history and saved addresses. */
    medusaCustomerId?: string;
  }
}
