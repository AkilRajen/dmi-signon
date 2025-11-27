# CloudFront Configuration Checklist for Cognito

## Origin Settings (Origins Tab)

✓ **Origin domain**: `akilakamal.auth.us-east-1.amazoncognito.com`
✓ **Protocol**: HTTPS only
✓ **HTTPS port**: 443
✓ **Minimum origin SSL protocol**: TLSv1.2
✓ **Origin path**: (empty)
✓ **Origin Shield**: Disabled

## Behavior Settings (Behaviors Tab → Default)

✓ **Path pattern**: Default (*)
✓ **Viewer protocol policy**: Redirect HTTP to HTTPS
✓ **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
✓ **Cache policy**: CachingDisabled
✓ **Origin request policy**: AllViewer
✓ **Response headers policy**: SimpleCORS (or CORS-with-preflight)

## Distribution Settings (General Tab)

✓ **Alternate domain names (CNAMEs)**: sso.akilakamal.com
✓ **Custom SSL certificate**: Your ACM certificate for sso.akilakamal.com
✓ **Supported HTTP versions**: HTTP/2 and HTTP/3
✓ **Standard logging**: Off (optional)
✓ **IPv6**: On
✓ **WAF**: None (or disabled)

## Test Commands

After updating settings, wait 5-10 minutes and test:

```cmd
# Test 1: Basic connectivity
curl.exe -I https://sso.akilakamal.com/oauth2/authorize

# Test 2: With query parameters
curl.exe -I "https://sso.akilakamal.com/oauth2/authorize?client_id=ug4gs38a4d202146ld9i2vv32&response_type=code&scope=openid+email+profile&redirect_uri=http://localhost/dmi-signon"

# Test 3: Full OAuth flow (should redirect to login)
curl.exe -L "https://sso.akilakamal.com/oauth2/authorize?client_id=ug4gs38a4d202146ld9i2vv32&response_type=code&scope=openid+email+profile&redirect_uri=http://localhost/dmi-signon"
```

## Common Issues and Solutions

### Issue: 403 Forbidden with query parameters

**Possible causes:**
1. Origin request policy not set to "AllViewer"
2. Response headers policy missing
3. WAF blocking requests
4. CloudFront still deploying

**Solutions:**
- Verify Origin request policy = AllViewer
- Add Response headers policy = SimpleCORS
- Check if WAF is attached (disable if present)
- Wait 10-15 minutes for full deployment

### Issue: 502 Bad Gateway

**Possible causes:**
1. Wrong origin domain
2. Origin not accessible
3. SSL/TLS mismatch

**Solutions:**
- Verify origin domain is correct
- Test origin directly with curl
- Check origin protocol is HTTPS only

### Issue: Redirect loops

**Possible causes:**
1. Cache policy not disabled
2. Cookies not being forwarded

**Solutions:**
- Set Cache policy to CachingDisabled
- Verify Origin request policy forwards all headers/cookies
