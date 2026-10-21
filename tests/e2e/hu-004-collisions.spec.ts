import { expect, test } from "@playwright/test";

test.describe("HU-004 / RF-016 a RF-020: colisiones y resultado", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-21T11:00:00.000Z") });
  });

  for (const [fixture, cause, head] of [
    ["wall-collision", "Colisión con pared", "19,10"],
    ["self-collision", "Colisión con el cuerpo", "2,2"],
  ]) {
    test(`finaliza por ${fixture}, congela y reinicia sin arrancar automáticamente`, async ({
      page,
    }) => {
      await page.goto(`/?fixture=${fixture}`);
      await page.clock.pauseAt(new Date("2026-10-21T12:00:00.000Z"));
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status")).toContainText("En curso");
      if (fixture === "self-collision") await page.keyboard.press("ArrowRight");
      await page.clock.runFor(149);
      await expect(
        page.getByRole("heading", { name: "Partida terminada" }),
      ).toHaveCount(0);
      await page.clock.runFor(1);
      await expect(
        page.getByRole("heading", { name: "Partida terminada" }),
      ).toBeVisible();
      await expect(page.getByTestId("finish-reason")).toHaveText(cause!);
      await expect(page.getByTestId("final-score")).toHaveText("30");
      await expect(page.getByTestId("snake-head")).toHaveText(head!);
      const direction = await page
        .getByTestId("accepted-direction")
        .textContent();
      for (const key of [
        "ArrowUp",
        "ArrowLeft",
        "ArrowDown",
        "ArrowRight",
        "Enter",
        "Space",
      ])
        await page.keyboard.press(key);
      await page.clock.runFor(10_000);
      await expect(page.getByTestId("snake-head")).toHaveText(head!);
      await expect(page.getByTestId("accepted-direction")).toHaveText(
        direction!,
      );
      await expect(page.getByTestId("score")).toHaveText("30");
      await expect(page.getByTestId("final-score")).toHaveText("30");
      await expect(
        page.getByRole("button", { name: "Consultar ranking" }),
      ).toBeDisabled();

      if (fixture === "wall-collision") await page.keyboard.press("KeyR");
      else
        await page
          .getByRole("button", { name: "Reiniciar (R)", exact: true })
          .click();
      const dialog = page.getByRole("dialog", { name: "Resultado pendiente" });
      await dialog
        .getByRole("button", { name: "Cancelar", exact: true })
        .click();
      await expect(page.getByTestId("final-score")).toHaveText("30");
      await page.keyboard.press("KeyR");
      await dialog
        .getByRole("button", { name: "Descartar", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("Preparada");
      await expect(
        page.getByRole("heading", { name: "Partida terminada" }),
      ).toHaveCount(0);
      await page.clock.runFor(450);
      await expect(page.getByTestId("snake-head")).toHaveText("10,10");
      await expect(page.getByTestId("score")).toHaveText("0");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status")).toContainText("En curso");
      await page.clock.runFor(150);
      await expect(page.getByTestId("snake-head")).toHaveText("11,10");
    });
  }

  test("permite entrar en la cola que se libera sin modificar longitud ni puntuación", async ({
    page,
  }) => {
    await page.goto("/?fixture=tail-release");
    await page.clock.pauseAt(new Date("2026-10-21T12:00:00.000Z"));
    await page.keyboard.press("Enter");
    await page.clock.runFor(150);
    await expect(page.getByRole("status")).toContainText("En curso");
    await expect(page.getByTestId("snake-head")).toHaveText("0,1");
    await expect(page.getByTestId("snake-segment")).toHaveCount(4);
    await expect(page.getByTestId("score")).toHaveText("30");
    await expect(
      page.getByRole("heading", { name: "Partida terminada" }),
    ).toHaveCount(0);
  });
});
