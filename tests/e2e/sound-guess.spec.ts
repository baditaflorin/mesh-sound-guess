import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

test("a sound clue and a correct guess propagate to another peer", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: "mesh-sound-guess",
  });
  try {
    await a.getByLabel("Your display name").fill("Ari");
    await b.getByLabel("Your display name").fill("Bea");
    await a.getByRole("button", { name: "Start a sound" }).click();
    await expect(b.getByRole("button", { name: "Send guess" })).toBeVisible({ timeout: 10_000 });
    await b.getByLabel("Your guess").fill("dog");
    await b.getByRole("button", { name: "Send guess" }).click();
    await expect(a.getByText("Bea: dog")).toBeVisible({ timeout: 10_000 });
    await expect(a.getByText("Correct", { exact: true })).toBeVisible();
  } finally {
    await cleanup();
  }
});
