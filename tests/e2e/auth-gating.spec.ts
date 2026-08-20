import { test, expect } from "@playwright/test";

test.describe("route protection", () => {
  test("checkout requires sign-in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/sign-in|clerk/i);
  });

  test("orders requires sign-in", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/sign-in|clerk/i);
  });

  test("account requires sign-in", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/sign-in|clerk/i);
  });

  test("cart does NOT require sign-in", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart$/);
  });

  test("products does NOT require sign-in", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/products$/);
  });
});
