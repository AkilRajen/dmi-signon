#!/bin/bash
# Test API Gateway endpoint with curl

API_URL="https://1lwvjovcaj.execute-api.us-east-1.amazonaws.com/submit-lead"

echo "Testing API Gateway endpoint..."
echo "URL: $API_URL"
echo ""

curl -X POST $API_URL ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer test-token-from-cognito" ^
  -d '{
    "LeadFirstName": "Ahmed",
    "LeadLastName": "Hassan",
    "LeadEmail": "ahmed.hassan@test.com",
    "LeadMobile": "+971501234567",
    "LeadPublicationName": "Gulf News",
    "LeadDescription": "Test lead submission from curl",
    "LeadCountry": "United Arab Emirates",
    "LeadAddress": "Dubai Marina, Dubai"
  }' ^
  | jq '.'

echo ""
echo "Test complete!"
