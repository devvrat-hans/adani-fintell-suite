/**
 * Authentication & Session Management
 * Handles user authentication, session management, and access control
 */

import { AuthAPI } from './api.js';
import { STORAGE_KEYS, APP_CONFIG } from '../utils/constants.js';

/**
 * Authentication class
 */
class Auth {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = null;
        this.init();
    }

    /**
     * Initialize authentication
     */
    init() {
        this.loadUserFromStorage();
        this.setupSessionMonitoring();
    }

    /**
     * Load user data from storage
     */
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
            const sessionExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);

            if (userData && sessionExpiry) {
                const expiry = parseInt(sessionExpiry, 10);
                if (Date.now() < expiry) {
                    this.currentUser = JSON.parse(userData);
                    this.resetSessionTimeout();
                } else {
                    this.logout();
                }
            }
        } catch (error) {
            console.error('Error loading user from storage:', error);
            this.logout();
        }
    }

    /**
     * Setup session monitoring
     */
    setupSessionMonitoring() {
        // Monitor user activity
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (this.isAuthenticated()) {
                    this.resetSessionTimeout();
                }
            }, { passive: true });
        });

        // Check session on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated()) {
                this.verifySession();
            }
        });
    }

    /**
     * Reset session timeout
     */
    resetSessionTimeout() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }

        const newExpiry = Date.now() + APP_CONFIG.SESSION_TIMEOUT;
        localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, newExpiry.toString());

        this.sessionTimeout = setTimeout(() => {
            this.handleSessionExpiry();
        }, APP_CONFIG.SESSION_TIMEOUT);
    }

    /**
     * Handle session expiry
     */
    handleSessionExpiry() {
        this.showNotification('Your session has expired. Please login again.', 'warning');
        this.logout();
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result
     */
    async login(email, password) {
        try {
            const response = await AuthAPI.login(email, password);

            if (response.success) {
                this.currentUser = response.user;
                
                // Store auth data
                localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
                localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, (Date.now() + APP_CONFIG.SESSION_TIMEOUT).toString());

                this.resetSessionTimeout();
                
                // Dispatch login event
                this.dispatchAuthEvent('login', response.user);

                return { success: true, user: response.user };
            } else {
                return { success: false, error: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'An error occurred during login' };
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout API
            await AuthAPI.logout().catch(err => console.error('Logout API error:', err));
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local data
            this.currentUser = null;
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);

            if (this.sessionTimeout) {
                clearTimeout(this.sessionTimeout);
            }

            // Dispatch logout event
            this.dispatchAuthEvent('logout');

            // Redirect to login page
            window.location.href = 'index.html';
        }
    }

    /**
     * Verify current session
     * @returns {Promise<boolean>} Verification result
     */
    async verifySession() {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const response = await AuthAPI.verifySession();
            
            if (!response.valid) {
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Session verification error:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.currentUser !== null && localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) !== null;
    }

    /**
     * Get current user
     * @returns {Object|null} Current user data
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} Role check result
     */
    hasRole(role) {
        if (!this.currentUser || !this.currentUser.roles) {
            return false;
        }
        return this.currentUser.roles.includes(role);
    }

    /**
     * Check if user has permission
     * @param {string} permission - Permission to check
     * @returns {boolean} Permission check result
     */
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.permissions) {
            return false;
        }
        return this.currentUser.permissions.includes(permission);
    }

    /**
     * Require authentication (redirect if not authenticated)
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    /**
     * Dispatch authentication event
     * @param {string} type - Event type
     * @param {Object} data - Event data
     */
    dispatchAuthEvent(type, data = {}) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data,
            bubbles: true,
        });
        document.dispatchEvent(event);
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        const event = new CustomEvent('app:notification', {
            detail: { message, type },
            bubbles: true,
        });
        document.dispatchEvent(event);
    }
}

// Create singleton instance
const auth = new Auth();

export default auth;
