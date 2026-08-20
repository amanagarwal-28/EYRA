import { test, expect } from "@playwright/test";

test("products page lists products", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: /All Products/i })).toBeVisible();

  const cards = page.locator("article");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
});

test("clicking a product navigates to its detail page", async ({ page }) => {
  // Regression test: ProductCard previously had no link to the PDP at all —
  // only "Add to cart" worked, and "Quick view" did nothing.
  await page.goto("/products");

  const firstCard = page.locator("article").first();
  const productName = await firstCard.getByRole("heading").innerText();

  await firstCard.getByRole("heading").getByRole("link").click();

  await expect(page).toHaveURL(/\/products\/[^/]+$/);
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
});

test("search matches whole words, not substrings inside unrelated words", async ({ page }) => {
  // Regression test: naive substring search on "ring" previously matched
  // every earring too, since "earring" contains "ring" mid-word.
  await page.goto("/products?q=ring");

  const cardTitles = await page.locator("article h3").allInnerTexts();
  expect(cardTitles.length).toBeGreaterThan(0);
  for (const title of cardTitles) {
    expect(title.toLowerCase()).not.toContain("earring");
  }
});

test("search with no matches shows the empty state", async ({ page }) => {
  await page.goto("/products?q=zzzznonexistentproductzzzz");
  await expect(page.getByText(/No products match your filters/i)).toBeVisible();
});

test("type filter narrows results to the selected category", async ({ page }) => {
  await page.goto("/products");

  // Open the Type dropdown, then check "Rings". exact:true matters since
  // "Rings" is otherwise a substring match of "Earrings" too.
  await page.getByRole("button", { name: "Type" }).click();
  await page.getByRole("menu").getByText("Rings", { exact: true }).click();

  const cardTitles = await page.locator("article h3").allInnerTexts();
  expect(cardTitles.length).toBeGreaterThan(0);
  for (const title of cardTitles) {
    expect(title.toLowerCase()).not.toContain("chain");
    expect(title.toLowerCase()).not.toContain("earring");
  }
});
