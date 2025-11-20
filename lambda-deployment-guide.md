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

## Step 4: Create API Gateway (HTTP API - Recommended)

### Page 1: Integrations and API Name

1. **Go to AWS Console** → Search for "API Gateway"
2. **Click "Create API"**
3. **Choose "HTTP API"** → Click "Build"
4. **Add integrations:**
   - Click "Add integration"
   - Select "Lambda"
   - Choose AWS Region: `us-east-1` (or your region)
   - Lambda function: Select `dmi-signon-submit-lead`
   - Version: `2.0` (default)
5. **API name:** Enter `dmi-signon-api`
6. **Click "Next"**

### Page 2: Configure Routes

1. **Method:** `POST` (should be auto-selected)
2. **Resource path:** Enter `/submit-lead`
3. **Integration target:** Should show your Lambda function
4. **Click "Next"**

6. **Configure CORS:**
   
   On the "Configure CORS" page in API Gateway:
   
   - **Access-Control-Allow-Origin**: Enter `*` (allows all domains) or specific domains like:
     ```
     http://localhost,https://dmi-signon.vercel.app
     ```
   
   - **Access-Control-Allow-Headers**: Enter:
     ```
     content-type,authorization
     ```
   
   - **Access-Control-Allow-Methods**: Check these boxes:
     - ☑ POST
     - ☑ OPTIONS
   
   - Click "Next"
   
   **Note:** If you don't see the CORS configuration page during creation, you can configure it later:
   - Go to your API in API Gateway Console
   - Click "CORS" in the left menu
   - Configure the settings there

### Page 3: Define Stages

1. **Stage name:** `$default` (auto-configured)
2. **Auto-deploy:** ☑ Enabled (recommended)
3. **Click "Next"**

### Page 4: Review and Create

1. **Review all settings**
2. **Click "Create"**

### Get Your API URL

After creation, you'll see:
- **Invoke URL**: `https://abc123xyz.execute-api.us-east-1.amazonaws.com`

Your full endpoint will be:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/submit-lead
```

**Copy this URL** - you'll need it for the frontend configuration!

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

If you get CORS errors in the browser console:

**Option 1: Configure CORS in API Gateway Console**
1. Go to API Gateway Console
2. Select your API: `dmi-signon-api`
3. Click "CORS" in the left sidebar
4. Click "Configure"
5. Set:
   - **Access-Control-Allow-Origin**: `*` or your specific domains
   - **Access-Control-Allow-Headers**: `content-type,authorization`
   - **Access-Control-Allow-Methods**: Select `POST` and `OPTIONS`
6. Click "Save"

**Option 2: Verify Lambda CORS Headers**
The Lambda function already includes CORS headers in the response. Make sure they match your frontend domain.

**Option 3: Test CORS**
Use browser console to test:
```javascript
fetch('https://YOUR-API-URL/submit-lead', {
  method: 'OPTIONS'
}).then(r => console.log(r.headers))
```

### 401 Unauthorized
- Verify Cognito JWT token is being sent
- Check token hasn't expired

### 500 Internal Server Error
- Check CloudWatch Logs for Lambda errors
- Verify CRM endpoints are accessible from Lambda
- Check CRM credentials/permissions
