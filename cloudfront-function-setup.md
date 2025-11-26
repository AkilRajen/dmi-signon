# CloudFront Function Setup for Cognito Host Header Rewrite

## Problem
Cognito rejects requests from CloudFront because the Host header shows `sso.akilakamal.com` instead of the expected `akilakamal.auth.us-east-1.amazoncognito.com`.

## Solution
Use a CloudFront Function to rewrite the Host header before requests reach Cognito.

---

## Step 1: Create CloudFront Function

1. **Go to AWS CloudFront Console**
2. In the left menu, click **Functions**
3. Click **Create function**
4. Configure:
   ```
   Name: cognito-host-rewrite
   Description: Rewrites Host header for Cognito origin
   ```
5. Click **Create function**

## Step 2: Add Function Code

1. In the **Build** tab, replace the code with:

```javascript
function handler(event) {
    var request = event.request;
    
    // Set the Host header to match the Cognito origin domain
    request.headers['host'] = {
        value: 'akilakamal.auth.us-east-1.amazoncognito.com'
    };
    
    return request;
}
```

2. Click **Save changes**

## Step 3: Publish Function

1. Click the **Publish** tab
2. Click **Publish function**
3. Confirm the publication

## Step 4: Associate with CloudFront Distribution

1. Stay on the **Publish** tab
2. Click **Add association**
3. Configure:
   ```
   Distribution: Select your distribution (sso.akilakamal.com)
   Event type: Viewer request
   Cache behavior: Default (*)
   ```
4. Click **Add association**
5. Wait 2-3 minutes for deployment

## Step 5: Test

Wait 5 minutes after association, then test:

```cmd
curl.exe -I "https://sso.akilakamal.com/oauth2/authorize?client_id=ug4gs38a4d202146ld9i2vv32&response_type=code&scope=openid+email+profile&redirect_uri=http://localhost/dmi-signon"
```

Expected result: `302 Found` redirect to Cognito login page

---

## Alternative: Use Origin Override (Simpler but Less Flexible)

If CloudFront Functions don't work, you can try this workaround:

### Option: Change Origin Request Policy

1. Go to **CloudFront Console** → **Policies** → **Origin request**
2. Click **Create origin request policy**
3. Configure:
   ```
   Name: CognitoOriginRequest
   Description: Forward all except Host header
   
   Headers: All viewer headers except Host
   Cookies: All
   Query strings: All
   ```
4. Save policy
5. Go to your distribution → **Behaviors** → Edit default
6. Set **Origin request policy** to your new policy
7. Save changes

---

## Troubleshooting

### Function not working?

Check CloudFront Function logs:
1. Go to CloudFront Console → Functions
2. Click your function
3. Check **Monitoring** tab for errors

### Still getting 403?

1. Verify function is published (not in draft)
2. Verify association is active
3. Wait 10-15 minutes for full propagation
4. Clear browser cache
5. Try in incognito mode

### Test function locally

In the CloudFront Function editor:
1. Go to **Test** tab
2. Use this test event:
```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/oauth2/authorize",
    "querystring": {
      "client_id": {
        "value": "ug4gs38a4d202146ld9i2vv32"
      }
    },
    "headers": {
      "host": {
        "value": "sso.akilakamal.com"
      }
    }
  }
}
```
3. Click **Test function**
4. Verify output shows Host header changed to Cognito domain
