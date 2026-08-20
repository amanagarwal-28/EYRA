import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a local dev server by default (npm run dev), or against
 * PLAYWRIGHT_BASE_URL (e.g. the live site) when set, which is useful for
 * smoke-testing production after a deploy without needing a local build.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const usingExternalServer = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],

  /**
   * The Next dev server compiles each route on first request. Running many
   * workers against it means every worker triggers a cold compile at once,
   * which starves the server and produces timeouts that look like product
   * bugs but are pure contention. Serially the same suite runs at 1 to 2
   * seconds per test.
   *
   * So: one worker against a local dev server, full parallelism when pointed
   * at an already-built server via PLAYWRIGHT_BASE_URL.
   */
  workers: usingExternalServer ? undefined : 1,

  /**
   * The site deliberately has no root loading.tsx: it opened a Suspense
   * boundary that committed a 200 before any page could call notFound(),
   * turning every missing page into a soft 404. Without it a navigation
   * commits only once the server responds, so allow more than the 5s default
   * for a first, uncompiled route.
   */
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL,
    trace: "on-first-retry",
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: usingExternalServer
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
