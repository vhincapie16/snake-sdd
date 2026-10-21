"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeResult, type RankingEntry } from "@/domain/results/result";

type RankingState =
  | { status: "closed" | "loading" | "error" }
  | { status: "ready"; entries: readonly RankingEntry[] };

export function Ranking() {
  const [state, setState] = useState<RankingState>({ status: "closed" });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function load() {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/ranking", {
        cache: "no-store",
        signal: request.signal,
      });
      const body = await response.json();
      if (
        !response.ok ||
        !Array.isArray(body.entries) ||
        body.entries.length > 10
      )
        throw new Error("RANKING_UNAVAILABLE");
      const entries = body.entries.map((entry: RankingEntry, index: number) => {
        if (entry.position !== index + 1) throw new Error("INVALID_POSITION");
        return { ...normalizeResult(entry), position: entry.position };
      });
      if (!request.signal.aborted) setState({ status: "ready", entries });
    } catch {
      if (!request.signal.aborted) setState({ status: "error" });
    }
  }

  return (
    <section className="ranking" aria-labelledby="ranking-title">
      <h2 id="ranking-title">Clasificación Top 10</h2>
      <button
        type="button"
        onClick={() => void load()}
        disabled={state.status === "loading"}
      >
        {state.status === "closed" ? "Consultar ranking" : "Actualizar ranking"}
      </button>
      {state.status === "loading" ? (
        <p role="status">Cargando clasificación…</p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert">
          No se pudo consultar la clasificación. Inténtalo de nuevo.
        </p>
      ) : null}
      {state.status === "ready" && state.entries.length === 0 ? (
        <p>No hay resultados guardados todavía.</p>
      ) : null}
      {state.status === "ready" && state.entries.length > 0 ? (
        <div className="ranking-scroll">
          <table>
            <caption>
              Hasta diez resultados, por puntuación descendente; en empate,
              fecha y partida ascendentes.
            </caption>
            <thead>
              <tr>
                <th scope="col">Posición</th>
                <th scope="col">Alias</th>
                <th scope="col">Puntos</th>
                <th scope="col">Fecha (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {state.entries.map((entry) => (
                <tr key={entry.gameId}>
                  <td>{entry.position}</td>
                  <td>{entry.alias}</td>
                  <td>{entry.score}</td>
                  <td>
                    <time dateTime={entry.achievedAt}>
                      {entry.achievedAt
                        .replace("T", " ")
                        .replace(/\.\d+Z$/, " UTC")}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
