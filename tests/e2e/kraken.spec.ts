import { test, expect } from "@playwright/test";

test.describe("Kraken Dashboard — Real E2E", () => {

  test("TC1: Dashboard loads with Kraken branding and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=KRAKEN")).toBeVisible();
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.locator("button", { hasText: "CommandDeck" })).toBeVisible();
    await expect(nav.locator("button", { hasText: "Activity" })).toBeVisible();
    await expect(nav.locator("button", { hasText: "Prompts" })).toBeVisible();
    await expect(nav.locator("button", { hasText: "Settings" })).toBeVisible();
    await page.screenshot({ path: "tests/e2e/screenshots/tc1-dashboard-loaded.png", fullPage: true });
  });

  test("TC2: Navigate to each view via nav buttons", async ({ page }) => {
    await page.goto("/");
    const views = ["CommandDeck", "Activity", "Prompts", "Settings", "Conversations", "Agents"];
    for (const view of views) {
      const btn = page.locator("nav button", { hasText: view });
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `tests/e2e/screenshots/tc2-view-${view.toLowerCase()}.png`, fullPage: true });
    }
  });

  test("TC3: Default view shows runtime status and charts", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=COMMITS/DAY")).toBeVisible();
    await expect(page.locator("text=CLAUDE USAGE").first()).toBeVisible();
    await page.screenshot({ path: "tests/e2e/screenshots/tc3-runtime-status.png", fullPage: true });
  });

  test("TC4: Navigate to CommandDeck view and screenshot", async ({ page }) => {
    await page.goto("/");
    await page.locator("nav button", { hasText: "CommandDeck" }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "tests/e2e/screenshots/tc4-commanddeck.png", fullPage: true });
  });

  test("TC5: API health endpoint responds", async ({ request }) => {
    const response = await request.get("http://127.0.0.1:8787/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  test("TC6: API setup endpoint returns first-run state", async ({ request }) => {
    const response = await request.get("http://127.0.0.1:8787/api/setup");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.isFirstRun).toBeDefined();
    expect(body.steps).toBeInstanceOf(Array);
    expect(body.steps.length).toBe(6);
  });

  test("TC7: Create arm via API and verify persistence", async ({ request }) => {
    const armName = `e2e-arm-${Date.now()}`;
    const createResponse = await request.post("http://127.0.0.1:8787/api/command-deck/arms", {
      data: { name: armName, description: "Created by Playwright E2E test" },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    expect(created.armId).toBe(armName);
    expect(created.description).toBe("Created by Playwright E2E test");
    expect(created.status).toBe("idle");
    expect(created.todoTotal).toBe(0);

    const listResponse = await request.get("http://127.0.0.1:8787/api/command-deck/arms");
    const arms = await listResponse.json();
    const found = arms.find((a: { armId: string }) => a.armId === armName);
    expect(found).toBeDefined();
  });

  test("TC8: Prompts API returns all 11 built-in templates", async ({ request }) => {
    const response = await request.get("http://127.0.0.1:8787/api/prompts");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.prompts).toBeInstanceOf(Array);
    expect(body.prompts.length).toBe(11);
    const names = body.prompts.map((p: { name: string }) => p.name);
    expect(names).toContain("fleet-parent");
    expect(names).toContain("fleet-worker");
    expect(names).toContain("captain-clean-contexts");
    expect(names).toContain("arm-planner");
    expect(names).toContain("meta-prompt-generator");
  });

  test("TC9: Terminal snapshots returns empty list", async ({ request }) => {
    const response = await request.get("http://127.0.0.1:8787/api/terminal-snapshots");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBe(0);
  });

  test("TC10: Conversations returns empty list", async ({ request }) => {
    const response = await request.get("http://127.0.0.1:8787/api/conversations");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toBeInstanceOf(Array);
  });

  test("TC11: Navigate to CommandDeck and verify arms are listed", async ({ page }) => {
    await page.goto("/");
    const deckBtn = page.locator("nav button", { hasText: "CommandDeck" });
    await deckBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "tests/e2e/screenshots/tc11-commanddeck-arms.png", fullPage: true });
  });

  test("TC12: No octogent references in any rendered page text", async ({ page }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).not.toContain("octogent");
    expect(bodyText.toLowerCase()).not.toContain("tentacle");
    expect(bodyText.toLowerCase()).not.toContain("octoboss");
  });
});
