/**
 * AWS Lambda Function: Submit Lead to Dynamics 365 CRM
 * This function acts as a proxy between the frontend and Dynamics CRM
 */

const https = require('https');

// Dynamics CRM Configuration
const CRM_BASE_URL = 'dmi-uat.crm15.dynamics.com';
const TOKEN_ENDPOINT = '/api/data/v9.2/titc_GetAccessToken';
const CREATE_LEAD_ENDPOINT = '/api/data/v9.2/titc_CreateClassifiedB2BLead';

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: ''
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
        
        // Step 1: Get access token from Dynamics CRM
        console.log('Getting CRM access token...');
        const accessToken = await getCRMAccessToken();
        console.log('Access token received');
        
        // Step 2: Submit lead to Dynamics CRM
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
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to submit lead'
            })
        };
    }
};

// Get access token from Dynamics CRM
function getCRMAccessToken() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CRM_BASE_URL,
            path: TOKEN_ENDPOINT,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        const token = response.access_token || response.AccessToken || response;
                        resolve(token);
                    } catch (e) {
                        reject(new Error('Failed to parse token response'));
                    }
                } else {
                    reject(new Error(`Token request failed: ${res.statusCode} - ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

// Submit lead to Dynamics CRM
function submitLeadToCRM(formData, accessToken) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(formData);
        
        const options = {
            hostname: CRM_BASE_URL,
            path: CREATE_LEAD_ENDPOINT,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Content-Length': Buffer.byteLength(postData)
            }
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
