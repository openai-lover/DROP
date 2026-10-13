param(
    [Parameter(Mandatory = $true)][string]$ScenarioPath,
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [string]$VoiceName = 'Microsoft Zira Desktop',
    [ValidateRange(-10,10)][int]$Rate = 0
)
$ErrorActionPreference = 'Stop'
$dropVideoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$dropLocalRoot = [System.IO.Path]::GetFullPath((Join-Path $dropVideoRoot '.local'))
$dropOutput = [System.IO.Path]::GetFullPath((Join-Path $dropVideoRoot $OutputDirectory))
if (-not $dropOutput.StartsWith($dropLocalRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Narration output must be inside ignored .local/.'
}
$dropScenarioFile = [System.IO.Path]::GetFullPath((Join-Path $dropVideoRoot $ScenarioPath))
$dropScenario = Get-Content -LiteralPath $dropScenarioFile -Raw -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Path $dropOutput -Force | Out-Null
Add-Type -AssemblyName System.Speech
$dropSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $dropSynth.SelectVoice($VoiceName)
    $dropSynth.Rate = $Rate
    foreach ($dropShot in $dropScenario.shots) {
        if (-not $dropShot.narration) { continue }
        if ($dropShot.id -notmatch '^[a-z0-9-]+$') { throw 'Invalid shot ID.' }
        if ($dropShot.narration -match '\[(provided|insert|founder|team)[^\]]*\]') { throw 'Do not narrate an unfilled identity placeholder.' }
        $dropWave = Join-Path $dropOutput ($dropShot.id + '.wav')
        $dropSynth.SetOutputToWaveFile($dropWave)
        $dropSynth.Speak([string]$dropShot.narration)
        $dropSynth.SetOutputToNull()
        Write-Output ('Prepared neutral synthetic narration: ' + $dropShot.id)
    }
    [ordered]@{
        scenario = $dropScenario.id
        voice = $VoiceName
        rate = $Rate
        style = 'Neutral synthetic narrator; not the founder voice or a voice clone.'
        generatedAt = [DateTime]::UtcNow.ToString('o')
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $dropOutput 'voice.json') -Encoding UTF8
} finally {
    $dropSynth.Dispose()
}
