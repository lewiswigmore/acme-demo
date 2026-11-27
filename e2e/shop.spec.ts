import { expect, test } from "@playwright/test";

test("creates an order and retains it after reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toMatch(
    /script-src[^;]*'nonce-[^']+'/,
  );
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  await expect(page.getByText("No orders yet.")).toBeVisible();
  await page.getByLabel("Product").selectOption("desk-tray");
  await page.getByLabel("Quantity").fill("3");
  await page.getByRole("button", { name: "Create order" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Order created." }),
  ).toBeVisible();
  await expect(page.getByText("Qty 3")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Qty 3")).toBeVisible();
  await expect(
    page.locator(".order-list").getByText("Desk tray"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("invalid quantity is blocked and failure preserves the draft", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Product")).toBeEnabled();
  await page.getByLabel("Quantity").fill("21");
  await page.getByRole("button", { name: "Create order" }).click();
  expect(
    await page
      .getByLabel("Quantity")
      .evaluate((input: HTMLInputElement) => input.validity.valid),
  ).toBe(false);
  await page.getByLabel("Product").selectOption("utility-tote");
  await page.getByLabel("Quantity").fill("2");
  await page.route("**/api/orders", async (route) => {
    if (route.request().method() === "POST")
      await route.fulfill({ status: 500, body: "{}" });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Create order" }).click();
  await expect(page.getByText(/Could not create the order/)).toBeVisible();
  await expect(page.getByLabel("Quantity")).toHaveValue("2");
  await expect(page.getByLabel("Product")).toHaveValue("utility-tote");
});
