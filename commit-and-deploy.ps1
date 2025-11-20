# Commit to Git and Deploy to Apache
# Usage: .\commit-and-deploy.ps1 "Your commit message"

param(
    [string]$message = "Update files"
)

Write-Host "=== Git Commit ===" -ForegroundColor Cyan
git add .
git commit -m $message
git push

Write-Host "`n=== Deploy to Apache ===" -ForegroundColor Cyan
.\deploy-to-apache.ps1

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Changes committed to GitHub and deployed to Apache" -ForegroundColor Yellow
