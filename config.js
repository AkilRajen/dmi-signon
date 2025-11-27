// AWS Cognito Configuration
// Replace these values with your actual AWS Cognito settings

// Debug: Log current location
console.log('Current location:', window.location.href);
console.log('Origin:', window.location.origin);
console.log('Hostname:', window.location.hostname);

const CONFIG = {
    cognito: {
        region: 'me-central-1',
        userPoolId: 'me-central-1_12eiiqudq',
        clientId: '7elmfckj8l45ohqp2r09kbenj5',
        // Use CloudFront distribution domain instead of direct Cognito domain
        domain: 'me-central-112eiiqudq.auth.me-central-1.amazoncognito.com',
        // Redirect back to sso.dmi.ae after authentication
        redirectUri: (function() {
            const uri = window.location.hostname === 'localhost' 
                ? window.location.origin + '/dmi-signon'
                : 'https://assets.dmi.ae';
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
