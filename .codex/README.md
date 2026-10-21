# Automatizaciones de desarrollo

Las tres Skills de `.agents/skills/` complementan las reglas vigentes de Snake SDD.
Los scripts de `hooks/` calculan la raíz desde su ubicación; no necesitan rutas personales.

## Activación local opcional

Requiere Git y PowerShell. Desde este repositorio, incorpora los siguientes grupos
a un `.codex/hooks.json` local, conservando cualquier configuración existente.
Este ejemplo es documentación: no se crea ni se versiona ese archivo local.

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "^Bash$",
      "hooks": [{
        "type": "command",
        "command": "pwsh -NoLogo -NoProfile -NonInteractive -File \"$(git rev-parse --show-toplevel)/.codex/hooks/snake-pre-tool-use.ps1\"",
        "commandWindows": "powershell.exe -NoLogo -NoProfile -NonInteractive -Command \"& (Join-Path (& git rev-parse --show-toplevel) '.codex/hooks/snake-pre-tool-use.ps1')\"",
        "timeout": 10
      }]
    }],
    "PostToolUse": [{
      "matcher": "^apply_patch$",
      "hooks": [{
        "type": "command",
        "command": "pwsh -NoLogo -NoProfile -NonInteractive -File \"$(git rev-parse --show-toplevel)/.codex/hooks/snake-post-apply-patch.ps1\"",
        "commandWindows": "powershell.exe -NoLogo -NoProfile -NonInteractive -Command \"& (Join-Path (& git rev-parse --show-toplevel) '.codex/hooks/snake-post-apply-patch.ps1')\"",
        "timeout": 10
      }]
    }]
  }
}
```

Abre `/hooks` en Codex CLI para revisar las fuentes, los comandos y la confianza
antes de activarlos manualmente. No cambies sandbox, aprobaciones ni ExecutionPolicy.
Mantén el JSON local fuera de los commits. Los hooks personales se conservan;
Codex ejecuta todas las fuentes coincidentes y pueden aparecer avisos duplicados.

## Compatibilidad y límites

CLI inspeccionada: `codex-cli 0.163.0`, con `hooks` habilitado. El nombre canónico
de los comandos shell y `exec_command` es `Bash`; las ediciones se notifican como
`apply_patch`. Por eso los matchers son `^Bash$` y `^apply_patch$`, y los scripts
leen `tool_input.command`. No usar `^exec_command$` para los comandos shell.
Referencia: [hooks de Codex](https://learn.chatgpt.com/docs/hooks#tool-coverage).

La validación cubre estructura, sintaxis y entradas simuladas; no concede confianza
ni acredita una ejecución de eventos reales desde la interfaz. El control previo
bloquea conservadoramente operaciones destructivas o no verificables: el evento no
acredita autorización humana. No es un analizador completo de shells ni sustituye
las protecciones de Codex. El control posterior solo ejecuta `git diff --check`,
sin escribir en Git; guarda silencio al pasar y avisa ante problemas.
