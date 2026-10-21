import { expect, test } from "@playwright/test";

test.describe("HU-002 / RF-006 a RF-010", () => {
  test("reconoce la primera dirección válida y mueve solo en el tick siguiente", async ({
    page,
  }) => {
    await page.goto("/");
    await page.clock.install();
    await page.clock.pauseAt(new Date("2026-10-21T12:00:00.000Z"));
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("snake-head")).toHaveText("10,10");
    const startedAt = await page.evaluate(() => performance.now());
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Arriba", {
      timeout: 100,
    });
    const recognizedAt = await page.evaluate(() => performance.now());
    expect(recognizedAt - startedAt).toBeLessThanOrEqual(100);
    await expect(page.getByTestId("snake-head")).toHaveText("10,10");

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Arriba");
    await page.clock.fastForward(149);
    await expect(page.getByTestId("snake-head")).toHaveText("10,10");
    await page.clock.fastForward(1);
    await expect(page.getByTestId("snake-head")).toHaveText("10,9");
  });

  test("rechaza la opuesta sin consumir la entrada y admite las cuatro flechas", async ({
    page,
  }) => {
    await page.goto("/");
    await page.clock.install();
    await page.clock.pauseAt(new Date("2026-10-21T12:00:00.000Z"));
    await page.keyboard.press("Enter");

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Derecha");
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Arriba");
    await page.clock.fastForward(150);
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("accepted-direction")).toHaveText(
      "Izquierda",
    );
    await page.clock.fastForward(150);
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Abajo");
    await page.clock.fastForward(150);
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Derecha");
  });

  test("ignora flechas fuera de running y teclas no admitidas", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("KeyA");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Derecha");
    await expect(page.getByTestId("snake-head")).toHaveText("10,10");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("accepted-direction")).toHaveText("Derecha");
  });
});
