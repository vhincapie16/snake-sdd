"use client";

import { useEffect, useRef } from "react";

interface RestartConfirmationProps {
  readonly open: boolean;
  readonly onSaveFirst: () => void;
  readonly onDiscard: () => void;
  readonly onCancel: () => void;
}

export function RestartConfirmation({
  open,
  onSaveFirst,
  onDiscard,
  onCancel,
}: RestartConfirmationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="restart-dialog"
      aria-labelledby="restart-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons =
          event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="restart-title">Resultado pendiente</h2>
      <p>
        Esta puntuación aún no se ha guardado. Elige qué hacer antes de
        reiniciar.
      </p>
      <div className="controls">
        <button type="button" onClick={onSaveFirst}>
          Guardar primero
        </button>
        <button type="button" onClick={onDiscard}>
          Descartar
        </button>
        <button type="button" onClick={onCancel} autoFocus>
          Cancelar
        </button>
      </div>
    </dialog>
  );
}
