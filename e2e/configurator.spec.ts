import { test, expect } from "@playwright/test";

test.describe("3D Modular House Configurator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
  });

  test("renders 3D canvas and header UI controls with Builder branding", async ({ page }) => {
    // Canvas WebGL element rendered
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Brand title & quick-action buttons
    await expect(page.locator("text=Builder")).toBeVisible();
    await expect(page.locator("#toggle-utsida")).toBeVisible();
    await expect(page.locator("#toggle-insida")).toBeVisible();

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

  test("supports material selection with Wood as default in the first right panel", async ({ page }) => {
    // Ensure size category (first panel) is open
    await page.locator("#category-size").click();
    await page.locator("#size-tab-facade").click();
    await expect(page.locator("text=Fasadmaterial & Panel")).toBeVisible();

    // Wood is default material, on the facade tab
    const woodBtn = page.locator("#material-wood");
    await expect(woodBtn).toBeVisible();
    await expect(page.locator("text=Vald: Obehandlad Gran")).toBeVisible();

    // Select Faluröd on the colour tab
    await page.locator("#size-tab-colour").click();
    const falurodBtn = page.locator("#material-falurod");
    await falurodBtn.scrollIntoViewIfNeeded();
    await falurodBtn.click();
    await expect(page.locator("text=Vald: Falu Rödfärg")).toBeVisible();
  });

  test("provides lower-left floating toolset with zoom, measure, and undo/redo", async ({ page }) => {
    // Toolset buttons
    const zoomInBtn = page.locator("#btn-tool-zoom-in");
    const zoomOutBtn = page.locator("#btn-tool-zoom-out");
    const measureBtn = page.locator("#btn-tool-measure");
    const undoBtn = page.locator("#btn-tool-undo");
    const redoBtn = page.locator("#btn-tool-redo");
    const notesBtn = page.locator("#btn-tool-notes");
    const notesTray = page.locator("#note-tools");
    const moodBtn = notesTray.locator("#btn-tool-mood");

    await expect(zoomInBtn).toBeVisible();
    await expect(zoomOutBtn).toBeVisible();
    await expect(measureBtn).toBeVisible();
    await expect(undoBtn).toBeVisible();
    await expect(redoBtn).toBeVisible();

    // Click zoom in and out
    await zoomInBtn.click();
    await zoomOutBtn.click();

    // Toggle measurements
    await measureBtn.click();
    await measureBtn.click();

    // Mood board belongs to the Notes tray rather than taking its own toolbar slot.
    await expect(page.locator("#btn-tool-mood")).toHaveCount(1);
    await expect(notesTray).toHaveAttribute("aria-hidden", "true");
    await notesBtn.click();
    await expect(notesTray).toHaveAttribute("aria-hidden", "false");
    await moodBtn.click();
    await expect(moodBtn).toHaveAttribute("aria-pressed", "true");
    await page.locator("#btn-mood-close").click();
    await expect(moodBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("opens AI concierge from the toolbar instead of the configuration panel", async ({ page }) => {
    const conciergeButton = page.locator("#btn-tool-ai-concierge");
    const conciergePanel = page.locator("#ai-concierge-panel");

    await expect(conciergeButton).toBeVisible();
    await expect(page.locator("#house-import")).toHaveCount(0);

    await conciergeButton.click();
    await expect(conciergeButton).toHaveAttribute("aria-expanded", "true");
    await expect(conciergePanel).toBeVisible();
    await expect(conciergePanel.locator("#house-import")).toBeVisible();

    await page.locator("#btn-close-ai-concierge").click();
    await expect(conciergePanel).toHaveCount(0);
  });

  test("places the configured 3D house into an uploaded site photo", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("builder.onboarding", "seen");
      localStorage.setItem("builder.sound.consent", "denied");
      localStorage.setItem("builder.cookies.consent", "essential");
    });
    await page.reload();

    let requestBody: {
      scene?: { mode?: string; placement?: { x?: number; y?: number }; facing?: string };
      images?: unknown[];
      facts?: string;
    } | null = null;
    await page.route("**/api/render", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        json: { image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XxQYVwAAAABJRU5ErkJggg==" }
      });
    });

    await page.locator("#btn-tool-ai-concierge").evaluate((button: HTMLButtonElement) => button.click());
    await page.locator("#import-site-photos").setInputFiles("public/homes/home-29-9m2.webp");
    await expect(page.locator("#site-placement-photo")).toBeVisible();
    await page.locator("#site-facing-back").click();
    await page.locator("#import-site-render").click();

    await expect(page.locator("#site-picture-result")).toBeVisible({ timeout: 30_000 });
    const body = requestBody as {
      scene?: { mode?: string; placement?: { x?: number; y?: number }; facing?: string };
      images?: unknown[];
      facts?: string;
    } | null;
    expect(body?.scene?.mode).toBe("site");
    expect(body?.images).toHaveLength(2);
    expect(body?.images?.[0]).toMatch(/^data:image\/jpeg;base64,/);
    expect(body?.images?.[1]).toMatch(/^data:image\/jpeg;base64,/);
    expect(body?.facts).toContain("6040 × 4950 × 5000 mm");
    expect(body?.scene?.placement?.x).toBe(50);
    expect(body?.scene?.placement?.y).toBe(68);
    expect(body?.scene?.facing).toBe("back");
  });

  test("displays 3D architectural dimension annotations", async ({ page }) => {
    await page.locator("#btn-tool-measure").click();
    await page.locator("#btn-tool-dimensions").click();
    await expect(page.locator("#dim-width")).toHaveText(/6040 mm/);
    await expect(page.locator("#dim-area")).toHaveText(/21.2 m²/);

    // Roof angle annotation (12° for pulpettak)
    await expect(page.locator("#dim-roof-angle")).toHaveText(/12°/);
  });

  test("interacts with wall slots by mouse or touch to choose doors or windows", async ({ page, isMobile }) => {
    if (isMobile) {
      const toggleMobileBtn = page.locator("#btn-toggle-mobile-sheet");
      if (await toggleMobileBtn.isVisible()) {
        await toggleMobileBtn.click();
      }
    }

    // The door/window picker stays hidden until a wall panel is selected.
    const canvas = page.locator("canvas");
    if (isMobile) {
      const bounds = await canvas.boundingBox();
      expect(bounds).not.toBeNull();
      await page.touchscreen.tap(bounds!.x + 280, bounds!.y + 320);
    } else {
      await canvas.click({ position: { x: 280, y: 320 } });
    }

    const chooseDoorBtn = page.locator("#btn-choose-door");
    const chooseWinBtn = page.locator("#btn-choose-window");

    await expect(chooseDoorBtn).toBeVisible();
    await expect(chooseWinBtn).toBeVisible();

    // Click Välj fönster switches to windows category
    await chooseWinBtn.click();
    await expect(page.locator("text=Fönsterpartier")).toBeVisible();
  });

  test("navigates through configuration categories and updates options", async ({ page }) => {
    // 1. Size Category
    await page.locator("#category-size").scrollIntoViewIfNeeded();
    await page.locator("#category-size").click();
    await expect(page.locator("text=Storlek & Grundmått")).toBeVisible();
    await expect(page.locator("#option-size-15")).toBeVisible();
    await expect(page.locator("#option-size-30")).toBeVisible();

    // 2. Roof Category
    await page.locator("#category-roof").scrollIntoViewIfNeeded();
    await page.locator("#category-roof").click();
    await expect(page.locator("text=Taktyp & Vinkel")).toBeVisible();
    await expect(page.locator("#option-sadeltak")).toBeVisible();
    await expect(page.locator("#option-pulpettak")).toBeVisible();

    // 3. Loft Category
    await page.locator("#category-loft").scrollIntoViewIfNeeded();
    await page.locator("#category-loft").click();
    await expect(page.locator("text=Loft & Rymd")).toBeVisible();
    await expect(page.locator("#option-sleeping")).toBeVisible();

    // 4. Doors Category
    await page.locator("#category-doors").scrollIntoViewIfNeeded();
    await page.locator("#category-doors").click();
    await expect(page.locator("h4:has-text('Ytterdörrar')")).toBeVisible();
    await expect(page.locator("#option-STEHAG")).toBeVisible();
    await expect(page.locator("#option-SVANSHALL")).toBeVisible();
  });

  test("updates total price dynamically when selecting options", async ({ page }) => {
    // Get initial price text
    const priceLocator = page.locator("header span.tabular-nums");
    const initialPrice = await priceLocator.textContent();
    expect(initialPrice).toContain("kr");

    // Select Sadeltak (+14 800 kr)
    await page.locator("#category-roof").scrollIntoViewIfNeeded();
    await page.locator("#category-roof").click();
    await page.locator("#option-sadeltak").scrollIntoViewIfNeeded();
    await page.locator("#option-sadeltak").click();

    // Price should have updated
    const updatedPrice = await priceLocator.textContent();
    expect(updatedPrice).not.toEqual(initialPrice);
  });

  test("AI assistant interprets suggestions and updates configurator", async ({ page }) => {
    const aiBtn = page.locator("button:has-text('Sadeltak + Sovloft')");
    await aiBtn.scrollIntoViewIfNeeded();
    await aiBtn.click();

    // Feedback confirms action
    await expect(page.locator("text=Sadeltak och sovloft aktiverat")).toBeVisible();
  });

  test("opens and displays export modal with download options", async ({ page }) => {
    const nextBtn = page.locator("#btn-next-step");
    await nextBtn.scrollIntoViewIfNeeded();
    await nextBtn.click();

    await expect(page.locator("text=Exportera Byggsatshandlingar")).toBeVisible();
    await expect(page.locator("text=2D Planritning (SVG)")).toBeVisible();
    await expect(page.locator("text=Högupplöst 3D-rendering (PNG)")).toBeVisible();

    // Close modal
    await page.locator("#btn-close-modal").click();
    await expect(page.locator("text=Exportera Byggsatshandlingar")).not.toBeVisible();
  });

  test("displays and places narrow-tall window from window catalog", async ({ page, isMobile }) => {
    const canvas = page.locator("canvas");
    if (isMobile) {
      const bounds = await canvas.boundingBox();
      expect(bounds).not.toBeNull();
      await page.touchscreen.tap(bounds!.x + 280, bounds!.y + 320);
    } else {
      await canvas.click({ position: { x: 280, y: 320 } });
    }

    const chooseWinBtn = page.locator("#btn-choose-window");
    await chooseWinBtn.click();
    await expect(page.locator("text=Fönsterpartier")).toBeVisible();

    const narrowTallBtn = page.locator("#option-narrow-tall");
    await expect(narrowTallBtn).toBeVisible();
    await expect(narrowTallBtn).toContainText("Smalhögt fönster");
    await expect(narrowTallBtn).toContainText("6×18");
    await narrowTallBtn.click();
  });
});
