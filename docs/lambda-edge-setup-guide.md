# Lambda@Edge Setup Guide for CloudFront + Cognito

## Overview
Lambda@Edge will rewrite the Host header so Cognito accepts requests from CloudFront.

**Cost:** ~$0.03-$0.10/month for typical SSO usage

---

## Step 1: Create IAM Role for Lambda@Edge

1. **Go to IAM Console** → **Roles**
2. Click **Create role**
3. Select **AWS service** → **Lambda**
4. Click **Next**
5. Search and attach these policies:
   - `AWSLambdaBasicExecutionRole`
   - `service-role/AWSLambdaEdgeExecutionRole` (if available)
6. Click **Next**
7. Role name: `lambda-edge-cognito-role`
8. Click **Create role**

9. **Edit Trust Relationship:**
   - Click on the role you just created
   - Click **Trust relationships** tab
   - Click **Edit trust policy**
   - Replace with:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

10. Click **Update policy**

---

## Step 2: Create Lambda Function in us-east-1

**IMPORTANT:** Must be in us-east-1 region!

1. **Go to Lambda Console**
2. **Verify region is "US East (N. Virginia)"** in top right
3. Click **Create function**
4. Configure:
   ```
   Function name: cloudfront-cognito-host-rewrite
   Runtime: Node.js 20.x
   Architecture: x86_64
   Execution role: Use an existing role
   Existing role: lambda-edge-cognito-role
   ```
5. Click **Create function**

---

## Step 3: Add Lambda Code

1. In the **Code** tab, replace the code with:

```javascript
'use strict';

exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    
    console.log('Original Host:', request.headers.host ? request.headers.host[0].value : 'none');
    
    // Rewrite Host header to match Cognito origin domain
    request.headers.host = [{
        key: 'Host',
        value: 'akilakamal.auth.us-east-1.amazoncognito.com'
    }];
    
    console.log('Rewritten Host:', request.headers.host[0].value);
    
    return request;
};
```

2. Click **Deploy**

---

## Step 4: Configure Lambda Settings

1. Click **Configuration** tab
2. Click **General configuration** → **Edit**
3. Set:
   ```
   Memory: 128 MB
   Timeout: 5 seconds
   ```
4. Click **Save**

---

## Step 5: Publish Lambda Version

**IMPORTANT:** Lambda@Edge requires a published version (not $LATEST)

1. Click **Actions** dropdown (top right)
2. Select **Publish new version**
3. Version description: `Initial version for CloudFront`
4. Click **Publish**
5. **Note the version number** (e.g., Version: 1)
6. **Copy the full ARN** (shown at top, e.g., `arn:aws:lambda:us-east-1:123456789:function:cloudfront-cognito-host-rewrite:1`)

---

## Step 6: Add CloudFront Trigger

### Option A: From Lambda Console (Easier)

1. Still in Lambda function page (showing Version 1)
2. Click **Add trigger**
3. Select **CloudFront**
4. Configure:
   ```
   Distribution: Select your CloudFront distribution
   CloudFront event: Origin request
   Cache behavior path pattern: Default (*)
   Include body: No
   Confirm deploy to Lambda@Edge: Check the box
   ```
5. Click **Deploy**

### Option B: From CloudFront Console (Alternative)

1. Go to **CloudFront Console** (will show Global)
2. Select your distribution
3. Click **Behaviors** tab
4. Select default behavior → **Edit**
5. Scroll to **Function associations**
6. Under **Origin request**:
   ```
   Function type: Lambda@Edge
   Function ARN: Paste your Lambda ARN with version (e.g., arn:aws:lambda:us-east-1:123456789:function:cloudfront-cognito-host-rewrite:1)
   ```
7. Click **Save changes**

---

## Step 7: Wait for Deployment

**Lambda@Edge deployment takes 10-20 minutes** because it needs to replicate to all CloudFront edge locations globally.

You'll see:
- CloudFront status: "In Progress" → "Deployed"
- Lambda console shows CloudFront trigger

---

## Step 8: Test

After 15-20 minutes, test:

```cmd
curl.exe -I "https://sso.akilakamal.com/oauth2/authorize?client_id=ug4gs38a4d202146ld9i2vv32&response_type=code&scope=openid+email+profile&redirect_uri=https://dev.akilakamal.com"
```

**Expected result:** `302 Found` redirect to Cognito login

---

## Step 9: Check CloudWatch Logs (If Issues)

Lambda@Edge logs go to CloudWatch in the region closest to where the request was made.

1. **Go to CloudWatch Console**
2. **Switch to your nearest region** (e.g., Middle East - UAE for you)
3. Click **Log groups**
4. Look for: `/aws/lambda/us-east-1.cloudfront-cognito-host-rewrite`
5. Click on recent log streams
6. Check for errors

---

## Troubleshooting

### Issue: "Lambda@Edge is not available"

**Solution:** Make sure you're creating the Lambda in **us-east-1** region, not Global.

### Issue: Can't add CloudFront trigger

**Possible causes:**
1. Lambda not published (must use versioned ARN, not $LATEST)
2. Wrong IAM role (needs edgelambda.amazonaws.com trust)
3. Lambda not in us-east-1

**Solution:** Verify steps 1, 2, and 5 above.

### Issue: Still getting 502 error

**Wait longer:** Lambda@Edge can take 15-20 minutes to fully deploy globally.

**Check logs:** Look in CloudWatch in your nearest region.

### Issue: Function timeout

**Solution:** Increase timeout to 5 seconds in Lambda configuration.

---

## Verify Lambda@Edge is Active

1. **Go to CloudFront Console** → Your distribution
2. Click **Behaviors** tab
3. Check **Function associations** column
4. Should show: `Origin request: arn:aws:lambda:us-east-1:...:1`

---

## Cost Monitoring

Monitor Lambda@Edge costs:

1. **Go to AWS Cost Explorer**
2. Filter by service: Lambda
3. Group by: Region
4. Look for "Global" region (Lambda@Edge charges)

---

## Cleanup (If Needed)

To remove Lambda@Edge:

1. **CloudFront** → Distribution → Behaviors → Edit
2. Remove Lambda@Edge from Function associations
3. Save and wait for deployment
4. **Lambda Console** → Delete function
5. **IAM** → Delete role

---

## Summary

✓ Lambda function created in us-east-1
✓ Published version (not $LATEST)
✓ CloudFront trigger added (Origin request)
✓ Wait 15-20 minutes for global replication
✓ Test authentication flow

**Next:** After deployment completes, test your SSO flow!
