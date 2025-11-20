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
        // Load form fields from CRM via Lambda
        loadFormFields();
    }
    
    // Load form fields from CRM
    function loadFormFields() {
        const idToken = authPlugin.getIdToken();
        console.log('ID Token:', idToken ? 'Present' : 'Missing');
        
        // For now, skip API call and use default fields directly
        console.log('Getting default fields...');
        const defaultFields = getDefaultFields();
        console.log('Default fields:', defaultFields);
        console.log('Calling renderFormFields...');
        renderFormFields(defaultFields);
        
        /* Uncomment when Lambda API is ready
        $.ajax({
            url: CONFIG.api.getFormFields,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`
            },
            success: function(response) {
                console.log('API response:', response);
                renderFormFields(response.fields);
            },
            error: function(xhr, status, error) {
                console.error('Failed to load form fields:', error);
                // Fallback to default fields
                renderFormFields(getDefaultFields());
            }
        });
        */
    }
    
    // Default form fields (using CRM field names)
    function getDefaultFields() {
        return [
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
    }
    
    // Render form fields dynamically
    function renderFormFields(fields) {
        console.log('Rendering form fields, received:', fields);
        
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
        
        fields.forEach(function(field) {
            const formGroup = $('<div class="form-group"></div>');
            const label = $(`<label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>`);
            formGroup.append(label);
            
            let input;
            if (field.type === 'textarea') {
                input = $(`<textarea id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''} ${field.maxLength ? 'maxlength="' + field.maxLength + '"' : ''}></textarea>`);
                if (field.default) {
                    input.val(field.default);
                }
            } else if (field.type === 'select') {
                input = $(`<select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}></select>`);
                input.append('<option value="">Select...</option>');
                field.options.forEach(function(option) {
                    const selected = field.default && option === field.default ? 'selected' : '';
                    input.append(`<option value="${option}" ${selected}>${option}</option>`);
                });
            } else {
                input = $(`<input type="${field.type}" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''} ${field.maxLength ? 'maxlength="' + field.maxLength + '"' : ''}>`);
                if (field.default) {
                    input.val(field.default);
                }
            }
            
            // Add character counter for fields with maxLength
            if (field.maxLength && (field.type === 'text' || field.type === 'textarea')) {
                const counter = $(`<div class="char-counter"><span class="char-count">0</span> / ${field.maxLength}</span></div>`);
                formGroup.append(input);
                formGroup.append(counter);
                
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
        
        console.log('Form fields rendered successfully');
    }
    
    // Handle form submission
    $('#ad-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {};
        $(this).serializeArray().forEach(function(field) {
            formData[field.name] = field.value;
        });
        
        // Add user info
        const user = authPlugin.getCurrentUser();
        formData.userId = user.sub;
        formData.userEmail = user.email;
        
        submitFormToCRM(formData);
    });
    
    // Submit form to CRM via Lambda
    function submitFormToCRM(formData) {
        const idToken = authPlugin.getIdToken();
        
        $.ajax({
            url: CONFIG.api.submitForm,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Form submitted successfully:', response);
                $('#form-section').hide();
                $('#success-section').show();
            },
            error: function(xhr, status, error) {
                console.error('Form submission failed:', error);
                alert('Failed to submit form. Please try again.');
            }
        });
    }
});
