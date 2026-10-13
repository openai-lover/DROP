<#
.SYNOPSIS
Stops only the Firebase emulator process tree started for this DROP checkout.
.DESCRIPTION
Validates PID, process start time and command before stopping the managed
local tree. Leaves logs, downloaded runtimes and test data files in .local/.
Does not stop unrelated Java, Node, Docker or cloud resources.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$dropRepository = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$dropStatePath = Join-Path $dropRepository '.local/firebase-emulator-process.json'
$dropCli = Join-Path $dropRepository 'node_modules/firebase-tools/lib/bin/firebase.js'
$dropConfig = Join-Path $dropRepository 'firebase.json'
if (-not (Test-Path -LiteralPath $dropStatePath -PathType Leaf)) { Write-Output 'No managed DROP emulator state exists.'; return }
$dropSaved = Get-Content -LiteralPath $dropStatePath -Raw | ConvertFrom-Json
if ($dropSaved.repository -ne $dropRepository -or $dropSaved.config -ne $dropConfig -or $dropSaved.projectId -notmatch '^demo-') { throw 'State does not identify this checkout and a demo project. No process stopped.' }
$dropParent = Get-Process -Id ([int]$dropSaved.processId) -ErrorAction SilentlyContinue
if (-not $dropParent -or $dropParent.StartTime.ToUniversalTime().Ticks -ne [long]$dropSaved.processStartTicks) { Write-Output 'The saved DROP emulator process is no longer running. No unrelated process stopped.'; return }
$dropCommand = Get-CimInstance Win32_Process -Filter "ProcessId = $($dropParent.Id)"
if (-not $dropCommand.CommandLine.Contains($dropCli) -or -not $dropCommand.CommandLine.Contains($dropConfig)) { throw 'PID command does not match this checkout emulator. No process stopped.' }

# Snapshot the actual live descendant tree, preserving each process identity.
$dropProcesses = @(Get-CimInstance Win32_Process)
$dropTree = [System.Collections.Generic.List[object]]::new()
$dropQueue = [System.Collections.Generic.Queue[int]]::new()
$dropQueue.Enqueue($dropParent.Id)
while ($dropQueue.Count -gt 0) {
    $dropCurrentId = $dropQueue.Dequeue()
    foreach ($dropChild in @($dropProcesses | Where-Object ParentProcessId -eq $dropCurrentId)) {
        $dropChildProcess = Get-Process -Id ([int]$dropChild.ProcessId) -ErrorAction SilentlyContinue
        if ($dropChildProcess) {
            $dropTree.Add([pscustomobject]@{ id = $dropChildProcess.Id; startTicks = $dropChildProcess.StartTime.ToUniversalTime().Ticks })
            $dropQueue.Enqueue($dropChildProcess.Id)
        }
    }
}
for ($dropIndex = $dropTree.Count - 1; $dropIndex -ge 0; $dropIndex--) {
    $dropLive = Get-Process -Id ([int]$dropTree[$dropIndex].id) -ErrorAction SilentlyContinue
    if ($dropLive -and $dropLive.StartTime.ToUniversalTime().Ticks -eq [long]$dropTree[$dropIndex].startTicks) { Stop-Process -Id $dropLive.Id -Force }
}
$dropParent.Refresh()
if (-not $dropParent.HasExited -and $dropParent.StartTime.ToUniversalTime().Ticks -eq [long]$dropSaved.processStartTicks) { Stop-Process -Id $dropParent.Id -Force }
Write-Output "Stopped managed local DROP emulator process $($dropSaved.processId). Runtime and logs remain under .local/."
