# Lambda Function Deployment Guide

## Step 1: Create Lambda Function

1. **Go to AWS Lambda Console**
2. **Click "Create function"**
3. **Configure:**
   - Function name: `dmi-signon-submit-lead`
   - Runtime: `Node.js 18.x` or later
   - Architecture: `x86_64`
   - Permissions: Create a new role with basic Lambda permissions

4. **Click "Create function"**

## Step 2: Upload Lambda Code

1. **Copy the code from `lambda-submit-lead.js`**
2. **In Lambda console, paste it into the code editor**
3. **Click "Deploy"**

## Step 3: Configure Lambda

### Environment Variables (Optional)
If you want to make the CRM URLs configurable:
- `CRM_BASE_URL`: `dmi-uat.crm15.dynamics.com`
- `TOKEN_ENDPOINT`: `/api/data/v9.2/titc_GetAccessToken`
- `CREATE_LEAD_ENDPOINT`: `/api/data/v9.2/titc_CreateClassifiedB2BLead`

### Timeout
- Set timeout to **30 seconds** (Configuration → General configuration → Edit)

### Memory
- Set memory to **256 MB** (should be sufficient)

## Step 4: Create API Gateway

1. **Go to API Gateway Console**
2. **Click "Create API"**
3. **Choose "HTTP API"** (simpler and cheaper than REST API)
4. **Configure:**
   - API name: `dmi-signon-api`
   - Click "Add integration" → Lambda
   - Select your Lambda function: `dmi-signon-submit-lead`
   - Click "Next"

5. **Configure routes:**
   - Method: `POST`
   - Resource path: `/submit-lead`
   - Integration target: Your Lambda function
   - Click "Next"

6. **Configure CORS:**
   - Access-Control-Allow-Origin: `*` (or specific domains)
   - Access-Control-Allow-Headers: `content-type,authorization`
   - Access-Control-Allow-Methods: `POST,OPTIONS`
   - Click "Next"

7. **Review and Create**

8. **Copy the Invoke URL** (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)

## Step 5: Update Frontend Configuration

Update `config.js` with your API Gateway URL:

```javascript
api: {
    submitLead: 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/submit-lead'
}
```

## Step 6: Test

1. Deploy to Apache: `.\deploy.ps1`
2. Test locally: `http://localhost/dmi-signon/index.html`
3. Sign in and submit the form
4. Check CloudWatch Logs in AWS Lambda console for any errors

## Alternative: Using REST API (More Features)

If you need more control (API keys, usage plans, etc.):

1. **Create REST API** instead of HTTP API
2. **Create Resource**: `/submit-lead`
3. **Create Method**: `POST`
4. **Integration type**: Lambda Function
5. **Enable CORS**: Actions → Enable CORS
6. **Deploy API**: Actions → Deploy API
   - Stage name: `prod`
7. **Copy Invoke URL**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod/submit-lead`

## Security Enhancements

### Add Cognito Authorizer (Recommended)
1. In API Gateway, create a Cognito User Pool Authorizer
2. Attach it to your POST method
3. This validates the JWT token from Cognito

### Add API Key (Optional)
1. Create API key in API Gateway
2. Require API key for the endpoint
3. Add `x-api-key` header in frontend requests

## Monitoring

- **CloudWatch Logs**: Check Lambda logs for errors
- **API Gateway Metrics**: Monitor request count, latency, errors
- **Set up Alarms**: Get notified of failures

## Cost Estimation

- **Lambda**: First 1M requests/month free, then $0.20 per 1M requests
- **API Gateway**: First 1M requests/month free (HTTP API), then $1.00 per 1M requests
- **Very cost-effective** for typical usage

## Troubleshooting

### CORS Errors
- Ensure CORS is enabled in API Gateway
- Check that Lambda returns proper CORS headers

### 401 Unauthorized
- Verify Cognito JWT token is being sent
- Check token hasn't expired

### 500 Internal Server Error
- Check CloudWatch Logs for Lambda errors
- Verify CRM endpoints are accessible from Lambda
- Check CRM credentials/permissions
