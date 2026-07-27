# Script para generar .zip para html.to.design
# Ejecutar: .\figma-zip.ps1

Write-Host "Generando build de produccion..." -ForegroundColor Cyan
ng build --configuration production

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en el build" -ForegroundColor Red
    exit 1
}

$distPath = "dist\app\browser"
$zipName = "figma-import.zip"

if (Test-Path $zipName) {
    Remove-Item $zipName
}

Write-Host "Creando $zipName..." -ForegroundColor Cyan
Compress-Archive -Path "$distPath\*" -DestinationPath $zipName

if (Test-Path $zipName) {
    $size = (Get-Item $zipName).Length / 1MB
    Write-Host "Listo: $zipName ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
    Write-Host "Arrastra este archivo al tab File de html.to.design" -ForegroundColor Yellow
} else {
    Write-Host "Error al crear el zip" -ForegroundColor Red
}
