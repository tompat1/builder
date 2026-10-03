import { test, expect } from "@playwright/test";

test.describe("Smoke verification", () => {
  test("Playwright browser harness is operational", async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Builder App</title>
        </head>
        <body>
          <main id="app">
            <h1>Builder Workspace</h1>
          </main>
        </body>
      </html>
    `);

    const heading = page.locator("h1");
    await expect(heading).toHaveText("Builder Workspace");
  });
});
