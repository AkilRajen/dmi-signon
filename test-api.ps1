# PowerShell script to test API Gateway endpoint

$apiUrl = "https://1lwvjovcaj.execute-api.us-east-1.amazonaws.com/submit-lead"

Write-Host "Testing API Gateway endpoint..." -ForegroundColor Green
Write-Host "URL: $apiUrl" -ForegroundColor Cyan
Write-Host ""

$body = @{
    LeadFirstName = "Ahmed"
    LeadLastName = "Hassan"
    LeadEmail = "ahmed.hassan@test.com"
    LeadMobile = "+971501234567"
    LeadPublicationName = "Gulf News"
    LeadDescription = "Test lead submission from PowerShell"
    LeadCountry = "United Arab Emirates"
    LeadAddress = "Dubai Marina, Dubai"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer test-token-from-cognito"
}

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Error!" -ForegroundColor Red
    Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
    Write-Host "Error Message:" $_.Exception.Message
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" $responseBody
    }
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Green
