// AWS Cognito Configuration
// Replace these values with your actual AWS Cognito settings

// Debug: Log current location
console.log('Current location:', window.location.href);
console.log('Origin:', window.location.origin);
console.log('Hostname:', window.location.hostname);

const CONFIG = {
    cognito: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_k90mwXxsL',
        clientId: '26uhgsh1bjf8bvjo2r5nuvksu1',
        domain: 'us-east-1k90mwxxsl.auth.us-east-1.amazoncognito.com',
        // Use exact URL that matches your Cognito App Client configuration
        // Automatically detect environment (localhost uses /dmi-signon/, Vercel uses root)
        redirectUri: (function() {
            const uri = window.location.hostname === 'localhost' 
                ? window.location.origin + '/dmi-signon/'
                : window.location.origin + '/';
            console.log('Redirect URI set to:', uri);
            return uri;
        })(),
        responseType: 'code',
        scope: 'openid email profile'
    },
    api: {
        // Lambda API Gateway endpoint for form submission
        submitForm: 'https://your-api-gateway.execute-api.us-east-1.amazonaws.com/prod/submit-lead'
    }
};
