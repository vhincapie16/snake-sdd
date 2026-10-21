# PreToolUse no aporta prueba fiable de aprobación humana: denegar por defecto
# las operaciones destructivas; nunca confiar en permission_mode ni en el comando.
# Es una barrera ligera para llamadas shell, no un analizador de todos los lenguajes.
$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..')).TrimEnd('\', '/')
function Deny-SnakeCommand([string]$reason) {
    @{ hookSpecificOutput = @{
        hookEventName = 'PreToolUse'; permissionDecision = 'deny'
        permissionDecisionReason = $reason
    }} | ConvertTo-Json -Depth 4 -Compress
    exit 0
}
function Full-Path([string]$path, [string]$base) {
    if (-not [IO.Path]::IsPathRooted($path)) { $path = Join-Path $base $path }
    return [IO.Path]::GetFullPath($path).TrimEnd('\', '/')
}
function Is-SnakeRepo([string]$path) {
    if ($path -ine $target -and -not $path.StartsWith($target + '\', [StringComparison]::OrdinalIgnoreCase)) { return $false }
    $top = @(& git --no-optional-locks -C $path rev-parse --show-toplevel 2>$null)
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo verificar el repositorio.' }
    return ($top.Count -eq 1 -and (Full-Path ([string]$top[0]) $path) -ieq $target)
}
function Check-Commands([string]$text, [string]$base, [int]$depth = 0) {
    if ($depth -gt 3) {
        if (Is-SnakeRepo $base) { Deny-SnakeCommand 'Snake SDD: comando anidado no verificable; revisar manualmente en /hooks.' }
        return
    }
    $tokens = $null; $parseErrors = $null
    $ast = [Management.Automation.Language.Parser]::ParseInput($text, [ref]$tokens, [ref]$parseErrors)
    $commands = $ast.FindAll({ param($node) $node -is [Management.Automation.Language.CommandAst] }, $true)
    foreach ($node in $commands) {
        $name = $node.GetCommandName()
        $parts = @($node.CommandElements | Select-Object -Skip 1 | ForEach-Object {
            if ($_ -is [Management.Automation.Language.StringConstantExpressionAst]) { $_.Value } else { $_.Extent.Text }
        })
        if (-not $name) {
            if ((Is-SnakeRepo $base) -and $node.Extent.Text -match '(?i)git|reset|clean|push|restore|checkout|rebase') {
                Deny-SnakeCommand 'Snake SDD: invocación dinámica de Git no verificable; revisar manualmente en /hooks.'
            }
            continue
        }
        $name = [IO.Path]::GetFileNameWithoutExtension($name)
        if ($name -in @('cd', 'chdir', 'Set-Location') -and $parts.Count -eq 1) {
            $base = Full-Path $parts[0] $base
            continue
        }
        if ($name -in @('cmd', 'pwsh', 'powershell', 'bash', 'sh')) {
            for ($i = 0; $i -lt $parts.Count; $i++) {
                if ($parts[$i] -in @('/c', '/k', '-c', '-lc', '-Command')) {
                    Check-Commands ($parts[($i + 1)..($parts.Count - 1)] -join ' ') $base ($depth + 1)
                    break
                }
            }
        }
        if ($name -ine 'git') { continue }
        $repo = $base; $i = 0; $opaque = $false
        while ($i -lt $parts.Count -and $parts[$i].StartsWith('-')) {
            $option = $parts[$i]
            if ($option -ceq '-C' -and $i + 1 -lt $parts.Count) { $i++; $repo = Full-Path $parts[$i] $repo }
            elseif ($option -eq '-c' -and $i + 1 -lt $parts.Count) { $i++; if ($parts[$i] -match '^(?i)alias\.') { $opaque = $true } }
            elseif ($option -match '^--(git-dir|work-tree)(?:=(.*))?$') {
                $kind = $Matches[1]; $location = $Matches[2]
                if (-not $location -and $i + 1 -lt $parts.Count) { $i++; $location = $parts[$i] }
                $location = Full-Path $location $base
                if ($kind -eq 'git-dir') { $repo = Split-Path -Parent $location } else { $repo = $location }
                $opaque = $true
            }
            elseif ($option -match '^--(?:no-pager|paginate|no-optional-locks|literal-pathspecs|no-lazy-fetch)$') { }
            elseif ($option -in @('--version', '--help')) { break }
            else { $opaque = $true }
            $i++
        }
        if (-not (Is-SnakeRepo $repo)) { continue }
        if ($opaque) { Deny-SnakeCommand 'Snake SDD: opciones globales de Git no verificables; revisar manualmente en /hooks.' }
        if ($i -ge $parts.Count) { continue }
        $verb = $parts[$i]; $argsText = ($parts | Select-Object -Skip ($i + 1)) -join ' '
        if ($argsText -match '(^|\s)--help(\s|$)' -or $verb -in @('--version', '--help', 'help')) { continue }
        $danger = switch ($verb) {
            { $_ -in @('reset', 'rebase', 'restore', 'rm', 'filter-branch', 'filter-repo', 'update-ref') } { $true; break }
            'clean' { $argsText -notmatch '(^|\s)(--dry-run|-[A-Za-z]*n[A-Za-z]*)(\s|$)'; break }
            'push' { $argsText -match '(^|\s)(--force\S*|--delete|--mirror|-[A-Za-z]*[fd][A-Za-z]*|\+\S+|:\S+)(\s|$)'; break }
            'branch' { $argsText -cmatch '(^|\s)(--delete|--force|-[A-Za-z]*[dDfFM][A-Za-z]*)(\s|$)'; break }
            'tag' { $argsText -match '(^|\s)(--delete|--force|-[A-Za-z]*[df][A-Za-z]*)(\s|$)'; break }
            'checkout' {
                if ($argsText -cmatch '(^|\s)(--|--force|--ours|--theirs|-[A-Za-z]*[fB][A-Za-z]*|\.\.?/?)(\s|$)') { $true }
                elseif ($argsText -match '^-b\s+\S+(?:\s+\S+)?$') { $false }
                elseif (-not $argsText) { $false }
                else {
                    $null = & git --no-optional-locks -C $repo rev-parse --verify --quiet --end-of-options "${argsText}^{commit}" 2>$null
                    $LASTEXITCODE -ne 0
                }
                break
            }
            'switch' { $argsText -cmatch '(^|\s)(--discard-changes|--force-create|-[A-Za-z]*[fC][A-Za-z]*)(\s|$)'; break }
            'stash' { $argsText -match '(^|\s)(clear|drop|pop)(\s|$)'; break }
            'worktree' { $argsText -match '(^|\s)(remove|prune)(\s|$)'; break }
            'reflog' { $argsText -match '(^|\s)(expire|delete|drop)(\s|$)'; break }
            'gc' { $argsText -match '(^|\s)--prune(?:=|\s|$)'; break }
            'remote' { $argsText -match '(^|\s)(remove|rm)(\s|$)'; break }
            'pull' { $argsText -match '(^|\s)(--rebase(?:=\S+)?|-r)(\s|$)'; break }
            { $_ -in @('status','diff','log','show','add','commit','fetch','merge','config','rev-parse','rev-list','ls-files','ls-remote','show-ref','describe','blame','shortlog','cat-file','check-ignore','check-attr','for-each-ref','version') } { $false; break }
            default { $true }
        }
        if ($danger) { Deny-SnakeCommand 'Snake SDD: operación Git destructiva o no verificable bloqueada; requiere autorización humana específica y revisión manual en /hooks.' }
    }
}
try {
    $event = [Console]::In.ReadToEnd() | ConvertFrom-Json
    if ($event.hook_event_name -ne 'PreToolUse' -or $event.tool_name -ne 'Bash') { exit 0 }
    $base = [string]$event.cwd
    if ($event.tool_input.workdir) { $base = Full-Path $event.tool_input.workdir $base }
    Check-Commands ([string]$event.tool_input.command) (Full-Path $base (Get-Location).Path)
} catch {
    if ($base -and ($base -ieq $target -or $base.StartsWith($target + '\', [StringComparison]::OrdinalIgnoreCase))) {
        Deny-SnakeCommand 'Snake SDD: el hook no pudo comprobar el comando; revisar manualmente en /hooks.'
    }
}
exit 0
