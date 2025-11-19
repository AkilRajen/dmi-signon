/**
 * AWS Lambda Function: Submit Form to CRM
 * This function submits the ad posting form data to your CRM system
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
        // Parse form data
        const formData = JSON.parse(event.body);
        console.log('Form data:', formData);
        
        // TODO: Integrate with your CRM API to submit the form
        // Example:
        // const crmResponse = await axios.post('https://your-crm-api.com/ads', {
        //     title: formData.title,
        //     category: formData.category,
        //     description: formData.description,
        //     price: formData.price,
        //     location: formData.location,
        //     contact: formData.contact,
        //     userId: formData.userId,
        //     userEmail: formData.userEmail
        // });
        
        // Mock successful response
        const response = {
            success: true,
            adId: 'AD-' + Date.now(),
            message: 'Ad posted successfully',
            data: formData
        };
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(response)
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
            body: JSON.stringify({ error: 'Failed to submit form' })
        };
    }
};
