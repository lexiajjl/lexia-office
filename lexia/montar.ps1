# Monta la version de Lexia de la oficina virtual en este ordenador.
# Uso (desde la carpeta donde clonaste lexia-office):
#   powershell -ExecutionPolicy Bypass -File .\lexia\montar.ps1
param([string]$Proyectos = 'C:\lexia-proyectos\lexiajjl')
$ErrorActionPreference = 'Continue'
$raiz = Split-Path $PSScriptRoot -Parent
Set-Location $raiz

Write-Host "==> 1/3 Instalando y compilando la oficina (tarda unos minutos la primera vez)" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "La compilacion ha fallado. Copia las ultimas lineas en rojo y pasaselas a Claude." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "==> 2/3 Configurando las plantas (oficina.json y organigrama)" -ForegroundColor Cyan
$login = gh api user --jq .login
$id = gh api user --jq .id
foreach ($planta in Get-ChildItem (Join-Path $PSScriptRoot 'plantas') -Directory) {
  $destino = Join-Path $Proyectos $planta.Name
  if (-not (Test-Path (Join-Path $destino '.git'))) {
    Write-Host "    $($planta.Name): no esta en $destino, la salto (anadela primero desde el ascensor)." -ForegroundColor Yellow
    continue
  }
  Copy-Item (Join-Path $planta.FullName '*') $destino -Force
  Push-Location $destino
  if (-not (git config user.name))  { git config user.name $login }
  if (-not (git config user.email)) { git config user.email "$id+$login@users.noreply.github.com" }
  git pull -q --rebase
  git add oficina.json ORGANIGRAMA.md 2>$null
  git commit -q -m "Oficina: jefes de departamento en los puestos y configuracion de la planta" 2>$null
  git push -q
  Pop-Location
  Write-Host "    $($planta.Name): lista" -ForegroundColor Green
}

Write-Host ""
Write-Host "==> 3/3 Creando el comando lexia-oficina" -ForegroundColor Cyan
$cmd = Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\lexia-oficina.cmd'
Set-Content -Path $cmd -Value "@node `"$raiz\bin\agent-office.js`" %*" -Encoding ASCII
Write-Host "    Creado: $cmd" -ForegroundColor Green

Write-Host ""
Write-Host "Listo. Cierra la oficina antigua si esta abierta (Ctrl+C en su ventana) y abre la nueva con:" -ForegroundColor Green
Write-Host "    lexia-oficina" -ForegroundColor White
