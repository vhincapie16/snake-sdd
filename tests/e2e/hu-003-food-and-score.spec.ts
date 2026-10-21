import { expect, test } from "@playwright/test";

test.describe("HU-003 / RF-011 a RF-015 y RF-029", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-21T11:00:00.000Z") });
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
  });

  test("consume una vez, repone libre y conserva ticks de 150 ms tras varios consumos", async ({
    page,
  }) => {
    await page.goto("/?fixture=food-and-score");
    await page.clock.pauseAt(new Date("2026-10-21T12:00:00.000Z"));
    await expect(page.getByTestId("food-cell")).toHaveAttribute(
      "data-cell",
      "11,10",
    );
    await expect(page.getByTestId("snake-segment")).toHaveCount(3);
    await page
      .getByRole("button", { name: "Iniciar (Enter)", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("En curso");
    await page.clock.runFor(149);
    await expect(page.getByTestId("score")).toHaveText("0");
    await page.clock.runFor(1);
    await expect(page.getByTestId("score")).toHaveText("10");
    await expect(page.getByTestId("snake-segment")).toHaveCount(4);
    await expect(page.getByTestId("food-cell")).toHaveCount(1);
    await expect(page.getByTestId("food-cell")).toHaveAttribute(
      "data-cell",
      "0,0",
    );
    await expect(
      page.getByTestId("snake-segment").filter({ hasText: "●" }),
    ).toHaveCount(3);
    await page.keyboard.press("ArrowUp");
    await page.clock.runFor(149);
    await expect(page.getByTestId("snake-head")).toHaveText("11,10");
    await page.clock.runFor(1);
    await expect(page.getByTestId("snake-head")).toHaveText("11,9");
    await expect(page.getByTestId("score")).toHaveText("10");
    await expect(page.getByTestId("snake-segment")).toHaveCount(4);
    await page.clock.runFor(9 * 150);
    await page.keyboard.press("ArrowLeft");
    await page.clock.runFor(11 * 150);
    await expect(page.getByTestId("score")).toHaveText("20");
    await expect(page.getByTestId("snake-segment")).toHaveCount(5);
    await expect(page.getByTestId("food-cell")).toHaveAttribute(
      "data-cell",
      "5,0",
    );
    await page.keyboard.press("ArrowDown");
    await page.clock.runFor(149);
    await expect(page.getByTestId("snake-head")).toHaveText("0,0");
    await page.clock.runFor(1);
    await expect(page.getByTestId("snake-head")).toHaveText("0,1");
    await expect(page.getByTestId("score")).toHaveText("20");
    await expect(page.getByTestId("snake-segment")).toHaveCount(5);
    await page.keyboard.press("Space");
    await page.clock.runFor(10_000);
    await expect(page.getByTestId("snake-head")).toHaveText("0,1");
    await expect(page.getByTestId("score")).toHaveText("20");
  });

  test("RN-010: completa el tablero sin reponer y conserva puntuación final", async ({
    page,
  }) => {
    await page.goto("/?fixture=almost-full-board");
    await page.clock.pauseAt(new Date("2026-10-21T12:00:00.000Z"));
    await expect(page.getByTestId("snake-segment")).toHaveCount(399);
    await page
      .getByRole("button", { name: "Iniciar (Enter)", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("En curso");
    await page.clock.runFor(150);
    await expect(page.getByRole("status")).toContainText("Finalizada");
    await expect(page.getByText("Tablero completado")).toBeVisible();
    await expect(page.getByTestId("score")).toHaveText("3970");
    await expect(page.getByTestId("snake-segment")).toHaveCount(400);
    await expect(page.getByTestId("food-cell")).toHaveCount(0);
    await page.clock.runFor(1500);
    await expect(page.getByTestId("score")).toHaveText("3970");
    await page.keyboard.press("KeyR");
    await expect(
      page.getByRole("dialog", { name: "Resultado pendiente" }),
    ).toBeVisible();
  });
});
