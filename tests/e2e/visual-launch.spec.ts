import { expect, test } from "@playwright/test";

test("the play launch keeps its primary action visible on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./", { waitUntil: "domcontentloaded" });

  const launch = page.locator(".sound-launch");
  await expect(launch).toBeVisible();
  await expect(launch.getByLabel("Live sound round")).toBeVisible();
  await expect(
    launch.getByRole("button", { name: /start the first clue|preparing the room/i }),
  ).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test("the desktop launch keeps the real game action above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 1141, height: 602 });
  await page.goto("./", { waitUntil: "domcontentloaded" });

  const launch = page.locator(".sound-launch");
  const primaryAction = launch.getByRole("button", {
    name: /start the first clue|preparing the room/i,
  });
  await expect(launch).toBeVisible();
  await expect(launch.getByLabel("Live sound round")).toBeVisible();
  await expect(primaryAction).toBeVisible();
  await expect
    .poll(async () => {
      const box = await primaryAction.boundingBox();
      return box ? box.y + box.height <= 602 : false;
    })
    .toBe(true);
});
