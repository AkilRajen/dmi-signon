# SSO Architecture Comparison

## Current Setup (Cognito-Managed CloudFront)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Authentication Flow                          │
└─────────────────────────────────────────────────────────────────────┘

1. User visits website
   ┌──────────────────────┐
   │ dev.akilakamal.com   │
   │  (Your Website)      │
   └──────────┬───────────┘
              │
              │ User clicks "Sign in with Google"
              ▼
   ┌──────────────────────┐
   │ sso.akilakamal.com   │ ◄─── Custom Domain (CNAME in Porkbun)
   │                      │
   │  CloudFront (Auto)   │ ◄─── Managed by AWS Cognito
   │  (Invisible to you)  │      (You don't see this in CloudFront console)
   └──────────┬───────────┘
              │
              │ Proxies to
              ▼
   ┌──────────────────────────────────────────┐
   │ us-east-1k90mwxxsl.auth.us-east-1       │
   │ .amazoncognito.com                       │
   │                                          │
   │  AWS Cognito Hosted UI                   │
   └──────────┬───────────────────────────────┘
              │
              │ Redirects to
              ▼
   ┌──────────────────────┐
   │  Google OAuth         │
   │  accounts.google.com  │
   └──────────┬───────────┘
              │
              │ User authenticates
              ▼
   ┌──────────────────────┐
   │  Google returns       │
   │  authorization code   │
   └──────────┬───────────┘
              │
              │ Redirects back to
              ▼
   ┌──────────────────────┐
   │ dev.akilakamal.com   │
   │  ?code=xxxxx         │
   └──────────┬───────────┘
              │
              │ JavaScript exchanges code for tokens
              ▼
   ┌──────────────────────┐
   │ sso.akilakamal.com   │
   │ /oauth2/token        │
   └──────────┬───────────┘
              │
              │ Returns tokens
              ▼
   ┌──────────────────────┐
   │ User authenticated    │
   │ Form pre-filled       │
   └──────────────────────┘
```

### Components:
- **Porkbun DNS**: CNAME `sso.akilakamal.com` → CloudFront domain (auto-generated)
- **CloudFront**: Automatically created and managed by Cognito
- **ACM Certificate**: Attached to CloudFront by Cognito
- **Cognito**: Handles authentication, manages CloudFront
- **Your Control**: Limited - can't customize CloudFront settings

---

## New Setup (Self-Managed CloudFront)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Authentication Flow                          │
└─────────────────────────────────────────────────────────────────────┘

1. User visits website
   ┌──────────────────────┐
   │ dev.akilakamal.com   │
   │  (Your Website)      │
   └──────────┬───────────┘
              │
              │ User clicks "Sign in with Google"
              ▼
   ┌──────────────────────┐
   │ sso.akilakamal.com   │ ◄─── Custom Domain (CNAME in Porkbun)
   │                      │
   │  CloudFront          │ ◄─── YOU MANAGE THIS
   │  (Your Distribution) │      (Visible in CloudFront console)
   │                      │      • Custom cache policies
   │  [Optional]          │      • Lambda@Edge functions
   │  Lambda@Edge         │      • WAF rules
   │  - Custom logic      │      • Custom error pages
   │  - Logging           │      • Advanced monitoring
   │  - Security rules    │
   └──────────┬───────────┘
              │
              │ Origin request to
              ▼
   ┌──────────────────────────────────────────┐
   │ us-east-1k90mwxxsl.auth.us-east-1       │
   │ .amazoncognito.com                       │
   │                                          │
   │  AWS Cognito Hosted UI                   │
   │  (Using default domain, no custom)       │
   └──────────┬───────────────────────────────┘
              │
              │ Redirects to
              ▼
   ┌──────────────────────┐
   │  Google OAuth         │
   │  accounts.google.com  │
   └──────────┬───────────┘
              │
              │ User authenticates
              ▼
   ┌──────────────────────┐
   │  Google returns       │
   │  authorization code   │
   └──────────┬───────────┘
              │
              │ Redirects back to
              ▼
   ┌──────────────────────┐
   │ dev.akilakamal.com   │
   │  ?code=xxxxx         │
   └──────────┬───────────┘
              │
              │ JavaScript exchanges code for tokens
              ▼
   ┌──────────────────────┐
   │ sso.akilakamal.com   │ ◄─── Goes through YOUR CloudFront
   │ /oauth2/token        │
   └──────────┬───────────┘
              │
              │ Returns tokens
              ▼
   ┌──────────────────────┐
   │ User authenticated    │
   │ Form pre-filled       │
   └──────────────────────┘
```

### Components:
- **Porkbun DNS**: CNAME `sso.akilakamal.com` → Your CloudFront domain
- **CloudFront**: YOU create and manage this distribution
- **ACM Certificate**: YOU attach to your CloudFront distribution
- **Cognito**: Only handles authentication (no custom domain configured)
- **Your Control**: Full control over CloudFront settings

---

## Key Differences

| Aspect | Cognito-Managed | Self-Managed |
|--------|----------------|--------------|
| **CloudFront Visibility** | Hidden (auto-created) | Visible in console |
| **Configuration Control** | Limited | Full control |
| **Cache Policies** | Default only | Custom policies |
| **Lambda@Edge** | Not available | Available |
| **WAF Integration** | Not available | Available |
| **Custom Error Pages** | Not available | Available |
| **Logging** | Basic | Advanced (custom) |
| **Cost** | Included in Cognito | Separate CloudFront billing |
| **Maintenance** | AWS manages | You manage |
| **Setup Complexity** | Simple | More complex |
| **Cognito Domain Config** | Custom domain enabled | Use default domain only |

---

## When to Use Each Approach

### Use Cognito-Managed (Current Setup) If:
- ✓ You want simple setup and maintenance
- ✓ Basic authentication is sufficient
- ✓ You don't need custom caching or security rules
- ✓ You want AWS to handle updates automatically
- ✓ Cost optimization (included in Cognito)

### Use Self-Managed CloudFront If:
- ✓ You need Lambda@Edge for custom authentication logic
- ✓ You want to add WAF rules for security
- ✓ You need custom caching strategies
- ✓ You want detailed CloudFront logs and monitoring
- ✓ You need custom error pages
- ✓ You want full control over the distribution

---

## Recommendation

**For your current use case (basic Google SSO):**
- **Stick with Cognito-Managed** - It's simpler and sufficient

**Consider Self-Managed if you need:**
- Rate limiting with WAF
- Custom authentication logic with Lambda@Edge
- Advanced logging and analytics
- Custom error handling
- Geo-blocking or geo-routing

---

## Migration Path (If You Choose Self-Managed)

1. Create CloudFront distribution pointing to Cognito origin
2. Request/attach ACM certificate
3. Update Porkbun CNAME to new CloudFront domain
4. Remove custom domain from Cognito
5. Test authentication flow
6. Add Lambda@Edge functions (if needed)
7. Configure WAF rules (if needed)

**Estimated Setup Time:** 30-60 minutes
**DNS Propagation:** 5-30 minutes
