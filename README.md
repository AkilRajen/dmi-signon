# Corporate Website SSO Integration Demo

A simple demo project showing AWS Cognito social identity authentication with form workflow.

## Features

- **Standalone Auth Plugin**: Reusable authentication module that can be attached to any website
- **AWS Cognito Social Login**: Supports Google, Facebook, Amazon, and other social providers
- **Dynamic Form Loading**: Form fields retrieved from CRM via Lambda
- **Form Submission**: Data submitted to CRM through Lambda API

## Project Structure

```
├── index.html              # Main HTML page
├── styles.css              # Styling
├── config.js               # Configuration (Cognito & API endpoints)
├── auth-plugin.js          # Standalone authentication plugin
├── app.js                  # Main application logic with jQuery
├── lambda-get-form-fields.js   # Lambda function to get form fields
└── lambda-submit-form.js       # Lambda function to submit form
```

## Setup Instructions

### 1. AWS Cognito Setup

1. **Create User Pool**:
   - Go to AWS Cognito Console
   - Create a new User Pool
   - Note the User Pool ID and Region

2. **Configure App Client**:
   - Create an App Client
   - Enable "Authorization code grant" flow
   - Note the App Client ID
   - Add callback URL: `http://localhost:8080/index.html` (or your domain)
   - Add sign-out URL: `http://localhost:8080/index.html`

3. **Configure Hosted UI Domain**:
   - Set up a Cognito domain (e.g., `your-app.auth.us-east-1.amazoncognito.com`)

4. **Add Social Identity Providers**:
   - Go to "Identity providers" in your User Pool
   - Add Google, Facebook, or other providers
   - Configure OAuth scopes: `openid`, `email`, `profile`

### 2. Update Configuration

Edit `config.js` with your AWS settings:

```javascript
const CONFIG = {
    cognito: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_XXXXXXXXX',
        clientId: 'your-app-client-id',
        domain: 'your-domain.auth.us-east-1.amazoncognito.com',
        redirectUri: 'http://localhost:8080/index.html'
    },
    api: {
        getFormFields: 'https://your-api.execute-api.us-east-1.amazonaws.com/prod/form-fields',
        submitForm: 'https://your-api.execute-api.us-east-1.amazonaws.com/prod/submit-ad'
    }
};
```

### 3. Deploy Lambda Functions

1. **Create Lambda Functions**:
   - Create two Lambda functions in AWS Console
   - Use Node.js runtime
   - Copy code from `lambda-get-form-fields.js` and `lambda-submit-form.js`

2. **Create API Gateway**:
   - Create REST API in API Gateway
   - Create two endpoints: `/form-fields` (GET) and `/submit-ad` (POST)
   - Link to Lambda functions
   - Enable CORS
   - Add Cognito authorizer for security

3. **Update Lambda Code**:
   - Replace mock responses with actual CRM API integration
   - Add necessary environment variables for CRM credentials

### 4. Run Locally

```bash
# Simple HTTP server (Python)
python -m http.server 8080

# Or use Node.js
npx http-server -p 8080
```

Visit: `http://localhost:8080`

## How It Works

### Authentication Flow

1. User clicks "Sign In" button
2. Redirected to Cognito Hosted UI
3. User selects social provider (Google, Facebook, etc.)
4. After authentication, redirected back with authorization code
5. Plugin exchanges code for JWT tokens
6. Tokens stored in sessionStorage

### Form Workflow

1. After successful login, form section appears
2. jQuery AJAX call to Lambda function retrieves form fields from CRM
3. Form rendered dynamically based on CRM response
4. User fills and submits form
5. jQuery AJAX POST to Lambda function
6. Lambda submits data to CRM
7. Success message displayed

## jQuery Usage

The project uses jQuery for:
- DOM manipulation
- AJAX calls to Lambda APIs
- Event handling
- Form serialization

Example sign-in call:
```javascript
$('#signin-btn').on('click', function() {
    authPlugin.signIn();
});
```

Example AJAX call:
```javascript
$.ajax({
    url: CONFIG.api.getFormFields,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${idToken}`
    },
    success: function(response) {
        renderFormFields(response.fields);
    }
});
```

## Reusable Auth Plugin

The `auth-plugin.js` is designed to be standalone and can be integrated into any website:

```javascript
// Initialize
const authPlugin = new CognitoAuthPlugin(cognitoConfig);
authPlugin.init();

// Set callbacks
authPlugin.onAuthSuccess = function(user) {
    console.log('User logged in:', user);
};

// Sign in
authPlugin.signIn();

// Check authentication
if (authPlugin.isAuthenticated()) {
    const user = authPlugin.getCurrentUser();
    const token = authPlugin.getIdToken();
}

// Sign out
authPlugin.signOut();
```

## Security Notes

- JWT tokens stored in sessionStorage (cleared on browser close)
- All API calls include Authorization header with Bearer token
- Lambda functions should verify JWT tokens
- Enable CORS only for trusted domains in production
- Use HTTPS in production

## Next Steps

1. Replace mock Lambda responses with actual CRM API integration
2. Add error handling and validation
3. Implement token refresh logic
4. Add loading indicators
5. Deploy to production environment
6. Configure production Cognito callback URLs
7. Set up CloudWatch logging for Lambda functions

## Production Considerations

- Use environment variables for sensitive configuration
- Implement proper error handling
- Add rate limiting
- Set up monitoring and alerts
- Use CDN for static assets
- Implement token refresh mechanism
- Add comprehensive logging
