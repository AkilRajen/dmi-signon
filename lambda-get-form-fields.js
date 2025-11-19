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
                { name: 'title', label: 'Ad Title', type: 'text', required: true },
                { name: 'category', label: 'Category', type: 'select', required: true,
                  options: ['Electronics', 'Furniture', 'Vehicles', 'Real Estate', 'Services'] },
                { name: 'description', label: 'Description', type: 'textarea', required: true },
                { name: 'price', label: 'Price', type: 'number', required: true },
                { name: 'location', label: 'Location', type: 'text', required: true },
                { name: 'contact', label: 'Contact Number', type: 'tel', required: true },
                { name: 'email', label: 'Email', type: 'email', required: true }
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
