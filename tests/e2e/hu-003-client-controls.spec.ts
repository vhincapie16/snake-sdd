import { expect, test } from "@playwright/test";

test("HU-003 / integración RF-001–RF-010: Enter inicia sin clic y después de reiniciar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Sin reloj falso: también comprueba la inicialización real del cliente en desarrollo.
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("En curso");
  await page
    .getByRole("button", { name: "Pausar (Espacio)", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Pausada");
  const pausedHead = await page.getByTestId("snake-head").textContent();
  await page.waitForTimeout(350);
  await expect(page.getByTestId("snake-head")).toHaveText(pausedHead!);
  await page
    .getByRole("button", { name: "Reanudar (Espacio)", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("En curso");

  const restart = page.getByRole("button", {
    name: "Reiniciar (R)",
    exact: true,
  });
  await restart.click();
  await expect(restart).toBeFocused();
  await expect(page.getByRole("status")).toContainText("Preparada");
  await page.waitForTimeout(200);
  await expect(page.getByTestId("snake-head")).toHaveText("10,10");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("En curso");

  await page.keyboard.press("KeyR");
  await expect(page.getByRole("status")).toContainText("Preparada");
  await expect(page.getByTestId("score")).toHaveText("0");
  await page.waitForTimeout(200);
  await expect(page.getByTestId("snake-head")).toHaveText("10,10");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("En curso");
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("accepted-direction")).toHaveText("Arriba");
  await expect(page.getByTestId("snake-head")).not.toHaveText("10,10");
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await page.keyboard.press("Space");
  await expect(page.getByRole("status")).toContainText("Pausada");

  const panel = page.getByRole("region", { name: "Estado de la partida" });
  await expect(panel.getByText("Estado", { exact: true })).toBeVisible();
  await expect(panel.getByText("Puntuación", { exact: true })).toBeVisible();
  await expect(panel.getByText("Ritmo", { exact: true })).toBeVisible();
  for (const id of ["snake-head", "accepted-direction", "snake-length"]) {
    await expect(page.getByTestId(id)).not.toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("KAN-3 / integración RF-004: reinicia sin crypto.randomUUID", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Reiniciar (R)", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Preparada");
  await expect(page.getByTestId("snake-head")).toHaveText("10,10");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("En curso");
  await page.keyboard.press("KeyR");
  await expect(page.getByRole("status")).toContainText("Preparada");
  await expect(page.getByTestId("score")).toHaveText("0");
});
