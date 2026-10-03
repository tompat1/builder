import { test, expect } from "@playwright/test";

test.describe("3D Modular House Configurator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders 3D canvas and header UI controls", async ({ page }) => {
    // Canvas WebGL element rendered
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Studio title & status badge
    await expect(page.locator("text=MODULAR STUDIO")).toBeVisible();
    await expect(page.locator("text=3D MVP")).toBeVisible();

    // Initial View Mode: Utsida
    const utsidaBtn = page.locator("#toggle-utsida");
    const insidaBtn = page.locator("#toggle-insida");
    await expect(utsidaBtn).toHaveAttribute("aria-selected", "true");
    await expect(insidaBtn).toHaveAttribute("aria-selected", "false");

    // Toggle to Insida
    await insidaBtn.click();
    await expect(insidaBtn).toHaveAttribute("aria-selected", "true");
    await expect(utsidaBtn).toHaveAttribute("aria-selected", "false");
  });

  test("navigates through configuration categories and updates options", async ({ page }) => {
    // 1. Size Category
    await page.locator("#category-size").click();
    await expect(page.locator("text=Storlek & Grundmått")).toBeVisible();
    await expect(page.locator("#option-size-15")).toBeVisible();
    await expect(page.locator("#option-size-30")).toBeVisible();

    // 2. Roof Category
    await page.locator("#category-roof").click();
    await expect(page.locator("text=Taktyp & Vinkel")).toBeVisible();
    await expect(page.locator("#option-sadeltak")).toBeVisible();
    await expect(page.locator("#option-pulpettak")).toBeVisible();

    // 3. Loft Category
    await page.locator("#category-loft").click();
    await expect(page.locator("text=Loft & Rymd")).toBeVisible();
    await expect(page.locator("#option-sleeping")).toBeVisible();

    // 4. Doors Category
    await page.locator("#category-doors").click();
    await expect(page.locator("text=Ytterdörrar")).toBeVisible();
    await expect(page.locator("#option-STEHAG")).toBeVisible();
    await expect(page.locator("#option-SVANSHALL")).toBeVisible();
  });

  test("updates total price dynamically when selecting options", async ({ page }) => {
    // Get initial price text
    const priceLocator = page.locator("header span.tabular-nums");
    const initialPrice = await priceLocator.textContent();
    expect(initialPrice).toContain("kr");

    // Select Sadeltak (+14 800 kr)
    await page.locator("#category-roof").click();
    await page.locator("#option-sadeltak").click();

    // Price should have updated
    const updatedPrice = await priceLocator.textContent();
    expect(updatedPrice).not.toEqual(initialPrice);
  });

  test("AI assistant interprets suggestions and updates configurator", async ({ page }) => {
    await page.locator("button:has-text('Sadeltak + Sovloft')").click();

    // Feedback confirms action
    await expect(page.locator("text=Sadeltak och sovloft aktiverat")).toBeVisible();
  });

  test("opens and displays export modal with download options", async ({ page }) => {
    await page.locator("#btn-next-step").click();

    await expect(page.locator("text=Exportera Byggsatshandlingar")).toBeVisible();
    await expect(page.locator("text=2D Planritning (SVG)")).toBeVisible();
    await expect(page.locator("text=Högupplöst 3D-rendering (PNG)")).toBeVisible();

    // Close modal
    await page.locator("#btn-close-modal").click();
    await expect(page.locator("text=Exportera Byggsatshandlingar")).not.toBeVisible();
  });
});
