import { expect, test } from "@playwright/test";

test.describe("HU-001 / RF-001 a RF-005 y RF-030", () => {
  test("inicia, pausa, reanuda y reinicia con estados visibles", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("status")).toContainText("Preparada", {
      timeout: 1_000,
    });
    await expect(page.getByTestId("score")).toHaveText("0");

    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText("En curso", {
      timeout: 1_000,
    });

    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText("Pausada", {
      timeout: 1_000,
    });

    await page.waitForTimeout(500);
    await expect(page.getByTestId("score")).toHaveText("0");

    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText("En curso", {
      timeout: 1_000,
    });

    await page.keyboard.press("KeyR");
    await expect(page.getByRole("status")).toContainText("Preparada", {
      timeout: 1_000,
    });
    await expect(page.getByTestId("score")).toHaveText("0");
  });

  test("ignora una acción incompatible", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText("Preparada");
  });

  test("permite cancelar o descartar un resultado pendiente", async ({
    page,
  }) => {
    await page.goto("/?fixture=pending-result");
    await page.keyboard.press("KeyR");
    const dialog = page.getByRole("dialog", { name: "Resultado pendiente" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button")).toHaveCount(3);

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status")).toContainText("Finalizada");

    await page.keyboard.press("KeyR");
    await dialog.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByRole("status")).toContainText("Preparada");
  });

  test("conserva el pendiente si el guardado no está disponible", async ({
    page,
  }) => {
    // HU-005 sustituye el guardado ausente por un error de transporte explícito.
    await page.route("**/api/results", (route) =>
      route.fulfill({
        status: 503,
        json: {
          code: "PERSISTENCE_UNAVAILABLE",
          retryable: true,
          message: "No disponible",
        },
      }),
    );
    await page.goto("/?fixture=pending-result");
    await page.getByLabel("Alias", { exact: true }).fill("Ana");
    await page.getByLabel("Alias", { exact: true }).press("Tab");
    await page.keyboard.press("KeyR");
    await page
      .getByRole("dialog", { name: "Resultado pendiente" })
      .getByRole("button", { name: "Guardar primero" })
      .click();

    await expect(
      page.getByRole("alert").filter({ hasText: "El guardado" }),
    ).toContainText("no está disponible");
    await expect(page.getByRole("status")).toContainText("Finalizada");
  });

  test("reinicia directamente cuando el resultado ya está guardado", async ({
    page,
  }) => {
    await page.goto("/?fixture=saved-result");
    await page.keyboard.press("KeyR");
    await expect(page.getByRole("status")).toContainText("Preparada");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test("HU-001 / RF-030: el diálogo retiene el foco y Escape conserva el pendiente", async ({
  page,
}) => {
  await page.goto("/?fixture=pending-result");
  await page.getByRole("button", { name: "Reiniciar (R)" }).click();
  const dialog = page.getByRole("dialog", { name: "Resultado pendiente" });
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Guardar primero" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("score")).toHaveText("30");
  await expect(
    page.getByRole("button", { name: "Reiniciar (R)" }),
  ).toBeFocused();
});
