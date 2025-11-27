# Dynamics 365 CRM Integration Notes

## API Endpoints
- **Get Token**: `https://dmi-uat.crm15.dynamics.com/api/data/v9.2/titc_GetAccessToken`
- **Create Lead**: `https://dmi-uat.crm15.dynamics.com/api/data/v9.2/titc_CreateClassifiedB2BLead`

## Form Field Mapping
The form submits data with these field names:
- `LeadFirstName` - First Name
- `LeadLastName` - Last Name
- `LeadEmail` - Email
- `LeadMobile` - Phone Number
- `LeadPublicationName` - Publication
- `LeadDescription` - Description
- `LeadCountry` - Country
- `LeadAddress` - Address (optional)

Plus authentication data:
- `userId` - Cognito user ID
- `userEmail` - Cognito user email

## CORS Considerations
If you encounter CORS errors when calling the Dynamics CRM API directly from the browser:

### Option 1: Enable CORS in Dynamics 365
Configure CORS in your Dynamics 365 environment to allow requests from:
- `http://localhost`
- `https://dmi-signon.vercel.app`

### Option 2: Use a Backend Proxy (Recommended)
Create an AWS Lambda function or Node.js backend that:
1. Receives the form data from the frontend
2. Calls the Dynamics CRM APIs server-side
3. Returns the response to the frontend

This avoids CORS issues and keeps API credentials secure.

### Option 3: Use AWS API Gateway as Proxy
Set up API Gateway endpoints that proxy requests to Dynamics CRM.

## Testing
1. Test locally: `http://localhost/dmi-signon/index.html`
2. Check browser console for any CORS or API errors
3. Verify the data format matches what Dynamics CRM expects

## Security Notes
- The access token API should be secured
- Consider moving token retrieval to backend
- Don't expose sensitive credentials in frontend code
