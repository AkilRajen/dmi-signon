# Google Authentication with Custom Domain (sso.dmi.ae)

Complete guide to set up Google OAuth authentication using AWS Cognito with custom domain `sso.dmi.ae`.

## Overview

This setup allows users to sign in with Google through a custom branded domain instead of the default Cognito domain.

**Flow:**
1. User clicks "Sign in with Google" on your website
2. Redirects to `https://sso.dmi.ae` (your custom domain)
3. User authenticates with Google
4. Redirects back to your application with tokens

---

## Prerequisites

- AWS Account with Cognito User Pool created
- Domain `dmi.ae` with DNS access
- SSL Certificate in AWS Certificate Manager (ACM) for `sso.dmi.ae`
- Google Cloud Console access

---

## Part 1: Set Up Google OAuth Credentials

### Step 1: Create Google OAuth Client

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select or create a project**
3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `DMI SSO Application`

5. **Configure Authorized redirect URIs**:
   ```
   https://sso.dmi.ae/oauth2/idpresponse
   https://dmi-signon.vercel.app/
   http://localhost/dmi-signon/
   ```

6. **Save and copy**:
   - Client ID: `your-google-client-id.apps.googleusercontent.com`
   - Client Secret: `your-google-client-secret`

---

## Part 2: Request SSL Certificate in ACM

### Step 1: Request Certificate

1. **Go to AWS Certificate Manager** (in **us-east-1** region - required for Cognito)
2. **Click "Request certificate"**
3. **Choose**: Request a public certificate
4. **Domain name**: `sso.dmi.ae`
5. **Validation method**: DNS validation (recommended)
6. **Click "Request"**

### Step 2: Validate Domain

1. **Copy the CNAME record** shown in ACM
2. **Add to your DNS** (Route 53 or your DNS provider):
   ```
   Name: _xxxxx.sso.dmi.ae
   Type: CNAME
   Value: _xxxxx.acm-validations.aws.
   ```
3. **Wait for validation** (5-30 minutes)
4. **Status should change to "Issued"**

---

## Part 3: Configure Cognito Custom Domain

### Step 1: Add Custom Domain to Cognito

1. **Go to AWS Cognito Console**
2. **Select your User Pool**
3. **Go to "App integration" → "Domain"**
4. **Click "Actions" → "Create custom domain"**
5. **Custom domain**: `sso.dmi.ae`
6. **ACM certificate**: Select the certificate you created
7. **Click "Create custom domain"**

### Step 2: Get CloudFront Distribution

After creating the custom domain, Cognito will show:
- **Alias target**: `dxxxxx.cloudfront.net`

Copy this CloudFront domain.

### Step 3: Add DNS Record

Add this record to your DNS:

**For Route 53:**
1. Go to Route 53 → Hosted zones → dmi.ae
2. Create record:
   - Record name: `sso`
   - Record type: `A - IPv4 address`
   - Alias: **Yes**
   - Alias target: Select the CloudFront distribution (or paste `dxxxxx.cloudfront.net`)
   - Click "Create records"

**For other DNS providers:**
```
Name: sso.dmi.ae
Type: CNAME
Value: dxxxxx.cloudfront.net
TTL: 300
```

### Step 4: Wait for DNS Propagation

- Wait 5-60 minutes for DNS to propagate
- Test: `nslookup sso.dmi.ae` should return CloudFront IP

---

## Part 4: Configure Google Identity Provider in Cognito

### Step 1: Add Google as Identity Provider

1. **Go to Cognito User Pool** → **Sign-in experience**
2. **Click "Add identity provider"**
3. **Select "Google"**
4. **Configure**:
   - Client ID: `your-google-client-id.apps.googleusercontent.com`
   - Client secret: `your-google-client-secret`
   - Authorized scopes: `profile email openid`
5. **Attribute mapping**:
   - Google attribute → User pool attribute
   - `email` → `email`
   - `name` → `name`
   - `sub` → `username`
6. **Click "Add identity provider"**

### Step 2: Configure App Client

1. **Go to "App integration" → "App clients"**
2. **Click your app client**
3. **Edit "Hosted UI settings"**:
   - **Allowed callback URLs**:
     ```
     https://dmi-signon.vercel.app/
     http://localhost/dmi-signon/
     ```
   - **Allowed sign-out URLs**: (same as above)
   - **Identity providers**: Check **Google**
   - **OAuth 2.0 grant types**: Check **Authorization code grant**
   - **OpenID Connect scopes**: Check `openid`, `email`, `profile`
4. **Save changes**

---

## Part 5: Update Application Configuration

### Update config.js

```javascript
const CONFIG = {
    cognito: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_XXXXXXXXX',
        clientId: 'your-app-client-id',
        domain: 'sso.dmi.ae', // Custom domain
        redirectUri: window.location.hostname === 'localhost' 
            ? window.location.origin + '/dmi-signon/'
            : window.location.origin + '/',
        responseType: 'code',
        scope: 'openid email profile'
    },
    api: {
        submitLead: 'https://your-api-gateway-url/submit-lead'
    }
};
```

### Update HTML (if needed)

```html
<button id="signin-google" class="btn-social btn-google">
    Sign in with Google
</button>
```

```javascript
$('#signin-google').on('click', function() {
    authPlugin.signIn('Google');
});
```

---

## Part 6: Testing

### Test Custom Domain

1. **Open browser**: https://sso.dmi.ae
2. **Should show**: Cognito hosted UI or redirect to Google
3. **If error**: Check DNS propagation and certificate

### Test Application Flow

1. **Go to**: https://dmi-signon.vercel.app/
2. **Click**: "Sign in with Google"
3. **Should redirect to**: `https://sso.dmi.ae/oauth2/authorize?...`
4. **After Google auth**: Redirects back to your app
5. **Form should appear**: User is authenticated

### Debug Issues

**Test DNS:**
```bash
nslookup sso.dmi.ae
# Should return CloudFront IP addresses
```

**Test SSL:**
```bash
curl -I https://sso.dmi.ae
# Should return 200 or 302, not SSL error
```

**Test Cognito Endpoint:**
```
https://sso.dmi.ae/.well-known/openid-configuration
# Should return JSON with Cognito configuration
```

---

## Troubleshooting

### Issue: "Domain not found" or DNS error

**Solution:**
- Wait longer for DNS propagation (up to 48 hours)
- Verify CNAME/A record is correct
- Check TTL is not too high

### Issue: SSL Certificate error

**Solution:**
- Ensure certificate is in **us-east-1** region
- Certificate must be "Issued" status
- Domain in certificate must match exactly: `sso.dmi.ae`

### Issue: "redirect_uri_mismatch" error

**Solution:**
- Check callback URLs in Cognito App Client settings
- Must include exact URL with trailing slash
- Update Google OAuth credentials with same URLs

### Issue: Custom domain shows "Not found"

**Solution:**
- Wait 15-60 minutes after creating custom domain
- Check CloudFront distribution is deployed
- Verify DNS points to correct CloudFront domain

### Issue: Google login works but form submission fails

**Solution:**
- This is a CORS issue with API Gateway
- See main documentation for CORS configuration
- Ensure Lambda has proper CORS headers

---

## Security Best Practices

1. **Use HTTPS only** - Never use HTTP for authentication
2. **Restrict callback URLs** - Only add trusted domains
3. **Rotate secrets** - Change Google client secret periodically
4. **Monitor logs** - Check CloudWatch for suspicious activity
5. **Enable MFA** - Consider adding multi-factor authentication
6. **Limit scopes** - Only request necessary Google permissions

---

## Cost Considerations

- **ACM Certificate**: Free
- **Cognito Custom Domain**: Free (uses CloudFront)
- **CloudFront**: Minimal cost for authentication redirects
- **Cognito MAU**: First 50,000 users free, then $0.0055/MAU
- **Google OAuth**: Free

---

## Maintenance

### Update Google Credentials

1. Go to Google Cloud Console
2. Update OAuth client settings
3. Update Cognito identity provider with new credentials

### Update Callback URLs

1. Update in Google OAuth client
2. Update in Cognito App Client
3. Deploy updated config.js

### Monitor Certificate Expiration

- ACM auto-renews certificates
- Check ACM console if issues arise
- Ensure DNS validation records remain

---

## Summary

✅ **Custom domain**: `sso.dmi.ae` for branded authentication
✅ **Google OAuth**: Users sign in with Google accounts
✅ **Secure**: SSL/TLS encryption with ACM certificate
✅ **Scalable**: CloudFront handles global traffic
✅ **Cost-effective**: Minimal AWS costs

Your users now have a professional, branded authentication experience at `https://sso.dmi.ae`!
