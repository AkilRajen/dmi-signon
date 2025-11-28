// AWS Cognito Configuration
// Replace these values with your actual AWS Cognito settings

// Debug: Log current location
console.log('Current location:', window.location.href);
console.log('Origin:', window.location.origin);
console.log('Hostname:', window.location.hostname);

const CONFIG = {
    cognito: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_1gtVWamfZ',
        clientId: 'ug4gs38a4d202146ld9i2vv32',
        // Use CloudFront distribution domain instead of direct Cognito domain
        domain: 'sso.akilakamal.com',
        // Redirect back to sso.dmi.ae after authentication
        redirectUri: (function() {
            const uri = window.location.hostname === 'localhost' 
                ? window.location.origin + '/dmi-signon'
                : 'https://sso.akilakamal.com';
            console.log('Redirect URI set to:', uri);
            return uri;
        })(),
        responseType: 'code',
        scope: 'openid email profile'
    },
    api: {
        // AWS Lambda API Gateway endpoint
        submitLead: 'https://1lwvjovcaj.execute-api.us-east-1.amazonaws.com/submit-lead'
    }
};
