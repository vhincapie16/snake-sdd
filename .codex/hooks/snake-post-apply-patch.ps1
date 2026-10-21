$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..')).TrimEnd('\', '/')
try {
    $event = [Console]::In.ReadToEnd() | ConvertFrom-Json
    if ($event.hook_event_name -ne 'PostToolUse' -or $event.tool_name -ne 'apply_patch') { exit 0 }
    $cwd = [IO.Path]::GetFullPath([string]$event.cwd).TrimEnd('\', '/')
    if ($cwd -ine $target -and -not $cwd.StartsWith($target + '\', [StringComparison]::OrdinalIgnoreCase)) { exit 0 }
    $top = @(& git --no-optional-locks -C $cwd rev-parse --show-toplevel 2>$null)
    if ($LASTEXITCODE -ne 0 -or $top.Count -ne 1) { throw 'No se pudo verificar el repositorio.' }
    if ([IO.Path]::GetFullPath([string]$top[0]).TrimEnd('\', '/') -ine $target) { exit 0 }
    # No escribe índice, archivos ni historial; no imprime líneas del código.
    $null = & git --no-optional-locks -C $target diff --check 2>&1
    if ($LASTEXITCODE -ne 0) {
        @{ systemMessage = 'Snake SDD: git diff --check detectó problemas o no pudo completar la comprobación; revisa el diff local.' } | ConvertTo-Json -Compress
    }
} catch {
    if ($cwd -and ($cwd -ieq $target -or $cwd.StartsWith($target + '\', [StringComparison]::OrdinalIgnoreCase))) {
        @{ systemMessage = 'Snake SDD: no se pudo ejecutar git diff --check; revisa la comprobación local.' } | ConvertTo-Json -Compress
    }
}
exit 0
