$ErrorActionPreference = "Stop"

$projectName = "Novacart"
$exportDir = ".\$projectName-CodeCanyon"
$mainFilesDir = "$exportDir\Main_Files"
$docDir = "$exportDir\Documentation"
$zipName = "$projectName-CodeCanyon.zip"

Write-Host "Starting CodeCanyon Packaging Process..." -ForegroundColor Cyan

# 1. Remove old export if exists
if (Test-Path $exportDir) { Remove-Item -Recurse -Force $exportDir }
if (Test-Path $zipName) { Remove-Item -Force $zipName }

# 2. Create directories
New-Item -ItemType Directory -Path $mainFilesDir | Out-Null
New-Item -ItemType Directory -Path $docDir | Out-Null

Write-Host "Creating folder structure..."

# 3. Copy Documentation
if (Test-Path ".\Documentation") {
    Copy-Item -Path ".\Documentation\*" -Destination $docDir -Recurse -Force
}

# 4. Copy Main Files (Excluding unnecessary/sensitive folders)
$excludeList = @(
    "node_modules",
    ".next",
    ".git",
    ".env",
    ".env.local",
    "prepare-codecanyon.ps1",
    "hmac_debug.log",
    "Novacart-CodeCanyon",
    "Novacart-CodeCanyon.zip",
    "desktop.ini",
    "Documentation"
)

Write-Host "Copying project files to Main_Files (Please wait)..."
Get-ChildItem -Path . | Where-Object { 
    $_.Name -notin $excludeList
} | Copy-Item -Destination $mainFilesDir -Recurse -Force

Write-Host "Zipping the package..."
Compress-Archive -Path "$exportDir\*" -DestinationPath $zipName -Force

Write-Host "Cleaning up temporary folders..."
Remove-Item -Recurse -Force $exportDir

Write-Host "DONE! Your CodeCanyon package is ready: $zipName" -ForegroundColor Green
Write-Host "You can now upload this ZIP file directly to CodeCanyon." -ForegroundColor Yellow
