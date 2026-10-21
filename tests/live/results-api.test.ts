import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { createServer } from "node:net";
import { afterAll, beforeAll, expect, test } from "vitest";

const base = "http://127.0.0.1:3010";
let server: ChildProcess | undefined;

beforeAll(async () => {
  if (process.env.SNAKE_ALLOW_CONTROLLED_WRITES !== "1")
    throw new Error("Falta autorización para pruebas reales de escritura.");
  await new Promise<void>((resolvePort, rejectPort) => {
    const probe = createServer();
    probe.once("error", () =>
      rejectPort(
        new Error("El puerto 3010 está ocupado; no se reutiliza ese servidor."),
      ),
    );
    probe.listen(3010, "127.0.0.1", () => probe.close(() => resolvePort()));
  });
  // Proceso propio del build; sin reutilizar servidores ni publicar secretos.
  server = spawn(
    process.execPath,
    [
      resolve("node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3010",
    ],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error(
        "El servidor aislado no pudo iniciarse; revisar puerto 3010 y build.",
      );
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      /* Aún no está listo. */
    }
    await new Promise((resolveReady) => setTimeout(resolveReady, 100));
  }
  throw new Error("El servidor aislado no estuvo listo a tiempo.");
}, 25_000);

afterAll(() => {
  server?.kill();
});

test("KAN-5 / T054–T056: Route Handlers y Supabase reales; reintentos no agregan filas", async () => {
  // Reutiliza uno de los once UUID controlados; nunca carga la semilla.
  const input = {
    gameId: "00500000-0000-4000-8000-000000000011",
    alias: "KAN5_Prueba",
    score: 0,
    achievedAt: "2026-10-21T00:00:09.000Z",
  };
  const post = (body: unknown) =>
    fetch(`${base}/api/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const first = await post(input);
  expect([200, 201]).toContain(first.status);
  expect(await first.json()).toEqual({
    status: first.status === 201 ? "created" : "alreadyRecorded",
    result: input,
  });
  const retry = await post(input);
  expect(retry.status).toBe(200);
  expect(await retry.json()).toEqual({
    status: "alreadyRecorded",
    result: input,
  });
  expect((await post({ ...input, alias: "No_sobrescribir" })).status).toBe(409);
  expect((await post({ ...input, alias: "" })).status).toBe(422);
  expect((await post({ ...input, alias: "x".repeat(4097) })).status).toBe(413);
  expect((await fetch(`${base}/api/results`)).status).toBe(405);
  expect((await fetch(`${base}/api/ranking`, { method: "POST" })).status).toBe(
    405,
  );
  const response = await fetch(`${base}/api/ranking`);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const { entries } = await response.json();
  expect(entries).toHaveLength(10);
  expect(entries.map((entry: { position: number }) => entry.position)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ]);
  for (const entry of entries)
    expect(Object.keys(entry).sort()).toEqual([
      "achievedAt",
      "alias",
      "gameId",
      "position",
      "score",
    ]);
}, 30_000);
