/**
 * Adani Fintell Suite - Sign In Page JavaScript
 * Authentication and form validation functionality
 */

'use strict';

// ==========================================================================
// State Management
// ==========================================================================

const SignInState = {
    isAuthenticating: false,
    formData: {
        email: '',
        password: ''
    },
    
    /**
     * Update form data
     * @param {string} field - Field name
     * @param {*} value - Field value
     */
    updateField(field, value) {
        this.formData[field] = value;
    },
    
    /**
     * Set authentication state
     * @param {boolean} authenticating - Authentication state
     */
    setAuthenticating(authenticating) {
        this.isAuthenticating = authenticating;
        toggleLoadingState(authenticating);
    },
    
    /**
     * Reset form data
     */
    reset() {
        this.formData = { email: '', password: '' };
        this.isAuthenticating = false;
    }
};

// ==========================================================================
// DOM Elements Cache
// ==========================================================================

const DOM = {
    signinForm: document.getElementById('signin-form'),
    emailInput: document.querySelector('[data-field="email"]'),
    passwordInput: document.querySelector('[data-field="password"]'),
    submitButton: document.querySelector('[data-action="submit-signin"]'),
    togglePasswordBtn: document.querySelector('[data-action="toggle-password"]'),
    forgotPasswordLink: document.querySelector('[data-action="forgot-password"]'),
    loadingOverlay: document.querySelector('[data-loading]'),
    btnText: document.querySelector('.btn-text'),
    btnLoader: document.querySelector('.btn-loader')
};

// ==========================================================================
// Form Validation
// ==========================================================================

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - Validation result
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with message
 */
function validatePassword(password) {
    if (password.length < 6) {
        return {
            valid: false,
            message: 'Password must be at least 6 characters long'
        };
    }
    return { valid: true, message: '' };
}

/**
 * Show validation error for a field
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showError(input, message) {
    const errorElement = document.getElementById(`${input.id}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
    }
    input.classList.add('error');
}

/**
 * Clear validation error for a field
 * @param {HTMLElement} input - Input element
 */
function clearError(input) {
    const errorElement = document.getElementById(`${input.id}-error`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('active');
    }
    input.classList.remove('error');
}

/**
 * Validate entire form
 * @returns {boolean} - Form validity
 */
function validateForm() {
    let isValid = true;
    
    // Validate email
    const email = DOM.emailInput.value.trim();
    if (!email) {
        showError(DOM.emailInput, 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(DOM.emailInput, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearError(DOM.emailInput);
    }
    
    // Validate password
    const password = DOM.passwordInput.value;
    if (!password) {
        showError(DOM.passwordInput, 'Password is required');
        isValid = false;
    } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            showError(DOM.passwordInput, passwordValidation.message);
            isValid = false;
        } else {
            clearError(DOM.passwordInput);
        }
    }
    
    return isValid;
}

// ==========================================================================
// Form Submission
// ==========================================================================

/**
 * Handle form submission
 * @param {Event} e - Submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Update state
    SignInState.setAuthenticating(true);
    SignInState.updateField('email', DOM.emailInput.value.trim());
    SignInState.updateField('password', DOM.passwordInput.value);
    
    // Disable submit button
    DOM.submitButton.disabled = true;
    DOM.btnText.style.display = 'none';
    DOM.btnLoader.style.display = 'block';
    
    try {
        // Simulate API call
        await authenticateUser(SignInState.formData);
        
        // Success
        showNotification('Sign in successful! Redirecting...', 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        // Error handling
        showNotification(error.message || 'Sign in failed. Please try again.', 'error');
        console.error('Sign in error:', error);
        
        // Re-enable form
        DOM.submitButton.disabled = false;
        DOM.btnText.style.display = 'block';
        DOM.btnLoader.style.display = 'none';
        SignInState.setAuthenticating(false);
    }
}

/**
 * Authenticate user with backend
 * @param {Object} credentials - User credentials
 * @returns {Promise} - Authentication promise
 */
async function authenticateUser(credentials) {
    // Get endpoint from API_ENDPOINTS configuration
    const endpoint = window.API_ENDPOINTS.AUTH.SIGNIN;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
            })
        });
        
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Handle array response format
        const result = Array.isArray(responseData) ? responseData[0] : responseData;
        
        // Check if authentication was successful
        if (!result.success) {
            throw new Error(result.message || 'Authentication failed');
        }
        
        // Extract user data
        const userData = {
            id: result.user._id,
            userID: result.user.userID,
            fullName: result.user.fullName,
            email: result.user.emailAddress,
            department: result.user.department
        };
        
        // Store user data in sessionStorage
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('isAuthenticated', 'true');
        
        return userData;
        
    } catch (error) {
        console.error('Authentication error:', error);
        
        // Provide user-friendly error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        
        throw error;
    }
}

// ==========================================================================
// Input Event Handlers
// ==========================================================================

/**
 * Handle email input change
 */
function handleEmailInput() {
    const email = DOM.emailInput.value.trim();
    SignInState.updateField('email', email);
    
    // Clear error on input
    if (email) {
        clearError(DOM.emailInput);
    }
}

/**
 * Handle password input change
 */
function handlePasswordInput() {
    const password = DOM.passwordInput.value;
    SignInState.updateField('password', password);
    
    // Clear error on input
    if (password) {
        clearError(DOM.passwordInput);
    }
}

/**
 * Handle password visibility toggle
 */
function handleTogglePassword() {
    const type = DOM.passwordInput.type === 'password' ? 'text' : 'password';
    DOM.passwordInput.type = type;
    
    // Update icon
    const eyeIcon = DOM.togglePasswordBtn.querySelector('.eye-icon');
    if (type === 'password') {
        // Show eye icon (visible)
        eyeIcon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
    } else {
        // Show eye-off icon (hidden)
        eyeIcon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
    }
}

// ==========================================================================
// Alternative Login Methods
// ==========================================================================

/**
 * Handle forgot password action
 * @param {Event} e - Click event
 */
function handleForgotPassword(e) {
    e.preventDefault();
    console.log('Forgot password clicked');
    showNotification('Password reset functionality coming soon!', 'info');
    // TODO: Implement password reset flow
}

// ==========================================================================
// Loading State Management
// ==========================================================================

/**
 * Toggle loading state
 * @param {boolean} loading - Loading state
 */
function toggleLoadingState(loading) {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.setAttribute('data-loading', loading ? 'visible' : 'hidden');
        DOM.loadingOverlay.setAttribute('aria-busy', loading.toString());
    }
}

// ==========================================================================
// Notification System
// ==========================================================================

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
        cursor: pointer;
    `;
    
    const colors = {
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107',
        info: '#17A2B8'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Form submission
    DOM.signinForm.addEventListener('submit', handleFormSubmit);
    
    // Input events
    DOM.emailInput.addEventListener('input', handleEmailInput);
    DOM.passwordInput.addEventListener('input', handlePasswordInput);
    
    // Password toggle
    DOM.togglePasswordBtn.addEventListener('click', handleTogglePassword);
    
    // Alternative actions
    DOM.forgotPasswordLink.addEventListener('click', handleForgotPassword);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Enter key submits form
        if (e.key === 'Enter' && !SignInState.isAuthenticating) {
            DOM.signinForm.dispatchEvent(new Event('submit'));
        }
    });
}

// ==========================================================================
// Initialization
// ==========================================================================

/**
 * Initialize sign in page
 */
function init() {
    console.log('Sign in page initialized');
    
    // Setup event listeners
    initEventListeners();
    
    // Set initial loading state
    SignInState.setAuthenticating(false);
    
    // Focus on email input
    DOM.emailInput.focus();
    
    console.log('Sign in state:', SignInState);
}

// ==========================================================================
// Page Load
// ==========================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export for testing/debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SignInState,
        validateEmail,
        validatePassword,
        showNotification
    };
}
