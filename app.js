// Form fields configuration (using CRM field names)
const FORM_FIELDS = [
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
];

// Main application logic
$(document).ready(function() {
    // Initialize auth plugin
    const authPlugin = new CognitoAuthPlugin(CONFIG.cognito);
    
    // Set up auth callbacks
    authPlugin.onAuthSuccess = function(user) {
        handleAuthSuccess(user);
    };
    
    authPlugin.onAuthError = function(error) {
        console.error('Authentication error:', error);
        alert('Authentication failed. Please try again.');
    };
    
    // Initialize
    console.log('Initializing auth plugin...');
    authPlugin.init();
    
    // Check if already authenticated
    if (authPlugin.isAuthenticated()) {
        console.log('User already authenticated');
        handleAuthSuccess(authPlugin.getCurrentUser());
    } else {
        console.log('User not authenticated');
    }
    
    // Test button to skip auth and show form directly
    $('#test-form-btn').on('click', function() {
        console.log('Test button clicked - showing form without auth');
        handleAuthSuccess({ name: 'Test User', email: 'test@example.com', sub: 'test-123' });
    });
    
    // Social login buttons
    $('#signin-google').on('click', function() {
        authPlugin.signIn('Google');
    });
    
    $('#signin-facebook').on('click', function() {
        authPlugin.signIn('Facebook');
    });
    
    $('#signin-apple').on('click', function() {
        authPlugin.signIn('SignInWithApple');
    });
    
    $('#signin-microsoft').on('click', function() {
        authPlugin.signIn('Microsoft');
    });
    
    // Sign out button click
    $('#signout-btn').on('click', function() {
        authPlugin.signOut();
    });
    
    // Handle successful authentication
    function handleAuthSuccess(user) {
        console.log('Auth success, user:', user);
        
        // Update UI
        $('#signin-buttons').hide();
        $('#user-info').show();
        $('#user-name').text(user.name || user.email || 'User');
        $('#welcome-section').hide();
        $('#form-section').show();
        
        console.log('Loading form fields...');
        // Load form fields and pre-fill with user data
        loadFormFields(user);
    }
    
    
    // Load form fields
    function loadFormFields(user) {
        console.log('Loading form fields...');
        renderFormFields(FORM_FIELDS, user);
    }
    
    // Render form fields dynamically
    function renderFormFields(fields, user) {
        console.log('Rendering form fields, received:', fields);
        console.log('User data for pre-fill:', user);
        
        if (!fields || !Array.isArray(fields)) {
            console.error('Invalid fields parameter:', fields);
            return;
        }
        
        console.log('Number of fields:', fields.length);
        const formFieldsContainer = $('#form-fields');
        
        if (formFieldsContainer.length === 0) {
            console.error('Form fields container not found!');
            return;
        }
        
        formFieldsContainer.empty();
        
        // Parse user name into first and last name
        let firstName = '';
        let lastName = '';
        if (user && user.name) {
            const nameParts = user.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }
        
        fields.forEach(function(field) {
            const formGroup = $('<div class="form-group"></div>');
            const label = $(`<label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>`);
            formGroup.append(label);
            
            let input;
            let prefilledValue = field.default || '';
            
            // Pre-fill with user data if available
            if (user) {
                if (field.name === 'LeadFirstName') {
                    prefilledValue = firstName;
                } else if (field.name === 'LeadLastName') {
                    prefilledValue = lastName;
                } else if (field.name === 'LeadEmail') {
                    prefilledValue = user.email || '';
                }
            }
            
            if (field.type === 'textarea') {
                input = $(`<textarea id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''} ${field.maxLength ? 'maxlength="' + field.maxLength + '"' : ''}></textarea>`);
                input.val(prefilledValue);
            } else if (field.type === 'select') {
                input = $(`<select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}></select>`);
                input.append('<option value="">Select...</option>');
                field.options.forEach(function(option) {
                    const selected = prefilledValue && option === prefilledValue ? 'selected' : '';
                    input.append(`<option value="${option}" ${selected}>${option}</option>`);
                });
            } else {
                input = $(`<input type="${field.type}" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''} ${field.maxLength ? 'maxlength="' + field.maxLength + '"' : ''}>`);
                input.val(prefilledValue);
            }
            
            // Add character counter for fields with maxLength
            if (field.maxLength && (field.type === 'text' || field.type === 'textarea')) {
                const counter = $(`<div class="char-counter"><span class="char-count">${prefilledValue.length}</span> / ${field.maxLength}</span></div>`);
                formGroup.append(input);
                formGroup.append(counter);
                
                // Update counter color if pre-filled value is at limit
                if (prefilledValue.length >= field.maxLength) {
                    formGroup.find('.char-counter').addClass('limit-reached');
                }
                
                input.on('input', function() {
                    const length = $(this).val().length;
                    formGroup.find('.char-count').text(length);
                    if (length >= field.maxLength) {
                        formGroup.find('.char-counter').addClass('limit-reached');
                    } else {
                        formGroup.find('.char-counter').removeClass('limit-reached');
                    }
                });
            } else {
                formGroup.append(input);
            }
            
            formFieldsContainer.append(formGroup);
        });
        
        console.log('Form fields rendered successfully with user data pre-filled');
    }
    
    // Handle form submission
    $('#ad-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {};
        $(this).serializeArray().forEach(function(field) {
            formData[field.name] = field.value;
        });
        
        // Note: userId and userEmail are not sent to CRM as they're not valid parameters
        // The CRM only accepts the Lead* fields defined in FORM_FIELDS
        
        submitFormToCRM(formData);
    });
    
    // Submit form to CRM via Lambda
    function submitFormToCRM(formData) {
        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('API URL:', CONFIG.api.submitLead);
        console.log('Form Data:', formData);
        
        // Show loading state
        $('#ad-form button[type="submit"]').prop('disabled', true).text('Submitting...');
        
        const idToken = authPlugin.getIdToken();
        console.log('ID Token:', idToken ? 'Present' : 'Missing');
        
        $.ajax({
            url: CONFIG.api.submitLead,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('✓ Lead submitted successfully:', response);
                $('#form-section').hide();
                $('#success-section').show();
            },
            error: function(xhr, status, error) {
                console.error('=== SUBMISSION ERROR ===');
                console.error('Status Code:', xhr.status);
                console.error('Status Text:', status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                console.error('Response Headers:', xhr.getAllResponseHeaders());
                
                $('#ad-form button[type="submit"]').prop('disabled', false).text('Submit');
                
                let errorMessage = 'Failed to submit form. Please check console for details.\n\n';
                errorMessage += 'Status: ' + xhr.status + '\n';
                
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    errorMessage += 'Error: ' + (errorData.error || errorData.message || JSON.stringify(errorData));
                } catch (e) {
                    errorMessage += 'Response: ' + (xhr.responseText || error);
                }
                
                alert(errorMessage);
            }
        });
    }
});
