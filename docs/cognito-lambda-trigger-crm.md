# Cognito Lambda Trigger to Push User to CRM

## Overview

Automatically push user details to CRM when they sign in with Google for the first time.

**Trigger:** Post Confirmation (runs once after first successful authentication)

---

## Step 1: Create Lambda Function

### 1.1 Go to Lambda Console

1. **AWS Console** → **Lambda** (in us-east-1 region)
2. Click **Create function**
3. Configure:
   ```
   Name: cognito-post-confirmation-crm
   Runtime: Node.js 20.x
   Architecture: x86_64
   ```
4. Click **Create function**

### 1.2 Add Lambda Code

Replace the code with:

```javascript
const https = require('https');

exports.handler = async (event) => {
    console.log('Post Confirmation Trigger:', JSON.stringify(event, null, 2));
    
    // Extract user details from Cognito event
    const userAttributes = event.request.userAttributes;
    
    const userData = {
        email: userAttributes.email,
        name: userAttributes.name || '',
        firstName: userAttributes.given_name || '',
        lastName: userAttributes.family_name || '',
        cognitoSub: userAttributes.sub,
        provider: event.userName.split('_')[0], // e.g., "Google", "Facebook"
        signUpDate: new Date().toISOString()
    };
    
    console.log('User data to send to CRM:', userData);
    
    // Push to CRM
    try {
        await pushToCRM(userData);
        console.log('Successfully pushed user to CRM');
    } catch (error) {
        console.error('Failed to push to CRM:', error);
        // Don't throw error - we don't want to block user authentication
        // Just log it for monitoring
    }
    
    // Return event to continue Cognito flow
    return event;
};

async function pushToCRM(userData) {
    // Your CRM API endpoint
    const crmApiUrl = 'https://your-crm-api.com/api/users';
    
    // Prepare CRM payload (adjust based on your CRM API)
    const crmPayload = {
        LeadFirstName: userData.firstName || userData.name.split(' ')[0] || '',
        LeadLastName: userData.lastName || userData.name.split(' ').slice(1).join(' ') || '',
        LeadEmail: userData.email,
        LeadSource: 'Google SSO',
        LeadProvider: userData.provider,
        LeadSignUpDate: userData.signUpDate,
        CognitoUserId: userData.cognitoSub
    };
    
    console.log('Sending to CRM:', crmPayload);
    
    // Option 1: Use your existing Lambda API Gateway
    return callApiGateway(crmPayload);
    
    // Option 2: Call CRM directly (if you have direct API access)
    // return callCRMDirectly(crmPayload);
}

async function callApiGateway(payload) {
    const apiUrl = 'https://1lwvjovcaj.execute-api.us-east-1.amazonaws.com/submit-lead';
    
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(apiUrl, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`CRM API returned ${res.statusCode}: ${body}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
```

### 1.3 Configure Environment Variables (Optional)

1. Click **Configuration** tab → **Environment variables**
2. Add:
   ```
   CRM_API_URL = https://1lwvjovcaj.execute-api.us-east-1.amazonaws.com/submit-lead
   ```

### 1.4 Adjust Timeout

1. **Configuration** → **General configuration** → **Edit**
2. Set **Timeout**: 10 seconds
3. Click **Save**

---

## Step 2: Add Permissions to Lambda

### 2.1 Add CloudWatch Logs Permission (Already included)

The default execution role already has CloudWatch Logs permissions.

### 2.2 Add Permissions for CRM API (if needed)

If your CRM API requires specific AWS permissions, add them to the Lambda execution role.

---

## Step 3: Attach Lambda Trigger to Cognito

### 3.1 Go to Cognito Console

1. **AWS Console** → **Cognito** → **User pools**
2. Select your user pool: `us-east-1_1gtVWamfZ`
3. Click **User pool properties** tab
4. Scroll to **Lambda triggers**
5. Click **Add Lambda trigger**

### 3.2 Configure Trigger

1. **Trigger type**: Authentication
2. **Authentication**: Post confirmation
3. **Lambda function**: Select `cognito-post-confirmation-crm`
4. Click **Add Lambda trigger**

---

## Step 4: Grant Cognito Permission to Invoke Lambda

This is usually done automatically, but if you get permission errors:

1. **Go to Lambda Console** → Your function
2. Click **Configuration** → **Permissions**
3. Scroll to **Resource-based policy statements**
4. Click **Add permissions**
5. Configure:
   ```
   Statement ID: cognito-trigger
   Principal: cognito-idp.amazonaws.com
   Source ARN: arn:aws:cognito-idp:us-east-1:YOUR_ACCOUNT_ID:userpool/us-east-1_1gtVWamfZ
   Action: lambda:InvokeFunction
   ```
6. Click **Save**

---

## Step 5: Test the Trigger

### 5.1 Test with a New User

1. Clear your browser cache and cookies
2. Go to your website: `http://localhost/dmi-signon/index.html`
3. Click **Sign in with Google**
4. Sign in with a **new Google account** (or one that hasn't signed in before)
5. Complete authentication

### 5.2 Check CloudWatch Logs

1. **Go to CloudWatch Console**
2. Click **Log groups**
3. Find: `/aws/lambda/cognito-post-confirmation-crm`
4. Click on the latest log stream
5. You should see:
   - User data extracted from Cognito
   - CRM API call
   - Success or error messages

---

## Event Data Available in Lambda

When the trigger fires, you get this data:

```javascript
{
  "version": "1",
  "triggerSource": "PostConfirmation_ConfirmSignUp",
  "region": "us-east-1",
  "userPoolId": "us-east-1_1gtVWamfZ",
  "userName": "Google_123456789",
  "request": {
    "userAttributes": {
      "sub": "abc-123-def-456",
      "email_verified": "true",
      "cognito:user_status": "CONFIRMED",
      "name": "John Doe",
      "given_name": "John",
      "family_name": "Doe",
      "email": "john.doe@gmail.com",
      "identities": "[{\"userId\":\"123456789\",\"providerName\":\"Google\",\"providerType\":\"Google\"}]"
    }
  },
  "response": {}
}
```

---

## Alternative: Post Authentication Trigger (Runs Every Login)

If you want to track every login (not just first time), use **Post Authentication** trigger:

### Lambda Code for Post Authentication

```javascript
exports.handler = async (event) => {
    const userAttributes = event.request.userAttributes;
    
    // Check if this is first login
    const isFirstLogin = !userAttributes['custom:crm_synced'];
    
    if (isFirstLogin) {
        // Push to CRM
        await pushToCRM(userAttributes);
        
        // Mark as synced (requires custom attribute in Cognito)
        event.response.claimsOverrideDetails = {
            claimsToAddOrOverride: {
                'custom:crm_synced': 'true'
            }
        };
    }
    
    return event;
};
```

**Note:** This requires adding a custom attribute `custom:crm_synced` to your Cognito User Pool.

---

## Monitoring and Debugging

### Check Lambda Execution

1. **CloudWatch Logs**: `/aws/lambda/cognito-post-confirmation-crm`
2. **Lambda Metrics**: Invocations, Errors, Duration
3. **Cognito Logs**: User pool → Monitoring tab

### Common Issues

**Issue: Lambda not triggered**
- Verify trigger is attached in Cognito
- Check Lambda permissions
- Ensure user is new (Post Confirmation only runs once)

**Issue: CRM API call fails**
- Check CloudWatch logs for error details
- Verify API endpoint is correct
- Check API authentication/authorization

**Issue: User authentication blocked**
- Lambda must return the event object
- Don't throw errors that would block authentication
- Use try-catch and log errors instead

---

## Cost

**Lambda Invocations:**
- Free tier: 1 million requests/month
- After: $0.20 per 1 million requests

**For 10,000 new users/month:**
- Cost: ~$0.002 (basically free)

---

## Security Best Practices

1. ✓ Don't throw errors that block authentication
2. ✓ Log all CRM API calls for auditing
3. ✓ Use environment variables for API URLs
4. ✓ Implement retry logic for CRM API failures
5. ✓ Store sensitive CRM credentials in AWS Secrets Manager
6. ✓ Set appropriate Lambda timeout (10 seconds)

---

## Advanced: Store CRM API Key Securely

### Use AWS Secrets Manager

1. **Create Secret:**
   ```bash
   aws secretsmanager create-secret \
     --name crm-api-key \
     --secret-string '{"apiKey":"your-crm-api-key"}'
   ```

2. **Update Lambda Code:**
   ```javascript
   const AWS = require('aws-sdk');
   const secretsManager = new AWS.SecretsManager();
   
   async function getCRMApiKey() {
       const data = await secretsManager.getSecretValue({
           SecretId: 'crm-api-key'
       }).promise();
       return JSON.parse(data.SecretString).apiKey;
   }
   ```

3. **Add IAM Permission:**
   - Lambda execution role needs `secretsmanager:GetSecretValue`

---

## Summary

✓ **Trigger**: Post Confirmation (first login only)
✓ **Lambda**: Extracts user data and pushes to CRM
✓ **Cost**: ~$0.002 per 10,000 users
✓ **Automatic**: No frontend code changes needed
✓ **Reliable**: Doesn't block user authentication if CRM fails

**Next Steps:**
1. Create Lambda function
2. Attach to Cognito Post Confirmation trigger
3. Test with new user
4. Monitor CloudWatch logs
