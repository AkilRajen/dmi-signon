/**
 * AWS Lambda Function: Submit Lead to Dynamics 365 CRM
 * This function acts as a proxy between the frontend and Dynamics CRM
 * 
 * Runtime: Node.js 18.x or later
 * Handler: index.handler
 */

import https from 'https';

// Get configuration from environment variables
const CRM_BASE_URL = process.env.CRM_BASE_URL || 'dmi-uat.crm15.dynamics.com';
const CREATE_LEAD_ENDPOINT = process.env.CREATE_LEAD_ENDPOINT || '/api/data/v9.2/titc_CreateClassifiedB2BLead';

// Azure AD OAuth Configuration from environment variables
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_SCOPE = process.env.AZURE_SCOPE || `https://${CRM_BASE_URL}/.default`;

export const handler = async (event) => {
    console.log('=== LAMBDA INVOKED ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // CORS headers - must be present in all responses
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Max-Age': '300',
        'Content-Type': 'application/json'
    };
    
    // Detect HTTP method (supports both REST API and HTTP API formats)
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
    console.log('HTTP Method detected:', httpMethod);
    
    // Handle preflight OPTIONS request
    if (httpMethod === 'OPTIONS') {
        console.log('✓ Handling OPTIONS preflight request');
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ message: 'CORS preflight successful' })
        };
    }
    
    // Validate required environment variables for POST requests
    if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
        console.error('Missing required environment variables');
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({
                success: false,
                error: 'Lambda configuration error: Missing Azure AD credentials'
            })
        };
    }
    
    // Verify JWT token from Cognito (optional but recommended)
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
        return {
            statusCode: 401,
            headers: headers,
            body: JSON.stringify({ error: 'Unauthorized - Missing token' })
        };
    }
    
    try {
        // Parse form data
        const formData = JSON.parse(event.body);
        console.log('Form data:', formData);
        
        let accessToken = null;
        
        // Try to get access token from Dynamics CRM
        try {
            console.log('Attempting to get CRM access token...');
            accessToken = await getCRMAccessToken();
            console.log('Access token received successfully');
        } catch (tokenError) {
            console.warn('Failed to get access token:', tokenError.message);
            console.log('Attempting to submit without token...');
            // Continue without token - some CRM endpoints might not require it
        }
        
        // Submit lead to Dynamics CRM
        console.log('Submitting lead to CRM...');
        const crmResponse = await submitLeadToCRM(formData, accessToken);
        console.log('Lead submitted successfully:', crmResponse);
        
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({
                success: true,
                message: 'Lead submitted successfully',
                data: crmResponse
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        console.error('Error stack:', error.stack);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to submit lead',
                details: error.stack
            })
        };
    }
};

// Get access token from Azure AD
function getCRMAccessToken() {
    return new Promise((resolve, reject) => {
        // Prepare form data for OAuth token request
        const postData = new URLSearchParams({
            client_id: AZURE_CLIENT_ID,
            client_secret: AZURE_CLIENT_SECRET,
            scope: AZURE_SCOPE,
            grant_type: 'client_credentials'
        }).toString();
        
        const options = {
            hostname: 'login.microsoftonline.com',
            path: `/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        console.log('=== AZURE AD TOKEN REQUEST ===');
        console.log('URL:', `https://${options.hostname}${options.path}`);
        console.log('Method:', options.method);
        
        const req = https.request(options, (res) => {
            let data = '';
            
            console.log('Token response status:', res.statusCode);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Token response received');
                
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        const token = response.access_token;
                        console.log('Access token obtained successfully');
                        resolve(token);
                    } catch (e) {
                        console.error('Failed to parse token response:', e);
                        reject(new Error('Failed to parse token response: ' + e.message));
                    }
                } else {
                    const errorMsg = `Token request failed: ${res.statusCode} - ${data}`;
                    console.error(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Token request network error:', error);
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Token request timeout'));
        });
        
        req.write(postData);
        req.end();
    });
}

// Submit lead to Dynamics CRM
function submitLeadToCRM(formData, accessToken) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(formData);
        
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        };
        
        // Add authorization header only if token is available
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const options = {
            hostname: CRM_BASE_URL,
            path: CREATE_LEAD_ENDPOINT,
            method: 'POST',
            headers: headers
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const response = data ? JSON.parse(data) : { success: true };
                        resolve(response);
                    } catch (e) {
                        resolve({ success: true, raw: data });
                    }
                } else {
                    reject(new Error(`CRM request failed: ${res.statusCode} - ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}
