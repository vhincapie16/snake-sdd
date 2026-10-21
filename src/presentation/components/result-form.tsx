"use client";

import type { ResultState } from "@/domain/game/model";

interface ResultFormProps {
  readonly resultState: ResultState;
  readonly onAliasChange: (alias: string) => void;
  readonly onSave: () => void;
}

export function ResultForm({
  resultState,
  onAliasChange,
  onSave,
}: ResultFormProps) {
  if (resultState.status === "none") return null;
  if (resultState.status === "saved")
    return (
      <p role="status">Resultado guardado para {resultState.result.alias}.</p>
    );
  const saving = resultState.status === "saving";
  const error =
    resultState.status === "saveError" ? resultState.errorCode : null;
  const message =
    error === "VALIDATION_ERROR"
      ? "El alias debe tener entre 1 y 20 letras, números, espacios, guiones o guiones bajos. Puedes corregirlo."
      : error === "RESULT_CONFLICT"
        ? "Esta partida ya tiene un resultado diferente. No se ha sobrescrito."
        : error
          ? "El guardado no está disponible. El resultado se conserva; puedes reintentar."
          : null;
  return (
    <form
      className="notice result-form"
      aria-label="Guardar resultado"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      aria-busy={saving}
    >
      <label htmlFor="result-alias">Alias</label>
      <input
        id="result-alias"
        name="alias"
        type="text"
        autoComplete="off"
        value={resultState.result.aliasInput}
        disabled={saving}
        aria-describedby={message ? "alias-help result-error" : "alias-help"}
        aria-invalid={error === "VALIDATION_ERROR"}
        onChange={(event) => onAliasChange(event.target.value)}
      />
      <p id="alias-help">
        De 1 a 20 letras, números, espacios, guiones o guiones bajos. El
        resultado pendiente se pierde al recargar o cerrar.
      </p>
      {message ? (
        <p id="result-error" role="alert">
          {message}
        </p>
      ) : null}
      <button type="submit" disabled={saving}>
        {saving ? "Guardando…" : "Guardar resultado"}
      </button>
    </form>
  );
}
