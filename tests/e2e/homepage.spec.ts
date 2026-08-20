import { test, expect } from "@playwright/test";

test("homepage loads with nav and branding", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);

  await expect(page).toHaveTitle(/EYRA/i);
  await expect(page.getByRole("link", { name: /EYRA/i }).first()).toBeVisible();

  // Primary nav is present
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Collections" })
  ).toBeVisible();
});

test("nav links to cart, wishlist, and products work", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page).toHaveURL(/\/cart$/);

  await page.goto("/");
  await page.getByRole("link", { name: "Wishlist" }).click();
  await expect(page).toHaveURL(/\/wishlist$/);
});
