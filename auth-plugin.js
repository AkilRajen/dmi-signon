/**
 * Standalone Authentication Plugin
 * Can be attached to any website for AWS Cognito Social Identity authentication
 */

class CognitoAuthPlugin {
    constructor(config) {
        this.config = config;
        this.currentUser = null;
        this.idToken = null;
        this.accessToken = null;
    }

    // Initialize the plugin
    init() {
        this.handleCallback();
    }

    // Build Cognito Hosted UI URL for social login
    getLoginUrl(identityProvider) {
        console.log('Building login URL with redirect_uri:', this.config.redirectUri);
        
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: this.config.responseType,
            scope: this.config.scope,
            redirect_uri: this.config.redirectUri
        });
        
        // If specific identity provider is specified, add it
        if (identityProvider) {
            params.append('identity_provider', identityProvider);
        }
        
        const loginUrl = `https://${this.config.domain}/oauth2/authorize?${params.toString()}`;
        console.log('Full login URL:', loginUrl);
        
        return loginUrl;
    }

    // Redirect to Cognito login page
    signIn(identityProvider) {
        window.location.href = this.getLoginUrl(identityProvider);
    }

    // Handle OAuth callback
    handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            this.exchangeCodeForTokens(code);
        } else {
            this.checkExistingSession();
        }
    }

    // Exchange authorization code for tokens
    async exchangeCodeForTokens(code) {
        try {
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                code: code,
                redirect_uri: this.config.redirectUri
            });

            const response = await fetch(`https://${this.config.domain}/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            if (response.ok) {
                const tokens = await response.json();
                this.storeTokens(tokens);
                this.parseUserInfo(tokens.id_token);
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                if (this.onAuthSuccess) {
                    this.onAuthSuccess(this.currentUser);
                }
            }
        } catch (error) {
            console.error('Token exchange failed:', error);
            if (this.onAuthError) {
                this.onAuthError(error);
            }
        }
    }

    // Store tokens in sessionStorage
    storeTokens(tokens) {
        sessionStorage.setItem('idToken', tokens.id_token);
        sessionStorage.setItem('accessToken', tokens.access_token);
        sessionStorage.setItem('refreshToken', tokens.refresh_token);
        
        this.idToken = tokens.id_token;
        this.accessToken = tokens.access_token;
    }

    // Parse user info from ID token
    parseUserInfo(idToken) {
        try {
            const payload = idToken.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            
            this.currentUser = {
                email: decoded.email,
                name: decoded.name || decoded.email,
                sub: decoded.sub
            };
        } catch (error) {
            console.error('Failed to parse token:', error);
        }
    }

    // Check for existing session
    checkExistingSession() {
        const idToken = sessionStorage.getItem('idToken');
        const accessToken = sessionStorage.getItem('accessToken');
        
        // Validate token is not expired
        if (idToken && accessToken) {
            try {
                const payload = idToken.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                const now = Math.floor(Date.now() / 1000);
                
                // Check if token is expired
                if (decoded.exp && decoded.exp < now) {
                    console.log('Token expired, clearing session');
                    sessionStorage.clear();
                    return;
                }
                
                this.idToken = idToken;
                this.accessToken = accessToken;
                this.parseUserInfo(idToken);
                
                if (this.onAuthSuccess) {
                    this.onAuthSuccess(this.currentUser);
                }
            } catch (error) {
                console.error('Invalid token, clearing session:', error);
                sessionStorage.clear();
            }
        }
    }

    // Sign out
    signOut() {
        sessionStorage.clear();
        this.currentUser = null;
        this.idToken = null;
        this.accessToken = null;
        
        const logoutUrl = `https://${this.config.domain}/logout?client_id=${this.config.clientId}&logout_uri=${encodeURIComponent(this.config.redirectUri)}`;
        window.location.href = logoutUrl;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get ID token for API calls
    getIdToken() {
        return this.idToken;
    }

    // Get access token
    getAccessToken() {
        return this.accessToken;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.idToken !== null;
    }

    // Event handlers
    onAuthSuccess(callback) {
        this.onAuthSuccess = callback;
    }

    onAuthError(callback) {
        this.onAuthError = callback;
    }
}
