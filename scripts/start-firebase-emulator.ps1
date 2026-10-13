<#
.SYNOPSIS
Starts DROP's local Firestore emulator in a hidden process without cloud login.
.DESCRIPTION
Uses the repository firebase.json and a demo-* project. Requires Node.js,
the pinned repository firebase-tools package, and Java 21+. Local runtime,
logs and process evidence are written under ignored .local/. No cloud
resources, Firebase Authentication, PostgreSQL or global services are started.
.EXAMPLE
./scripts/start-firebase-emulator.ps1 -NodePath 'C:/tools/node/node.exe' -JavaHome 'C:/tools/jdk-21'
#>
[CmdletBinding()]
param(
    [string]$NodePath,
    [string]$JavaHome,
    [ValidatePattern('^demo-[a-z0-9-]+$')]
    [string]$ProjectId = 'demo-drop',
    [ValidateRange(5, 120)]
    [int]$WaitSeconds = 60
)

$ErrorActionPreference = 'Stop'
$dropRepository = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$dropLocal = Join-Path $dropRepository '.local'
$dropConfig = Join-Path $dropRepository 'firebase.json'
$dropCli = Join-Path $dropRepository 'node_modules/firebase-tools/lib/bin/firebase.js'
$dropStatePath = Join-Path $dropLocal 'firebase-emulator-process.json'
$dropEnvPath = Join-Path $dropLocal 'firestore-test.env'

if (-not (Test-Path -LiteralPath $dropConfig -PathType Leaf)) { throw 'firebase.json is missing. Use the reviewed repository Firebase configuration.' }
if (-not (Test-Path -LiteralPath $dropCli -PathType Leaf)) { throw 'The pinned firebase-tools dependency is missing. Install repository dependencies first.' }
$dropConfiguration = Get-Content -LiteralPath $dropConfig -Raw | ConvertFrom-Json
if ($dropConfiguration.emulators.firestore.host -ne '127.0.0.1' -or $dropConfiguration.emulators.firestore.port -ne 8089) {
    throw 'DROP local Firestore must bind only 127.0.0.1:8089 in firebase.json.'
}
if ($dropConfiguration.emulators.hub.host -ne '127.0.0.1' -or $dropConfiguration.emulators.hub.port -ne 4409) {
    throw 'DROP local Emulator Hub must bind only 127.0.0.1:4409 in firebase.json.'
}
if ($dropConfiguration.emulators.logging.host -ne '127.0.0.1' -or $dropConfiguration.emulators.logging.port -ne 4509) {
    throw 'DROP local emulator logging must bind only 127.0.0.1:4509 in firebase.json.'
}
if ($dropConfiguration.emulators.ui.enabled -ne $false) { throw 'The local emulator UI must be disabled in firebase.json.' }

if (-not $NodePath) {
    $dropNodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($dropNodeCommand) { $NodePath = $dropNodeCommand.Source }
}
if (-not $NodePath -or -not (Test-Path -LiteralPath $NodePath -PathType Leaf)) { throw 'Node.js was not found. Provide -NodePath or add Node.js to PATH.' }
$NodePath = (Resolve-Path -LiteralPath $NodePath).Path

if (-not $JavaHome -and $env:JAVA_HOME) { $JavaHome = $env:JAVA_HOME }
if (-not $JavaHome) {
    $dropPortableJava = Join-Path $dropLocal 'java'
    if (Test-Path -LiteralPath $dropPortableJava -PathType Container) {
        $dropJavaCandidates = @(Get-ChildItem -LiteralPath $dropPortableJava -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin/java.exe') })
        if ($dropJavaCandidates.Count -gt 0) { $JavaHome = $dropJavaCandidates[0].FullName }
    }
}
if (-not $JavaHome) {
    $dropJavaCommand = Get-Command java -ErrorAction SilentlyContinue
    if ($dropJavaCommand) { $JavaHome = Split-Path (Split-Path $dropJavaCommand.Source -Parent) -Parent }
}
if (-not $JavaHome -or -not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin/java.exe') -PathType Leaf)) { throw 'Java 21+ was not found. Provide -JavaHome or use a verified portable JDK under .local/java/.' }
$JavaHome = (Resolve-Path -LiteralPath $JavaHome).Path
$dropJavaExecutable = Join-Path $JavaHome 'bin/java.exe'
$dropJavaVersion = (& $dropJavaExecutable -version 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0 -or $dropJavaVersion -notmatch 'version "(?<major>\d+)') { throw 'Java could not report its version.' }
if ([int]$Matches.major -lt 21) { throw 'Firebase CLI v15+ requires Java 21 or newer.' }

New-Item -ItemType Directory -Path $dropLocal -Force | Out-Null
$dropLogs = Join-Path $dropLocal 'firebase-logs'
$dropCache = Join-Path $dropLocal 'firebase-emulator-cache'
New-Item -ItemType Directory -Path $dropLogs, $dropCache -Force | Out-Null
$dropFirestoreHost = '127.0.0.1:8089'
$dropHubUrl = 'http://127.0.0.1:4409/emulators'

function Test-DropEmulatorReady {
    try {
        $dropHub = Invoke-RestMethod -Uri $dropHubUrl -TimeoutSec 2
        if ($dropHub.firestore.host -ne '127.0.0.1' -or $dropHub.firestore.port -ne 8089) { return $false }
        $dropProbe = [System.Net.Sockets.TcpClient]::new()
        try { $dropProbe.Connect('127.0.0.1', 8089); return $dropProbe.Connected } finally { $dropProbe.Dispose() }
    } catch { return $false }
}

function Get-DropManagedProcess {
    if (-not (Test-Path -LiteralPath $dropStatePath -PathType Leaf)) { return $null }
    $dropSaved = Get-Content -LiteralPath $dropStatePath -Raw | ConvertFrom-Json
    if ($dropSaved.repository -ne $dropRepository -or $dropSaved.projectId -ne $ProjectId -or $dropSaved.config -ne $dropConfig) { throw 'Existing emulator state belongs to a different invocation; inspect it before starting.' }
    $dropExisting = Get-Process -Id ([int]$dropSaved.processId) -ErrorAction SilentlyContinue
    if ($dropExisting -and $dropExisting.StartTime.ToUniversalTime().Ticks -eq [long]$dropSaved.processStartTicks) {
        $dropExistingCommand = Get-CimInstance Win32_Process -Filter "ProcessId = $($dropExisting.Id)"
        if (-not $dropExistingCommand.CommandLine.Contains($dropCli) -or -not $dropExistingCommand.CommandLine.Contains($dropConfig)) { throw 'Saved PID does not match the DROP emulator command.' }
        return $dropExisting
    }
    return $null
}

$dropProcess = Get-DropManagedProcess
$dropOriginalJavaHome = $env:JAVA_HOME
$dropOriginalPath = $env:PATH
$dropOriginalCache = $env:FIREBASE_EMULATORS_PATH
$dropOriginalDebugPath = $env:FIREBASE_DEBUG_PATH
try {
    if (-not $dropProcess) {
        foreach ($dropPort in @(8089, 4409, 4509)) {
            if (Get-NetTCPConnection -LocalPort $dropPort -State Listen -ErrorAction SilentlyContinue) { throw "Port $dropPort is already occupied by an unmanaged process. No additional emulator was started." }
        }
        $env:JAVA_HOME = $JavaHome
        $env:PATH = "$(Join-Path $JavaHome 'bin');$(Split-Path $NodePath -Parent);$dropOriginalPath"
        $env:FIREBASE_EMULATORS_PATH = $dropCache
        $env:FIREBASE_DEBUG_PATH = Join-Path $dropLogs 'firebase-debug.log'
        $dropArguments = @(('"' + $dropCli + '"'), 'emulators:start', '--only', 'firestore', '--project', $ProjectId, '--config', ('"' + $dropConfig + '"'), '--non-interactive')
        $dropProcess = Start-Process -FilePath $NodePath -ArgumentList $dropArguments -WorkingDirectory $dropRepository -WindowStyle Hidden -RedirectStandardOutput (Join-Path $dropLogs 'stdout.log') -RedirectStandardError (Join-Path $dropLogs 'stderr.log') -PassThru
        $dropProcess.Refresh()
        [ordered]@{
            repository = $dropRepository
            projectId = $ProjectId
            config = $dropConfig
            processId = $dropProcess.Id
            processStartTicks = $dropProcess.StartTime.ToUniversalTime().Ticks
            nodePath = $NodePath
            javaHome = $JavaHome
            firestoreHost = $dropFirestoreHost
            hubUrl = $dropHubUrl
        } | ConvertTo-Json | Set-Content -LiteralPath $dropStatePath -Encoding utf8
    }
} finally {
    $env:JAVA_HOME = $dropOriginalJavaHome
    $env:PATH = $dropOriginalPath
    $env:FIREBASE_EMULATORS_PATH = $dropOriginalCache
    $env:FIREBASE_DEBUG_PATH = $dropOriginalDebugPath
}

@(
    "FIREBASE_PROJECT_ID=$ProjectId"
    "GCLOUD_PROJECT=$ProjectId"
    "FIRESTORE_EMULATOR_HOST=$dropFirestoreHost"
) | Set-Content -LiteralPath $dropEnvPath -Encoding utf8

$dropDeadline = [DateTime]::UtcNow.AddSeconds($WaitSeconds)
do {
    $dropProcess.Refresh()
    if ($dropProcess.HasExited) { throw "Firestore emulator process exited with code $($dropProcess.ExitCode). Inspect .local/firebase-logs/; no readiness was claimed." }
    if (Test-DropEmulatorReady) {
        [pscustomobject]@{ ready = $true; processId = $dropProcess.Id; projectId = $ProjectId; firestoreHost = $dropFirestoreHost; envFile = $dropEnvPath; logs = $dropLogs }
        return
    }
    Start-Sleep -Milliseconds 400
} while ([DateTime]::UtcNow -lt $dropDeadline)

throw "Readiness observation timed out; process $($dropProcess.Id) may still be live. Recheck this same process or rerun this script to observe it; do not start a second emulator. Logs: $dropLogs"
