# Setup symbolic link to Apache htdocs
# Run this script as Administrator

$sourcePath = "C:\dev\projects\apps\aws\cognito\dmi-signon"
$apachePath = "C:\Program Files\Apache24\htdocs\dmi-signon"

Write-Host "Setting up symbolic link for Apache deployment..." -ForegroundColor Green

# Check if Apache directory exists
if (Test-Path $apachePath) {
    Write-Host "Removing existing Apache directory..." -ForegroundColor Yellow
    Remove-Item -Path $apachePath -Recurse -Force
}

# Create symbolic link
Write-Host "Creating symbolic link..." -ForegroundColor Green
New-Item -ItemType SymbolicLink -Path $apachePath -Target $sourcePath

Write-Host "`nSymbolic link created successfully!" -ForegroundColor Green
Write-Host "Apache path: $apachePath" -ForegroundColor Cyan
Write-Host "Points to: $sourcePath" -ForegroundColor Cyan
Write-Host "`nNow you can edit files in either location and changes will sync automatically." -ForegroundColor Yellow
