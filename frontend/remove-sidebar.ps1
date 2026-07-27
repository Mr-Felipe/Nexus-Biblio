# Script para eliminar sidebar de archivos HTML (excepto layouts)
$folder = "figma-export"
$exclude = @("layout-admin.html", "layout-student.html")

$files = Get-ChildItem "$folder\*.html" | Where-Object { $_.Name -notin $exclude }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # Eliminar bloque aside completo
    $content = $content -replace '(?s)<!-- SIDEBAR -->.*?(?=<!-- MAIN BODY -->|<div class="flex-1)', ''

    # Cambiar flex-row por flex-col (ya no hay sidebar)
    $content = $content -replace 'flex-col lg:flex-row', 'flex-col'

    # Eliminar hidden lg:flex del navbar brand (mostrar siempre)
    $content = $content -replace 'class="hidden lg:flex items-center gap-2 mr-2"', 'class="flex items-center gap-2 mr-2"'

    # Eliminar hidden lg:flex del navbar nav
    $content = $content -replace 'class="hidden lg:flex items-center gap-0\.5', 'class="flex items-center gap-0.5'

    # Eliminar hidden lg:flex del user menu
    $content = $content -replace 'class="hidden lg:flex items-center gap-2 border-l', 'class="flex items-center gap-2 border-l'

    # Eliminar hidden xl:flex del date
    $content = $content -replace 'class="hidden xl:flex items-center gap-1\.5', 'class="flex items-center gap-1.5'

    # Eliminar hidden sm:flex del supabase status (si existe)
    $content = $content -replace 'class="hidden sm:flex items-center gap-1\.5', 'class="flex items-center gap-1.5'

    Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Procesado: $($file.Name)" -ForegroundColor Green
}

Write-Host "`nListo! Se procesaron $($files.Count) archivos" -ForegroundColor Cyan
