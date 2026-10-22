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
});
