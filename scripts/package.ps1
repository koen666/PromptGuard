# 打 zip 交付包（排除 node_modules、构建产物、本地数据）
# 用法: .\scripts\package.ps1
# 输出: ../PromptGuard-handover.zip

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$OutZip = Join-Path (Split-Path -Parent $Root) "PromptGuard-handover.zip"
$TempDir = Join-Path $env:TEMP "PromptGuard-pack-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "==> Packaging PromptGuard" -ForegroundColor Cyan
Write-Host "    Source: $Root"
Write-Host "    Output: $OutZip"

$ExcludeDirs = @(
    "node_modules",
    ".next",
    "dist",
    ".turbo",
    "data",
    "reports",
    ".git"
)

function Should-SkipPath {
    param([string]$RelativePath)
    foreach ($dir in $ExcludeDirs) {
        if ($RelativePath -eq $dir -or $RelativePath.StartsWith("$dir\")) {
            return $true
        }
    }
    $name = Split-Path -Leaf $RelativePath
    if ($name -eq ".env" -or $name -eq ".env.local") { return $true }
    if ($name -match "\.log$") { return $true }
    return $false
}

New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
$DestRoot = Join-Path $TempDir "PromptGuard"
New-Item -ItemType Directory -Path $DestRoot -Force | Out-Null

Get-ChildItem -Path $Root -Force | ForEach-Object {
    $rel = $_.Name
    if (Should-SkipPath $rel) {
        Write-Host "    skip: $rel" -ForegroundColor DarkGray
        return
    }
    Copy-Item -Path $_.FullName -Destination (Join-Path $DestRoot $rel) -Recurse -Force
}

# 递归复制时再次排除嵌套目录
Get-ChildItem -Path $DestRoot -Recurse -Directory -Force | ForEach-Object {
    $relFromDest = $_.FullName.Substring($DestRoot.Length + 1)
    foreach ($dir in $ExcludeDirs) {
        if ($relFromDest -eq $dir -or $relFromDest.EndsWith("\$dir")) {
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# 删除各包内 node_modules / dist / .next（Copy-Item -Exclude 对递归不可靠）
@("node_modules", ".next", "dist", ".turbo") | ForEach-Object {
    Get-ChildItem -Path $DestRoot -Recurse -Directory -Filter $_ -Force -ErrorAction SilentlyContinue |
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path $OutZip) {
    Remove-Item $OutZip -Force
}

Compress-Archive -Path $DestRoot -DestinationPath $OutZip -CompressionLevel Optimal

Remove-Item -Path $TempDir -Recurse -Force

$sizeMb = [math]::Round((Get-Item $OutZip).Length / 1MB, 2)
Write-Host ""
Write-Host "Done: $OutZip ($sizeMb MB)" -ForegroundColor Green
Write-Host "After extract, run: .\scripts\setup.ps1 -Seed"
