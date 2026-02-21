$ErrorActionPreference = "Stop"

$pattern = "^\s*\{\s*BRAND\s*\}\s*from\s*'@/lib/brand'"
$paths = @("src")

Write-Host "Pre-commit: scanning for invalid BRAND import header..."

$hits = @()
foreach($p in $paths){
  if(Test-Path $p){
    $m = rg -n --pcre2 --glob "!**/*.bak*" $pattern $p 2>$null
    if($LASTEXITCODE -eq 0 -and $m){ $hits += $m }
  }
}

if($hits.Count -gt 0){
  Write-Host ""
  Write-Host "FAIL: Invalid BRAND import header detected:"
  $hits | ForEach-Object { Write-Host $_ }
  Write-Host ""
  Write-Host "Fix: ensure header is: import { BRAND } from '@/lib/brand';"
  exit 1
}

Write-Host "OK: no invalid BRAND import header found."
exit 0

