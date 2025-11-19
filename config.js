// AWS Cognito Configuration
// Replace these values with your actual AWS Cognito settings
const CONFIG = {
    cognito: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_k90mwXxsL',
        clientId: '26uhgsh1bjf8bvjo2r5nuvksu1',
        domain: 'us-east-1k90mwxxsl.auth.us-east-1.amazoncognito.com',
        // Use exact URL that matches your Cognito App Client configuration
        // Automatically detect environment
        redirectUri: window.location.origin + window.location.pathname,
        responseType: 'code',
        scope: 'openid email profile'
    },
    api: {
        // Lambda API Gateway endpoints
        getFormFields: 'https://my-json-server.typicode.com/AkilRajen/mock-crm-api/form-fields',
        submitForm: 'https://my-json-server.typicode.com/AkilRajen/mock-crm-api/submissions'
    }
};
