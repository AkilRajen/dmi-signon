# Cognito Custom Domain Setup: auth.akilakamal.com

## Quick Setup Guide

---

## Step 1: Request SSL Certificate in ACM

1. **Go to AWS Console** → **Certificate Manager (ACM)**
2. **Verify region: US East (N. Virginia) us-east-1** ⚠️ Important!
3. Click **Request a certificate**
4. Select **Request a public certificate** → **Next**
5. **Domain name**: `auth.akilakamal.com`
6. **Validation method**: DNS validation
7. Click **Request**
8. Click on the certificate ID
9. **Copy the CNAME validation record:**
   ```
   CNAME Name: _abc123.auth.akilakamal.com
   CNAME Value: _xyz789.acm-validations.aws.
   ```
   (Your actual values will be different)

---

## Step 2: Add Validation Record to Porkbun

1. **Log into Porkbun** → Domain: `akilakamal.com` → **DNS**
2. Click **Add Record**
3. Configure:
   ```
   Type: CNAME
   Host: _abc123.auth
   Answer: _xyz789.acm-validations.aws.
   TTL: 600
   ```
   **Note:** Only enter `_abc123.auth` (not the full domain)
4. Click **Add**
5. **Wait 5-15 minutes** for certificate validation
6. Check ACM - status should change to **Issued**

---

## Step 3: Create Cognito Custom Domain

1. **Go to Cognito Console** → Your User Pool: `us-east-1_1gtVWamfZ`
2. Click **App integration** tab
3. Scroll to **Domain** section
4. Click **Actions** → **Create custom domain**
5. Configure:
   ```
   Custom domain: auth.akilakamal.com
   ACM certificate: Select your certificate (status: Issued)
   ```
6. Click **Create custom domain**
7. **Wait 5-10 minutes** for status to change to **Active**
8. **Copy the Alias target** (CloudFront domain):
   ```
   Example: d1234abcd5678.cloudfront.net
   ```

---

## Step 4: Add CNAME Record for Custom Domain

1. **Go back to Porkbun** → `akilakamal.com` → **DNS**
2. Click **Add Record**
3. Configure:
   ```
   Type: CNAME
   Host: auth
   Answer: d1234abcd5678.cloudfront.net
   TTL: 600
   ```
   **Note:** 
   - Host: Just `auth` (Porkbun adds `.akilakamal.com` automatically)
   - Answer: The CloudFront alias from Cognito (step 3)
4. Click **Add**

---

## Step 5: Update Your Code

Update `config.js`:

```javascript
const CONFIG = {
    cognito: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_1gtVWamfZ',
        clientId: 'ug4gs38a4d202146ld9i2vv32',
        domain: 'auth.akilakamal.com',  // ← Changed from sso to auth
        redirectUri: (function() {
            const uri = window.location.hostname === 'localhost' 
                ? window.location.origin + '/dmi-signon'
                : 'https://dev.akilakamal.com';
            console.log('Redirect URI set to:', uri);
            return uri;
        })(),
        responseType: 'code',
        scope: 'openid email profile'
    },
    api: {
        submitLead: 'https://1lwvjovcaj.execute-api.us-east-1.amazonaws.com/submit-lead'
    }
};
```

---

## Step 6: Update Callback URLs in Cognito

1. **Cognito Console** → User Pool → **App integration** → **App clients**
2. Click your app client: `ug4gs38a4d202146ld9i2vv32`
3. Click **Edit** under Hosted UI
4. **Allowed callback URLs**:
   ```
   https://dev.akilakamal.com
   http://localhost/dmi-signon
   ```
5. **Allowed sign-out URLs**:
   ```
   https://dev.akilakamal.com
   http://localhost/dmi-signon
   ```
6. Click **Save changes**

---

## Step 7: Test

### Test DNS Resolution
```cmd
nslookup auth.akilakamal.com
```
Should return CloudFront IPs ✓

### Test HTTPS
```cmd
curl.exe -I https://auth.akilakamal.com/oauth2/authorize
```
Should return `302 Found` ✓

### Test Full OAuth Flow
```cmd
curl.exe -I "https://auth.akilakamal.com/oauth2/authorize?client_id=ug4gs38a4d202146ld9i2vv32&response_type=code&scope=openid+email+profile&redirect_uri=https://dev.akilakamal.com"
```
Should redirect to login page ✓

### Test in Browser
1. Deploy updated config: `.\deploy.ps1`
2. Clear cache: `Ctrl + Shift + R`
3. Visit: `http://localhost/dmi-signon/index.html`
4. Click **Sign in with Google**
5. Should redirect to `https://auth.akilakamal.com`

---

## Final DNS Records in Porkbun

You'll have 2 CNAME records:

### 1. ACM Validation (can delete after certificate is issued)
```
Type: CNAME
Host: _abc123.auth
Answer: _xyz789.acm-validations.aws.
```

### 2. Custom Domain (permanent)
```
Type: CNAME
Host: auth
Answer: d1234abcd5678.cloudfront.net
```

---

## Summary

✓ **Domain**: `auth.akilakamal.com`
✓ **SSL Certificate**: Free from ACM
✓ **CloudFront**: Managed by Cognito (free)
✓ **Cost**: $0.00
✓ **Setup time**: 30 minutes
✓ **Maintenance**: Automatic

---

## Troubleshooting

### Certificate stuck in "Pending validation"
- Verify CNAME record in Porkbun
- Wait 15 minutes for DNS propagation
- Check: `nslookup _abc123.auth.akilakamal.com`

### Custom domain stuck in "Creating"
- Verify certificate status is "Issued"
- Verify certificate is in us-east-1 region
- Wait 10-15 minutes

### DNS not resolving
- Verify CNAME record: `auth` → CloudFront domain
- Wait 30 minutes for DNS propagation
- Clear DNS cache: `ipconfig /flushdns`

### 403 or 502 errors
- Wait 30 minutes after DNS changes
- Verify callback URLs in Cognito
- Clear browser cache

---

## Next Steps

1. Follow steps 1-7 above
2. Update and deploy your code
3. Test authentication flow
4. You're done! 🎉
