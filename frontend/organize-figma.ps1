# Script para organizar archivos HTML en carpetas
$base = "figma-export"

# Crear carpetas
$folders = @("layouts", "admin", "student", "auth", "modals")
foreach ($f in $folders) {
    if (!(Test-Path "$base\$f")) {
        New-Item -ItemType Directory -Path "$base\$f" -Force | Out-Null
    }
}

# Mapeo de archivos
$mapping = @{
    # Layouts
    "layout-admin.html"    = "layouts"
    "layout-student.html"  = "layouts"

    # Admin
    "dashboard.html"       = "admin"
    "users.html"           = "admin"
    "books.html"           = "admin"
    "inventory.html"       = "admin"
    "loans.html"           = "admin"
    "reservations.html"    = "admin"
    "sanctions.html"       = "admin"
    "audit.html"           = "admin"
    "reports.html"         = "admin"

    # Student
    "catalogue.html"       = "student"
    "my-loans.html"        = "student"
    "my-reservations.html" = "student"
    "my-sanctions.html"    = "student"

    # Auth
    "login.html"           = "auth"
    "register.html"        = "auth"
    "home.html"            = "auth"

    # Modals
    "modal-book.html"      = "modals"
    "modal-loan.html"      = "modals"
    "modal-sanction.html"  = "modals"
    "modal-supabase.html"  = "modals"
    "modal-user.html"      = "modals"
}

foreach ($file in $mapping.Keys) {
    $src = "$base\$file"
    $dst = "$base\$($mapping[$file])\$file"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dst -Force
        Write-Host "$file -> $($mapping[$file])/" -ForegroundColor Green
    }
}

Write-Host "`nEstructura final:" -ForegroundColor Cyan
Get-ChildItem $base -Recurse -Directory | ForEach-Object { Write-Host "  $($_.FullName.Replace("$PWD\", ''))" -ForegroundColor Yellow }
Write-Host ""
Get-ChildItem $base -Recurse -File | ForEach-Object { 
    $rel = $_.FullName.Replace("$PWD\$base\", "")
    Write-Host "  $rel" -ForegroundColor Gray
}
