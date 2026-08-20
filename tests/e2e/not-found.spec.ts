import { test, expect } from "@playwright/test";

test("unknown route shows the branded 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist-e2e-test");
  expect(response?.status()).toBe(404);

  await expect(page.getByRole("heading", { name: /Page Not Found/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Browse Products/i })).toBeVisible();
});
