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

Since your Lambda uses `.mjs` extension (ES Modules):

1. **Copy the code from `lambda-submit-lead.mjs`**
2. **In Lambda console:**
   - Click on the file name (probably `index.mjs`)
   - Paste the code into the editor
3. **Verify Handler**: Should be `index.handler`
4. **Click "Deploy"**

**Alternative: If you prefer CommonJS (`.js` files):**
1. Rename your Lambda file from `index.mjs` to `index.js`
2. Copy code from `lambda-submit-lead-commonjs.js`
3. Handler: `index.handler`
4. Deploy

## Step 3: Configure Lambda Environment Variables

**Required Environment Variables:**

1. Go to Lambda Console → Your function → Configuration → Environment variables
2. Click "Edit"
3. Add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `AZURE_TENANT_ID` | `your-tenant-id-here` | Azure AD Tenant ID (get from Azure Portal) |
| `AZURE_CLIENT_ID` | `your-client-id-here` | Azure AD Application (Client) ID (get from Azure Portal) |
| `AZURE_CLIENT_SECRET` | `your-client-secret-here` | Azure AD Client Secret (get from Azure Portal) |

**Optional Environment Variables:**

| Key | Value | Description |
|-----|-------|-------------|
| `CRM_BASE_URL` | `dmi-uat.crm15.dynamics.com` | Dynamics CRM base URL (default) |
| `CREATE_LEAD_ENDPOINT` | `/api/data/v9.2/titc_CreateClassifiedB2BLead` | CRM API endpoint (default) |
| `AZURE_SCOPE` | `https://dmi-uat.crm15.dynamics.com/.default` | OAuth scope (auto-generated if not set) |

4. Click "Save"

**Security Note:** These credentials are sensitive. In production, consider using AWS Secrets Manager or Parameter Store instead of environment variables.

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

1. **Stage name:** `$default` (auto-configured for HTTP API)
2. **Auto-deploy:** ☑ Enabled (recommended)
3. **Click "Next"**

**Note:** HTTP APIs use `$default` stage automatically. If you don't see this page, it's okay - HTTP APIs auto-deploy by default.

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

## Step 6: Test the Lambda Function

### Test 1: Test Lambda Function Directly (Recommended First)

1. **Go to AWS Lambda Console**
2. **Open your function**: `dmi-signon-submit-lead`
3. **Click "Test" tab**
4. **Create a new test event:**
   - Event name: `TestLeadSubmission`
   - Template: `API Gateway HTTP API`
   - Replace the JSON with:

```json
{
  "version": "2.0",
  "routeKey": "POST /submit-lead",
  "rawPath": "/submit-lead",
  "requestContext": {
    "http": {
      "method": "POST",
      "path": "/submit-lead"
    }
  },
  "headers": {
    "content-type": "application/json",
    "authorization": "Bearer test-token"
  },
  "body": "{\"LeadFirstName\":\"John\",\"LeadLastName\":\"Doe\",\"LeadEmail\":\"john.doe@example.com\",\"LeadMobile\":\"+1234567890\",\"LeadPublicationName\":\"Test Publication\",\"LeadDescription\":\"Test lead description\",\"LeadCountry\":\"United Arab Emirates\",\"LeadAddress\":\"Test Address\"}",
  "isBase64Encoded": false
}
```

5. **Click "Test"**
6. **Check the response:**
   - ✅ Success: Status 200, response shows success message
   - ❌ Error: Check the error message and logs

### Test 2: Test via API Gateway URL

Use curl or Postman to test the API Gateway endpoint:

```bash
curl -X POST https://YOUR-API-URL/submit-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "LeadFirstName": "John",
    "LeadLastName": "Doe",
    "LeadEmail": "john.doe@example.com",
    "LeadMobile": "+1234567890",
    "LeadPublicationName": "Test Publication",
    "LeadDescription": "Test lead description",
    "LeadCountry": "United Arab Emirates",
    "LeadAddress": "Test Address"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lead submitted successfully",
  "data": { ... }
}
```

### Test 3: Check CloudWatch Logs

1. **Go to CloudWatch Console**
2. **Click "Log groups"**
3. **Find**: `/aws/lambda/dmi-signon-submit-lead`
4. **Click on the latest log stream**
5. **Review logs** for any errors

Common log messages:
- ✅ "Getting CRM access token..." - Token request started
- ✅ "Access token received" - Token obtained successfully
- ✅ "Submitting lead to CRM..." - Lead submission started
- ✅ "Lead submitted successfully" - All good!
- ❌ "Token request failed" - CRM token endpoint issue
- ❌ "CRM request failed" - CRM lead creation issue

### Test 4: Test from Frontend

1. Deploy to Apache: `.\deploy.ps1`
2. Test locally: `http://localhost/dmi-signon/index.html`
3. Sign in and submit the form
4. Check browser console (F12) for detailed logs
5. Check CloudWatch Logs for Lambda execution logs

## How to Create Stage and Deploy (If Needed)

### For HTTP API - Enable or Create Stage

If `$default` stage is disabled or unavailable:

**Option 1: Enable $default Stage (Recommended)**
1. Go to API Gateway Console
2. Select your HTTP API
3. Click "Stages" in left menu
4. Click "$default" stage
5. Look for "Auto-deploy" toggle
6. **Enable Auto-deploy** (turn it ON)
7. Click "Save"

**Important:** Once auto-deploy is enabled, your API is automatically deployed! You don't need to click "Deploy" manually. Any changes you make will auto-deploy immediately.

**Option 2: Create a New Stage**
1. Go to API Gateway Console
2. Select your HTTP API
3. Click "Stages" in left menu
4. Click "Create" button
5. **Stage name**: Enter `prod` (or any name you want)
6. **Auto-deploy**: ☑ Enable
7. Click "Create"

**Option 3: Manual Deployment (Only if Auto-deploy is OFF)**
1. Go to API Gateway Console
2. Select your HTTP API
3. Click "Develop" in left menu
4. Click "Routes" 
5. Click "Deploy" button at the top
6. Select stage: `$default` or your custom stage
7. Click "Deploy"

**Note:** If auto-deploy is enabled, the "Deploy" button will be grayed out or unavailable. This is normal - your API is already deployed automatically!

### Get Your API Invoke URL

After enabling the stage:

1. Go to API Gateway Console
2. Select your HTTP API
3. Click "Stages" in left menu
4. Click your stage (`$default` or `prod`)
5. **Copy the "Invoke URL"** shown at the top

Your full endpoint URL will be:
- With $default stage: `https://abc123.execute-api.us-east-1.amazonaws.com/submit-lead`
- With custom stage (prod): `https://abc123.execute-api.us-east-1.amazonaws.com/prod/submit-lead`

**Test your API:**
```bash
curl -X POST https://YOUR-API-URL/submit-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-TOKEN" \
  -d '{"LeadFirstName":"Test","LeadLastName":"User","LeadEmail":"test@example.com"}'
```

### For REST API (Manual Deployment Required)

If you created a REST API instead, you must manually deploy:

1. In API Gateway Console, select your REST API
2. Click "Actions" dropdown
3. Select "Deploy API"
4. **Deployment stage**: 
   - Select "[New Stage]"
   - **Stage name**: Enter `prod` (or `dev`, `test`, etc.)
   - **Stage description**: Optional
5. Click "Deploy"

Your API URL will be:
```
https://abc123.execute-api.us-east-1.amazonaws.com/prod/submit-lead
```

**Note:** REST APIs require the stage name in the URL (`/prod/`), while HTTP APIs don't.

## Alternative: Using REST API (More Features)

If you need more control (API keys, usage plans, throttling):

### Step-by-Step REST API Creation

1. **Create REST API**
   - Go to API Gateway Console
   - Click "Create API"
   - Choose "REST API" → "Build"
   - API name: `dmi-signon-api`
   - Endpoint Type: "Regional"
   - Click "Create API"

2. **Create Resource**
   - Click "Actions" → "Create Resource"
   - Resource Name: `submit-lead`
   - Resource Path: `/submit-lead`
   - Enable CORS: ☑ (optional, can do later)
   - Click "Create Resource"

3. **Create POST Method**
   - Select the `/submit-lead` resource
   - Click "Actions" → "Create Method"
   - Select "POST" from dropdown
   - Click the checkmark ✓
   
4. **Configure POST Method**
   - Integration type: "Lambda Function"
   - Use Lambda Proxy integration: ☑ (important!)
   - Lambda Region: Select your region
   - Lambda Function: `dmi-signon-submit-lead`
   - Click "Save"
   - Click "OK" to give API Gateway permission

5. **Enable CORS**
   - Select the `/submit-lead` resource
   - Click "Actions" → "Enable CORS"
   - Keep default settings or customize:
     - Access-Control-Allow-Headers: `Content-Type,Authorization`
     - Access-Control-Allow-Methods: `POST,OPTIONS`
   - Click "Enable CORS and replace existing CORS headers"
   - Click "Yes, replace existing values"

6. **Deploy API**
   - Click "Actions" → "Deploy API"
   - Deployment stage: "[New Stage]"
   - Stage name: `prod`
   - Click "Deploy"

7. **Get Invoke URL**
   - After deployment, you'll see the "Invoke URL"
   - Copy it: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`
   - Your full endpoint: `https://abc123.execute-api.us-east-1.amazonaws.com/prod/submit-lead`

### When to Use REST API vs HTTP API

**Use HTTP API if:**
- ✅ You want simpler setup
- ✅ You want lower cost ($1/million vs $3.50/million)
- ✅ You don't need API keys or usage plans
- ✅ Basic authentication (JWT) is sufficient

**Use REST API if:**
- ✅ You need API keys
- ✅ You need usage plans and throttling
- ✅ You need request/response transformation
- ✅ You need more detailed CloudWatch metrics

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
