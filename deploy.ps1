$source = "C:\dev\projects\apps\aws\cognito\dmi-signon"
$dest = "C:\Program Files\Apache24\htdocs\dmi-signon"

Write-Host "Deploying to Apache..." -ForegroundColor Green

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Copy all HTML files
Get-ChildItem -Path $source -Filter "*.html" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $dest -Force
    Write-Host "Copied: $($_.Name)" -ForegroundColor Green
}

# Copy all JS files
Get-ChildItem -Path $source -Filter "*.js" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $dest -Force
    Write-Host "Copied: $($_.Name)" -ForegroundColor Green
}

# Copy CSS files
Get-ChildItem -Path $source -Filter "*.css" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $dest -Force
    Write-Host "Copied: $($_.Name)" -ForegroundColor Green
}

Write-Host "Done! Visit http://localhost/dmi-signon/index.html" -ForegroundColor Cyan
