param(
  [ValidateSet('1080', '1080p', '4k', '4K', 'both')]
  [string]$Target = '1080',
  [int]$Concurrency = 4
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$TmpRender = Join-Path $Root 'work\tmp'
New-Item -ItemType Directory -Force -Path $TmpRender | Out-Null
$env:TEMP = $TmpRender
$env:TMP = $TmpRender
$env:TMPDIR = $TmpRender

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js 20+ is required'
}
if (-not (Test-Path 'studio/node_modules')) {
  Push-Location studio
  npm ci
  Pop-Location
}

node work/tools/prepare.mjs
New-Item -ItemType Directory -Force -Path 'mv' | Out-Null

function Invoke-Render([string]$Out, [switch]$Is4K) {
  Push-Location studio
  $argsList = @('remotion', 'render', 'src/index.ts', 'MV', $Out, '--codec=h264', '--x264-preset=slow', '--pixel-format=yuv420p', '--color-space=bt709', '--image-format=png', '--audio-codec=aac', '--audio-bitrate=320k', "--concurrency=$Concurrency", '--timeout=180000', '--log=info')
  if ($Is4K) {
    $argsList += @('--scale=2', '--crf=16')
  } else {
    $argsList += @('--crf=14')
  }
  npx @argsList
  Pop-Location
}

switch ($Target) {
  { $_ -in '1080', '1080p' } { Invoke-Render '../mv/world.execute(me)_gemini_edition_1080p60.mp4' }
  { $_ -in '4k', '4K' }     { Invoke-Render '../mv/world.execute(me)_gemini_edition_4K60.mp4' -Is4K }
  'both' {
    Invoke-Render '../mv/world.execute(me)_gemini_edition_1080p60.mp4'
    Invoke-Render '../mv/world.execute(me)_gemini_edition_4K60.mp4' -Is4K
  }
}
Get-ChildItem mv/*.mp4 | Format-Table Name, Length
