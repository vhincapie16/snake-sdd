import { expect, test } from "@playwright/test";

test.describe("KAN-5 / T057: interfaz con transporte HTTP simulado; persistencia real en tests/live", () => {
  test("bloquea envíos repetidos mientras guarda y conserva un conflicto sin reiniciar", async ({
    page,
  }) => {
    let finishSave: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      finishSave = resolve;
    });
    let requests = 0;
    await page.route("**/api/results", async (route) => {
      requests++;
      await pending;
      await route.fulfill({
        status: 409,
        json: {
          code: "RESULT_CONFLICT",
          retryable: false,
          message: "Conflicto",
        },
      });
    });
    await page.goto("/?fixture=pending-result");
    await page.getByLabel("Alias", { exact: true }).fill("Ana");
    await page
      .getByRole("button", { name: "Guardar resultado", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Guardando…" }),
    ).toBeDisabled();
    await expect(page.getByLabel("Alias", { exact: true })).toBeDisabled();
    await page.keyboard.press("Enter");
    await page
      .getByRole("button", { name: "Reiniciar (R)", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    finishSave!();
    await expect(
      page.getByRole("form", { name: "Guardar resultado" }).getByRole("alert"),
    ).toContainText("No se ha sobrescrito");
    await expect(page.getByTestId("final-score")).toHaveText("30");
    expect(requests).toBe(1);
  });
  test("corrige el alias, conserva cero y reintenta sin duplicar el envío", async ({
    page,
  }) => {
    const requests: Record<string, unknown>[] = [];
    await page.route("**/api/results", async (route) => {
      const result = route.request().postDataJSON();
      requests.push(result);
      if (requests.length === 1)
        await route.fulfill({
          status: 503,
          json: {
            code: "PERSISTENCE_UNAVAILABLE",
            retryable: true,
            message: "No disponible",
          },
        });
      else
        await route.fulfill({
          status: 201,
          json: { status: "created", result },
        });
    });
    await page.goto("/?fixture=zero-result");
    const form = page.getByRole("form", { name: "Guardar resultado" });
    await form.getByRole("button", { name: "Guardar resultado" }).click();
    await expect(form.getByRole("alert")).toContainText("alias");
    expect(requests).toHaveLength(0);
    const alias = page.getByLabel("Alias", { exact: true });
    await alias.pressSequentially("  Río Sur_1  ");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await form.getByRole("button", { name: "Guardar resultado" }).click();
    await expect(form.getByRole("alert")).toContainText("puedes reintentar");
    await expect(alias).toHaveValue("  Río Sur_1  ");
    await expect(page.getByTestId("final-score")).toHaveText("0");
    await form.getByRole("button", { name: "Guardar resultado" }).click();
    await expect(
      page.getByText("Resultado guardado para Río Sur_1.", { exact: true }),
    ).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual(requests[1]);
    expect(requests[0]).toMatchObject({ alias: "Río Sur_1", score: 0 });
    await page.keyboard.press("KeyR");
    await expect(page.getByRole("status")).toContainText("Preparada");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText("En curso");
  });

  test("Guardar primero falla sin reiniciar y el reintento exitoso prepara la nueva partida", async ({
    page,
  }) => {
    let count = 0;
    await page.route("**/api/results", async (route) => {
      count++;
      if (count === 1)
        await route.fulfill({
          status: 503,
          json: { code: "PERSISTENCE_UNAVAILABLE" },
        });
      else
        await route.fulfill({
          status: 200,
          json: {
            status: "alreadyRecorded",
            result: route.request().postDataJSON(),
          },
        });
    });
    await page.goto("/?fixture=pending-result");
    await page.getByLabel("Alias", { exact: true }).fill("Ana");
    for (let attempt = 0; attempt < 2; attempt++) {
      await page
        .getByRole("button", { name: "Reiniciar (R)", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Guardar primero" })
        .click();
      if (attempt === 0) {
        await expect(
          page
            .getByRole("form", { name: "Guardar resultado" })
            .getByRole("alert"),
        ).toContainText("El guardado no está disponible");
        await expect(page.getByTestId("final-score")).toHaveText("30");
        await expect(page.getByLabel("Alias", { exact: true })).toHaveValue(
          "Ana",
        );
      }
    }
    await expect(page.getByRole("status")).toContainText("Preparada");
    await expect(page.getByTestId("snake-head")).toHaveText("10,10");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("muestra carga, vacío y error recuperable del ranking; nunca lo muestra en curso o pausa", async ({
    page,
  }) => {
    let finishLoading: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      finishLoading = resolve;
    });
    let count = 0;
    await page.route("**/api/ranking", async (route) => {
      count++;
      if (count === 1) {
        await pending;
        await route.fulfill({ json: { entries: [] } });
      } else if (count === 2)
        await route.fulfill({
          status: 503,
          json: { code: "PERSISTENCE_UNAVAILABLE" },
        });
      else
        await route.fulfill({
          json: {
            entries: [
              {
                position: 1,
                gameId: "00500000-0000-4000-8000-000000000001",
                alias: "Ana",
                score: 0,
                achievedAt: "2026-10-21T00:00:00.000Z",
              },
            ],
          },
        });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Consultar ranking" }).click();
    await expect(page.getByText("Cargando clasificación…")).toBeVisible();
    finishLoading!();
    await expect(
      page.getByText("No hay resultados guardados todavía."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Actualizar ranking" }).click();
    await expect(
      page
        .getByRole("region", { name: "Clasificación Top 10" })
        .getByRole("alert"),
    ).toContainText("No se pudo consultar");
    await page.getByRole("button", { name: "Actualizar ranking" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Ana", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Clasificación Top 10" }),
    ).toHaveCount(0);
    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText("Pausada");
    await expect(page.getByRole("button", { name: /ranking/ })).toHaveCount(0);
  });

  test("la partida finalizada pierde el pendiente al recargar; no hay guardado automático", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/results"))
        requests.push(request.method());
    });
    await page.clock.install({ time: new Date("2026-10-21T11:00:00.000Z") });
    await page.goto("/");
    await page.clock.pauseAt(new Date("2026-10-21T12:00:00.000Z"));
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowUp");
    await page.clock.runFor(1650);
    await expect(
      page.getByRole("heading", { name: "Partida terminada" }),
    ).toBeVisible();
    await page.getByLabel("Alias", { exact: true }).fill("Temporal");
    await expect(page.getByTestId("final-score")).toHaveText("0");
    await page.reload();
    await expect(page.getByRole("status")).toContainText("Preparada");
    await expect(page.getByLabel("Alias", { exact: true })).toHaveCount(0);
    expect(requests).toEqual([]);
  });
});
