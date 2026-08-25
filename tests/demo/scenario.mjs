export default async function soundGuessScenario(a, b) {
  await a.getByLabel("Your display name").fill("Ari");
  await b.getByLabel("Your display name").fill("Bea");
  await a.getByRole("button", { name: "Start the first clue" }).click();
  await b.getByLabel("Your guess").fill("dog");
  await b.getByRole("button", { name: "Send guess" }).click();
  await a.getByText("Correct", { exact: true }).waitFor();
  await Promise.all(
    [a, b].map((page) =>
      page.locator("#sound-round").evaluate((round) => {
        window.scrollTo({ top: round.getBoundingClientRect().top + window.scrollY - 88 });
      }),
    ),
  );
  await a.waitForTimeout(350);
}
