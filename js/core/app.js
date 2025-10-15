/**
 * Main Application Controller
 * Initializes and manages the Adani-Fintell-Suite application
 */

import auth from './auth.js';
import router from './router.js';
import { APP_CONFIG, STORAGE_KEYS } from '../utils/constants.js';

/**
 * Application class
 */
class App {
    constructor() {
        this.isInitialized = false;
        this.theme = 'light';
        this.notificationContainer = null;
    }

    /**
     * Initialize application
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log(`Initializing ${APP_CONFIG.APP_NAME} v${APP_CONFIG.VERSION}...`);

        try {
            // Load theme
            this.loadTheme();

            // Setup notification system
            this.setupNotifications();

            // Setup global error handlers
            this.setupErrorHandlers();

            // Setup authentication event listeners
            this.setupAuthListeners();

            // Setup router event listeners
            this.setupRouterListeners();

            // Setup accessibility features
            this.setupAccessibility();

            // Check authentication status
            if (this.shouldCheckAuth()) {
                await auth.verifySession();
            }

            this.isInitialized = true;
            console.log('Application initialized successfully');

            // Dispatch app ready event
            this.dispatchEvent('ready');
        } catch (error) {
            console.error('Application initialization error:', error);
            this.showNotification('Failed to initialize application', 'error');
        }
    }

    /**
     * Check if authentication should be verified
     * @returns {boolean} Should check auth
     */
    shouldCheckAuth() {
        const publicPages = ['index.html', '/', ''];
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop();
        return !publicPages.includes(pageName);
    }

    /**
     * Load and apply theme
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        this.theme = savedTheme || 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem(STORAGE_KEYS.THEME, this.theme);
        this.dispatchEvent('themechange', { theme: this.theme });
    }

    /**
     * Setup notification system
     */
    setupNotifications() {
        // Create notification container
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.className = 'notification-container';
        this.notificationContainer.setAttribute('role', 'region');
        this.notificationContainer.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(this.notificationContainer);

        // Listen for notification events
        document.addEventListener('app:notification', (event) => {
            const { message, type, duration } = event.detail;
            this.showNotification(message, type, duration);
        });
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <div class="notification__content">
                <span class="notification__message">${message}</span>
                <button class="notification__close" aria-label="Close notification">×</button>
            </div>
        `;

        // Close button handler
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Add to container
        this.notificationContainer.appendChild(notification);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
    }

    /**
     * Remove notification
     * @param {HTMLElement} notification - Notification element
     */
    removeNotification(notification) {
        notification.classList.add('notification--removing');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    /**
     * Setup global error handlers
     */
    setupErrorHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            this.showNotification('An unexpected error occurred', 'error');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showNotification('An unexpected error occurred', 'error');
        });

        // Handle offline/online events
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may not work.', 'warning', 0);
        });

        window.addEventListener('online', () => {
            this.showNotification('You are back online.', 'success');
        });
    }

    /**
     * Setup authentication event listeners
     */
    setupAuthListeners() {
        document.addEventListener('auth:login', (event) => {
            console.log('User logged in:', event.detail);
            this.showNotification('Login successful', 'success');
        });

        document.addEventListener('auth:logout', () => {
            console.log('User logged out');
            this.showNotification('Logged out successfully', 'info');
        });
    }

    /**
     * Setup router event listeners
     */
    setupRouterListeners() {
        document.addEventListener('router:change', (event) => {
            console.log('Route changed:', event.detail.path);
            router.scrollToTop();
        });

        document.addEventListener('router:notfound', (event) => {
            console.warn('Route not found:', event.detail.path);
        });

        document.addEventListener('router:error', (event) => {
            console.error('Router error:', event.detail.error);
            this.showNotification('Navigation error occurred', 'error');
        });
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Focus management for modals
        document.addEventListener('keydown', (event) => {
            // Close modals on Escape
            if (event.key === 'Escape') {
                const modals = document.querySelectorAll('.modal[data-active="true"]');
                modals.forEach(modal => {
                    const closeEvent = new CustomEvent('modal:close', {
                        detail: { modal },
                    });
                    modal.dispatchEvent(closeEvent);
                });
            }
        });
    }

    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    showLoading(message = 'Loading...') {
        let loader = document.querySelector('.app-loader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'app-loader';
            loader.setAttribute('role', 'alert');
            loader.setAttribute('aria-busy', 'true');
            loader.innerHTML = `
                <div class="app-loader__content">
                    <div class="app-loader__spinner"></div>
                    <p class="app-loader__message">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        }

        loader.querySelector('.app-loader__message').textContent = message;
        loader.style.display = 'flex';
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loader = document.querySelector('.app-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Dispatch application event
     * @param {string} type - Event type
     * @param {Object} data - Event data
     */
    dispatchEvent(type, data = {}) {
        const event = new CustomEvent(`app:${type}`, {
            detail: data,
            bubbles: true,
        });
        document.dispatchEvent(event);
    }

    /**
     * Get application info
     * @returns {Object} Application info
     */
    getInfo() {
        return {
            name: APP_CONFIG.APP_NAME,
            version: APP_CONFIG.VERSION,
            theme: this.theme,
            authenticated: auth.isAuthenticated(),
            user: auth.getCurrentUser(),
        };
    }
}

// Create singleton instance
const app = new App();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

export default app;
