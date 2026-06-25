# PromptGuard 一键安装（Windows PowerShell）
# 用法: .\scripts\setup.ps1 [-Seed]

param(
    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "==> PromptGuard 安装脚本" -ForegroundColor Cyan
Write-Host "    项目目录: $Root"

# Node.js
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Error "未检测到 Node.js，请先安装 Node 20+： https://nodejs.org/"
}
Write-Host "    Node: $nodeVersion"

# pnpm
$pnpmVersion = pnpm -v 2>$null
if (-not $pnpmVersion) {
    Write-Host "==> 启用 corepack 并安装 pnpm@9.15.4..." -ForegroundColor Yellow
    corepack enable
    corepack prepare pnpm@9.15.4 --activate
    $pnpmVersion = pnpm -v
}
Write-Host "    pnpm: $pnpmVersion"

Write-Host "==> pnpm install..." -ForegroundColor Cyan
pnpm install

if (-not (Test-Path ".env")) {
    Write-Host "==> 复制 .env.example -> .env" -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
} else {
    Write-Host "==> .env 已存在，跳过" -ForegroundColor DarkGray
}

Write-Host "==> pnpm db:migrate..." -ForegroundColor Cyan
pnpm db:migrate

if ($Seed) {
    Write-Host "==> pnpm seed（演示数据）..." -ForegroundColor Cyan
    pnpm seed
}

Write-Host ""
Write-Host "安装完成。" -ForegroundColor Green
Write-Host "  开发: pnpm dev"
Write-Host "  访问: http://localhost:3000"
if (-not $Seed) {
    Write-Host "  演示数据: pnpm seed"
}
