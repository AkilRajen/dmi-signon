# Self-Managed CloudFront Setup Guide for SSO

## Prerequisites
- AWS Account with access to CloudFront, Cognito, and ACM
- Domain registered in Porkbun: `akilakamal.com`
- Cognito User Pool: `us-east-1_1gtVWamfZ`
- Cognito App Client: `ug4gs38a4d202146ld9i2vv32`

---

## Phase 1: Prepare Cognito (Remove Custom Domain)

### Step 1.1: Remove Custom Domain from Cognito

1. Go to **AWS Console** → **Cognito**
2. Select your User Pool: `us-east-1_1gtVWamfZ`
3. Click **App integration** tab
4. Scroll to **Domain** section
5. If `sso.akilakamal.com` is configured:
   - Click **Actions** → **Delete custom domain**
   - Confirm deletion
6. Note your **default Cognito domain**: `us-east-1k90mwxxsl.auth.us-east-1.amazoncognito.com`

**Important:** Keep this domain - it's your CloudFront origin!

---

## Phase 2: Create CloudFront Distribution

### Step 2.1: Start Creating Distribution

1. Go to **AWS Console** → **CloudFront**
2. Click **Create distribution**

### Step 2.2: Configure Origin

**Origin Settings:**
```
Origin domain: us-east-1k90mwxxsl.auth.us-east-1.amazoncognito.com
Protocol: HTTPS only
HTTPS port: 443
Minimum origin SSL protocol: TLSv1.2
Origin path: (leave empty)
Name: cognito-auth-origin
Add custom header: (none needed)
Enable Origin Shield: No
```

### Step 2.3: Configure Default Cache Behavior

**Cache Behavior Settings:**
```
Path pattern: Default (*)
Compress objects automatically: Yes
Viewer protocol policy: Redirect HTTP to HTTPS
Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
Restrict viewer access: No
```

**Cache Key and Origin Requests:**
```
Cache policy: CachingDisabled
Origin request policy: AllViewer
Response headers policy: SimpleCORS (optional)
```

**Why CachingDisabled?**
- Authentication responses should NOT be cached
- Each request needs to go to Cognito
- Prevents stale authentication data

### Step 2.4: Configure Distribution Settings

**Settings:**
```
Price class: Use all edge locations (best performance)
AWS WAF web ACL: None (can add later)
Alternate domain name (CNAME): sso.akilakamal.com
Custom SSL certificate: Select your ACM certificate for sso.akilakamal.com
  (If you don't have one, see Phase 3 below)
Supported HTTP versions: HTTP/2 and HTTP/3
Standard logging: Off (can enable later)
IPv6: On
```

**Security Settings:**
```
Security policy: TLSv1.2_2021 (recommended)
```

### Step 2.5: Create Distribution

1. Click **Create distribution**
2. Wait for deployment (Status: "Deploying" → "Enabled")
3. **Copy the Distribution domain name** (e.g., `d1234abcd.cloudfront.net`)
4. **Copy the Distribution ID** (e.g., `E1234ABCD5678`)

**Deployment time:** 5-15 minutes

---

## Phase 3: SSL Certificate (If Not Already Created)

### Step 3.1: Request Certificate in ACM

**IMPORTANT:** Must be in **us-east-1** region for CloudFront!

1. Go to **AWS Console** → **Certificate Manager**
2. **Ensure you're in us-east-1 region** (top right)
3. Click **Request certificate**
4. Select **Request a public certificate** → **Next**

### Step 3.2: Configure Certificate

```
Domain names: sso.akilakamal.com
Validation method: DNS validation - recommended
Key algorithm: RSA 2048
Tags: (optional)
  Key: Name
  Value: SSO Domain Certificate
```

5. Click **Request**

### Step 3.3: Validate Domain

1. Click on the certificate ID
2. Under **Domains**, you'll see CNAME records for validation
3. Click **Create records in Route 53** (if using Route 53)
   OR manually copy the CNAME details:

```
CNAME Name: _abc123def456.sso.akilakamal.com
CNAME Value: _xyz789.acm-validations.aws.
```

### Step 3.4: Add Validation Record to Porkbun

1. Log into **Porkbun**
2. Go to domain: `akilakamal.com`
3. Click **DNS**
4. Add new record:
   ```
   Type: CNAME
   Host: _abc123def456.sso
   Answer: _xyz789.acm-validations.aws.
   TTL: 600
   ```
5. Click **Add**

### Step 3.5: Wait for Validation

1. Go back to ACM in AWS Console
2. Refresh the page every few minutes
3. Status will change: **Pending validation** → **Issued**
4. Usually takes 5-15 minutes

### Step 3.6: Attach Certificate to CloudFront

1. Go back to **CloudFront** → Your distribution
2. Click **Edit**
3. Under **Custom SSL certificate**, select your newly issued certificate
4. Click **Save changes**

---

## Phase 4: Update DNS in Porkbun

### Step 4.1: Update CNAME Record

1. Log into **Porkbun**
2. Go to domain: `akilakamal.com`
3. Find the existing CNAME record for `sso`
4. **Edit** the record:
   ```
   Type: CNAME
   Host: sso
   Answer: d1234abcd.cloudfront.net  (your CloudFront domain)
   TTL: 600
   ```
5. Click **Save**

**DNS Propagation:** 5-30 minutes

---

## Phase 5: Verify Setup

### Step 5.1: Check CloudFront Status

1. Go to **CloudFront** console
2. Your distribution status should be **Enabled**
3. Last modified should show recent timestamp

### Step 5.2: Test DNS Resolution

Open Command Prompt and run:
```cmd
nslookup sso.akilakamal.com
```

Should return CloudFront IP addresses.

### Step 5.3: Test HTTPS

Open browser and visit:
```
https://sso.akilakamal.com
```

You should see a Cognito error page (this is normal - means CloudFront is working).

### Step 5.4: Test Authentication Flow

1. Clear browser cache: `Ctrl + Shift + R`
2. Visit: `http://localhost/dmi-signon/index.html`
3. Click **Sign in with Google**
4. Should redirect to `https://sso.akilakamal.com/oauth2/authorize?...`
5. Complete Google sign-in
6. Should redirect back with form pre-filled

---

## Phase 6: Verify Configuration

### Step 6.1: Check Cognito Callback URLs

1. Go to **Cognito** → Your User Pool
2. **App integration** → **App clients** → Click your client
3. Verify **Allowed callback URLs**:
   ```
   https://dev.akilakamal.com
   http://localhost/dmi-signon
   ```

### Step 6.2: Check Your Code

Your `config.js` should have:
```javascript
domain: 'sso.akilakamal.com',
```

No code changes needed!

---

## Phase 7: Optional Enhancements

### Option 1: Enable CloudFront Logging

1. Go to your CloudFront distribution
2. Click **Edit**
3. Under **Standard logging**:
   ```
   Enable: Yes
   S3 bucket: Create new bucket or select existing
   Log prefix: cloudfront-sso/
   ```
4. Click **Save changes**

### Option 2: Add WAF (Web Application Firewall)

1. Go to **AWS WAF** console
2. Create Web ACL
3. Add rules:
   - Rate limiting (e.g., 100 requests per 5 minutes)
   - Geo-blocking (if needed)
   - IP reputation lists
4. Associate with CloudFront distribution

### Option 3: Add Lambda@Edge

**Use cases:**
- Custom authentication logic
- Request/response manipulation
- A/B testing
- Security headers

**Example: Add Security Headers**

1. Go to **Lambda** console (must be in us-east-1)
2. Create function:
   ```
   Name: cloudfront-security-headers
   Runtime: Node.js 18.x
   ```
3. Add code (see example below)
4. Publish version
5. Add trigger: CloudFront (select your distribution)
6. CloudFront event: Origin response

**Lambda@Edge Example Code:**
```javascript
exports.handler = async (event) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;
    
    // Add security headers
    headers['strict-transport-security'] = [{
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
    }];
    headers['x-content-type-options'] = [{
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    }];
    headers['x-frame-options'] = [{
        key: 'X-Frame-Options',
        value: 'DENY'
    }];
    
    return response;
};
```

---

## Troubleshooting

### Issue: "Invalid client" error

**Solution:**
- Verify client ID in config.js matches Cognito
- Check app client is enabled in Cognito

### Issue: "Redirect URI mismatch"

**Solution:**
- Verify callback URLs in Cognito match exactly
- Check for trailing slashes
- Clear browser cache

### Issue: CloudFront returns 502/504 error

**Solution:**
- Verify origin domain is correct
- Check Cognito domain is accessible
- Wait for CloudFront deployment to complete

### Issue: SSL certificate error

**Solution:**
- Verify certificate is in us-east-1 region
- Check certificate status is "Issued"
- Verify alternate domain name matches certificate

### Issue: DNS not resolving

**Solution:**
- Wait for DNS propagation (up to 48 hours, usually 5-30 min)
- Check CNAME record in Porkbun is correct
- Use `nslookup sso.akilakamal.com` to verify

---

## Monitoring and Maintenance

### CloudFront Metrics to Monitor

1. **Requests**: Total number of requests
2. **Error Rate**: 4xx and 5xx errors
3. **Cache Hit Rate**: Should be low (caching disabled)
4. **Origin Latency**: Response time from Cognito

### Regular Maintenance Tasks

- Review CloudFront logs monthly
- Check for unusual traffic patterns
- Update SSL certificate before expiration (auto-renewed by ACM)
- Review and update WAF rules as needed

---

## Cost Estimation

**CloudFront Costs:**
- Data transfer out: ~$0.085/GB (first 10 TB)
- HTTPS requests: $0.01 per 10,000 requests
- Lambda@Edge: $0.60 per 1M requests (if used)

**Example for 10,000 users/month:**
- Requests: ~50,000 (5 per user)
- Data transfer: ~0.5 GB
- **Estimated cost: $0.50 - $1.00/month**

---

## Rollback Plan

If you need to revert to Cognito-managed CloudFront:

1. Go to **Cognito** → **Domain** → **Create custom domain**
2. Enter: `sso.akilakamal.com`
3. Select ACM certificate
4. Copy the CloudFront alias target
5. Update Porkbun CNAME to point to Cognito's CloudFront
6. Delete your self-managed CloudFront distribution

---

## Summary Checklist

- [ ] Remove custom domain from Cognito
- [ ] Create CloudFront distribution
- [ ] Configure origin (Cognito domain)
- [ ] Set cache policy to CachingDisabled
- [ ] Request/attach ACM certificate (us-east-1)
- [ ] Add alternate domain name (sso.akilakamal.com)
- [ ] Update Porkbun CNAME record
- [ ] Wait for DNS propagation
- [ ] Test authentication flow
- [ ] (Optional) Enable logging
- [ ] (Optional) Add WAF rules
- [ ] (Optional) Add Lambda@Edge functions

---

## Next Steps

After completing this setup, you have full control over:
- Caching strategies
- Security rules (WAF)
- Custom logic (Lambda@Edge)
- Logging and monitoring
- Error handling

**Ready to proceed?** Start with Phase 1!
