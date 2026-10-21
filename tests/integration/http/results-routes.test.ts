import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import * as results from "@/app/api/results/route";
import * as ranking from "@/app/api/ranking/route";

describe("KAN-5 / T065–T066: métodos explícitos de los Route Handlers", () => {
  it("results rechaza todos los métodos ajenos a POST", async () => {
    for (const method of [
      results.GET,
      results.PUT,
      results.PATCH,
      results.DELETE,
      results.HEAD,
      results.OPTIONS,
    ]) {
      const response = method();
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
      expect(await response.json()).toMatchObject({
        code: "METHOD_NOT_ALLOWED",
        retryable: false,
      });
    }
  });
  it("ranking rechaza todos los métodos ajenos a GET", async () => {
    for (const method of [
      ranking.POST,
      ranking.PUT,
      ranking.PATCH,
      ranking.DELETE,
      ranking.HEAD,
      ranking.OPTIONS,
    ]) {
      const response = method();
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET");
    }
  });
});
