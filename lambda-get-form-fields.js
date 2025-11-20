/**
 * AWS Lambda Function: Get Form Fields from CRM
 * This function retrieves form field definitions from your CRM system
 */

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Verify JWT token from Cognito
    const token = event.headers.Authorization?.replace('Bearer ', '');
    
    if (!token) {
        return {
            statusCode: 401,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }
    
    try {
        // TODO: Integrate with your CRM API to fetch form fields
        // Example: const crmResponse = await axios.get('https://your-crm-api.com/form-fields');
        
        // Mock response - replace with actual CRM integration
        const formFields = {
            fields: [
                { name: 'LeadFirstName', label: 'First Name', type: 'text', required: true, maxLength: 100 },
                { name: 'LeadLastName', label: 'Last Name', type: 'text', required: true, maxLength: 100 },
                { name: 'LeadEmail', label: 'Email', type: 'email', required: true },
                { name: 'LeadMobile', label: 'Phone Number', type: 'tel', required: true },
                { name: 'LeadPublicationName', label: 'Publication', type: 'text', required: true, maxLength: 200 },
                { name: 'LeadDescription', label: 'Description', type: 'textarea', required: true, maxLength: 1000 },
                { name: 'LeadCountry', label: 'Country', type: 'select', required: false, default: 'United Arab Emirates',
                  options: ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 
                           'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 
                           'India', 'China', 'Japan', 'Brazil', 'Mexico', 'South Africa', 'Other'] },
                { name: 'LeadAddress', label: 'Address', type: 'textarea', required: false, maxLength: 500 }
            ]
        };
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formFields)
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
