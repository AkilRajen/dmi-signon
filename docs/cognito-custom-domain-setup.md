# Cognito Custom Domain Setup Guide
## Complete Guide for sso.akilakamal.com

---

## Overview

This guide shows you how to set up `sso.akilakamal.com` as a custom domain for AWS Cognito, which automatically creates and manages a CloudFront distribution for you.

**Benefits:**
- ✓ AWS manages CloudFront automatically
- ✓ No Lambda@Edge needed
- ✓ No function errors
- ✓ Free (included with Cognito)
- ✓ Production-ready in 30 minutes

---

## Prerequisites

- Domain registered in Porkbun: `akilakamal.com`
- AWS Cognito User Pool: `us-east-1_1gtVWamfZ`
- AWS Account with access to ACM, Cognito, and Porkbun DNS

---

## Step 1: Request SSL Certificate in ACM

**IMPORTANT:** Certificate must be in **us-east-1** region for Cognito custom domains.

### 1.1 Go to Certificate Manager

1. **Open AWS Console** → Search for "Certificate Manager" or "ACM"
2. **Verify region is "US East (N. Virginia)"** in top right
3. Click **Request a certificate**

### 1.2 Configure Certificate

1. Select **Request a public certificate**
2. Click **Next**
3. **Domain names**: Enter `sso.akilakamal.com`
4. **Validation method**: Select **DNS validation - recommended**
5. **Key algorithm**: RSA 2048
6. Click **Request**

### 1.3 Get Validation CNAME Record

1. Click on the certificate ID (will show "Pending validation")
2. Under **Domains** section, you'll see validation details
3. Note the CNAME record:
   ```
   CNAME Name: _abc123def456.sso.akilakamal.com
   CNAME Value: _xyz789.acm-validations.aws.
   ```
   (Your actual values will be different)

---

## Step 2: Add Validation Record to Porkbun

### 2.1 Log into Porkbun

1. Go to https://porkbun.com
2. Log in to your account
3. Click on domain: `akilakamal.com`
4. Click **DNS** tab

### 2.2 Add CNAME Record for Validation

1. Click **Add** or **Add Record**
2. Configure:
   ```
   Type: CNAME
   Host: _abc123def456.sso
   Answer: _xyz789.acm-validations.aws.
   TTL: 600
   ```
   
   **Important Notes:**
   - For **Host**, only enter the part before `.akilakamal.com`
   - Example: If ACM shows `_abc123def456.sso.akilakamal.com`, enter `_abc123def456.sso`
   - Copy the **Answer** value exactly as shown in ACM (including trailing dot)

3. Click **Add** or **Save**

### 2.3 Wait for Validation

1. Go back to **AWS ACM Console**
2. Refresh the certificate page every few minutes
3. Status will change: **Pending validation** → **Issued**
4. Usually takes **5-15 minutes**

---

## Step 3: Create Cognito Custom Domain

### 3.1 Go to Cognito Console

1. **Open AWS Console** → Search for "Cognito"
2. Click **User pools**
3. Select your user pool: `us-east-1_1gtVWamfZ`
4. Click **App integration** tab

### 3.2 Create Custom Domain

1. Scroll down to **Domain** section
2. Click **Actions** → **Create custom domain**
3. Configure:
   ```
   Custom domain: sso.akilakamal.com
   ACM certificate: Select your certificate (should show "Issued" status)
   ```
4. Click **Create custom domain**

### 3.3 Get CloudFront Alias Target

1. After creation, you'll see the domain status: **Creating** → **Active** (takes 5-10 minutes)
2. Once **Active**, note the **Alias target** (CloudFront domain)
3. It will look like: `d1234abcd5678.cloudfront.net`
4. **Copy this value** - you'll need it for DNS

---

## Step 4: Add CNAME Record for Custom Domain

### 4.1 Add DNS Record in Porkbun

1. Go back to **Porkbun** → `akilakamal.com` → **DNS**
2. Click **Add Record**
3. Configure:
   ```
   Type: CNAME
   Host: sso
   Answer: d1234abcd5678.cloudfront.net
   TTL: 600
   ```
   
   **Important:**
   - For **Host**, enter just `sso` (Porkbun adds `.akilakamal.com` automatically)
   - For **Answer**, paste the CloudFront alias target from Cognito
   - Do NOT include `https://` in the Answer field

4. Click **Add** or **Save**

---

## Step 5: Wait for DNS Propagation

DNS changes can take **5-30 minutes** to propagate globally.

### 5.1 Check DNS Resolution

Open Command Prompt and run:

```cmd
nslookup sso.akilakamal.com
```

**Expected output:**
```
Name:    d1234abcd5678.cloudfront.net
Addresses:  [CloudFront IP addresses]
Aliases:  sso.akilakamal.com
```

If you see CloudFront IPs, DNS is working! ✓

---

## Step 6: Verify Cognito Domain Status

1. **Go to Cognito Console** → Your User Pool → **App integration** → **Domain**
2. Status should show: **Active**
3. Domain: `sso.akilakamal.com`
4. Alias target: `d1234abcd5678.cloudfront.net`

---

## Step 7: Update App Client Callback URLs

### 7.1 Configure Callback URLs

1. In Cognito User Pool, go to **App integration** tab
2. Scroll to **App clients and analytics**
3. Click on your app client: `ug4gs38a4d202146ld9i2vv32`
4. Click **Edit** under **Hosted UI**
5. Update **Allowed callback URLs**:
   ```
   https://dev.akilakamal.com
   http://localhost/dmi-signon
   ```
6. Update **Allowed sign-out URLs**:
   ```
   https://dev.akilakamal.com
   http://localhost/dmi-signon
   ```
7. Click **Save changes**

---

## Step 8: Test the Setup

### 8.1 Test with curl

```cmd
curl.exe -I https://sso.akilakamal.com/oauth2/authorize
```

**Expected:** `302 Found` redirect (not 403 or 502)

### 8.2 Test Full OAuth Flow

```cmd
curl.exe -I "https://sso.akilakamal.com/oauth2/authorize?client_id=ug4gs38a4d202146ld9i2vv32&response_type=code&scope=openid+email+profile&redirect_uri=https://dev.akilakamal.com"
```

**Expected:** `302 Found` redirect to Cognito login page

### 8.3 Test in Browser

1. Clear browser cache: `Ctrl + Shift + R`
2. Visit: `http://localhost/dmi-signon/index.html`
3. Click **Sign in with Google**
4. Should redirect to: `https://sso.akilakamal.com/oauth2/authorize?...`
5. Then to Google sign-in page
6. After signing in, redirects back with form pre-filled

---

## DNS Records Summary

After completing all steps, you should have these DNS records in Porkbun:

### Record 1: ACM Validation (Temporary - can delete after certificate is issued)
```
Type: CNAME
Host: _abc123def456.sso
Answer: _xyz789.acm-validations.aws.
TTL: 600
```

### Record 2: Custom Domain (Permanent)
```
Type: CNAME
Host: sso
Answer: d1234abcd5678.cloudfront.net
TTL: 600
```

---

## Troubleshooting

### Issue: Certificate stuck in "Pending validation"

**Causes:**
- CNAME record not added correctly
- DNS not propagated yet
- Wrong CNAME value

**Solutions:**
1. Verify CNAME record in Porkbun matches ACM exactly
2. Wait 15-30 minutes for DNS propagation
3. Use `nslookup _abc123def456.sso.akilakamal.com` to verify

### Issue: Custom domain shows "Creating" for too long

**Causes:**
- Certificate not issued yet
- Wrong certificate selected
- Certificate not in us-east-1

**Solutions:**
1. Verify certificate status is "Issued"
2. Verify certificate is in us-east-1 region
3. Wait 10-15 minutes

### Issue: DNS not resolving to CloudFront

**Causes:**
- CNAME record not added
- Wrong CloudFront alias target
- DNS not propagated

**Solutions:**
1. Verify CNAME record exists in Porkbun
2. Verify Answer matches Cognito's alias target exactly
3. Wait 30 minutes for DNS propagation
4. Try `nslookup sso.akilakamal.com` to check

### Issue: 403 or 502 errors

**Causes:**
- DNS not fully propagated
- CloudFront still deploying
- Callback URLs not configured

**Solutions:**
1. Wait 30 minutes after DNS changes
2. Verify callback URLs in Cognito app client
3. Clear browser cache and try again

### Issue: "Redirect URI mismatch" error

**Causes:**
- Callback URL not added to Cognito
- Trailing slash mismatch
- Wrong protocol (http vs https)

**Solutions:**
1. Add exact callback URL to Cognito app client
2. Match trailing slashes exactly
3. Use https:// for production URLs

---

## Verification Checklist

- [ ] ACM certificate status: **Issued**
- [ ] ACM certificate region: **us-east-1**
- [ ] Cognito custom domain status: **Active**
- [ ] DNS CNAME record added in Porkbun
- [ ] `nslookup sso.akilakamal.com` returns CloudFront IPs
- [ ] `curl https://sso.akilakamal.com` returns 302 redirect
- [ ] Callback URLs configured in Cognito app client
- [ ] Browser test: Sign in with Google works

---

## Cost

**Total cost: $0.00**

- ACM certificate: Free
- Cognito custom domain: Free
- CloudFront (managed by Cognito): Included
- DNS (Porkbun): Included with domain

---

## Maintenance

### Certificate Renewal

ACM automatically renews certificates before expiration. No action needed.

### DNS Changes

If you need to change the custom domain:
1. Delete custom domain in Cognito
2. Update DNS CNAME in Porkbun
3. Create new custom domain in Cognito

### Monitoring

Check Cognito domain status periodically:
- Cognito Console → User Pool → App integration → Domain
- Should always show: **Active**

---

## Next Steps

After setup is complete:

1. **Deploy your application** with the updated config
2. **Test authentication** thoroughly
3. **Monitor CloudWatch logs** for any issues
4. **Set up production domain** (if dev.akilakamal.com is not production)

---

## Support

If you encounter issues:

1. Check AWS CloudWatch logs
2. Verify DNS with `nslookup`
3. Test with `curl` commands
4. Check Cognito domain status
5. Review callback URLs configuration

---

## Summary

You now have:
- ✓ Custom domain: `sso.akilakamal.com`
- ✓ SSL certificate from ACM
- ✓ CloudFront distribution (managed by Cognito)
- ✓ DNS configured in Porkbun
- ✓ Ready for production use

**Total setup time: 30-45 minutes**
**Cost: $0.00**
**Maintenance: Automatic**
