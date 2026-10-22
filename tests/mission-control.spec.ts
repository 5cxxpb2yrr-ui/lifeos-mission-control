import { test, expect } from "@playwright/test";

test("capture, edit, complete, search, and persist an entry", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Capture" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Title").fill("Browser verification task");
  await page.getByLabel("Details").fill("Confirm the local capture flow.");
  await page.getByRole("button", { name: "Save entry" }).click();

  await expect(page.getByRole("heading", { name: "Browser verification task" })).toBeVisible();
  await page.getByRole("button", { name: "Edit entry" }).click();
  await page.getByLabel("Title").fill("Edited browser verification task");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Edited browser verification task" })).toBeVisible();

  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByText("Inbox is clear")).toBeVisible();

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search saved titles, details, types…").fill("Edited browser verification task");
  await expect(page.getByRole("heading", { name: "Edited browser verification task" })).toBeVisible();

  await page.reload();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search saved titles, details, types…").fill("Edited browser verification task");
  await expect(page.getByRole("heading", { name: "Edited browser verification task" })).toBeVisible();
});

test("people and assets route to Entities", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Capture" }).click();
  await page.getByLabel("Entry type").selectOption("person");
  await page.getByLabel("Title").fill("Browser test contact");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("heading", { name: "Browser test contact" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entities" })).toBeVisible();

  await page.getByRole("button", { name: "Capture" }).click();
  await page.getByLabel("Entry type").selectOption("asset");
  await page.getByLabel("Title").fill("Browser test asset");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("heading", { name: "Browser test asset" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entities" })).toBeVisible();
});

test("capture canonical mobile Mission Control screenshot artifact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.screenshot({
    path: "artifacts/mission-control-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("optional due date stays tucked away and persists when set", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Capture" }).click();

  const advanced = page.locator("details.capture-advanced");
  await expect(advanced).toBeVisible();
  await expect(advanced).not.toHaveJSProperty("open", true);
  await expect(page.getByLabel("Due date")).not.toBeVisible();

  await advanced.locator("summary").click();
  await expect(page.getByLabel("Due date")).toBeVisible();
  await page.getByLabel("Title").fill("Due date disclosure test");
  await page.getByLabel("Due date").fill("2026-10-25");
  await expect(advanced).toContainText("Due date set");
  await page.getByRole("button", { name: "Save entry" }).click();

  await expect(page.getByRole("heading", { name: "Due date disclosure test" })).toBeVisible();
  await page.getByRole("button", { name: "Edit entry" }).click();
  await advanced.locator("summary").click();
  await expect(page.getByLabel("Due date")).toHaveValue("2026-10-25");
});
