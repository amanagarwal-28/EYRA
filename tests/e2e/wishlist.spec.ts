import { test, expect } from "@playwright/test";

test("add a product to wishlist from its detail page, then see it on /wishlist", async ({ page }) => {
  await page.goto("/products");

  const firstCard = page.locator("article").first();
  const productName = await firstCard.getByRole("heading").innerText();
  await firstCard.getByRole("heading").getByRole("link").click();

  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Remove from wishlist" })).toBeVisible();

  await page.goto("/wishlist");
  await expect(page.getByText(productName)).toBeVisible();
});
