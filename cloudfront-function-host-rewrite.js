// CloudFront Function to rewrite Host header for Cognito
// This function runs at viewer request to modify the Host header
// before the request is sent to the origin (Cognito)

function handler(event) {
    var request = event.request;
    
    // Set the Host header to match the Cognito origin domain
    request.headers['host'] = {
        value: 'akilakamal.auth.us-east-1.amazoncognito.com'
    };
    
    return request;
}
