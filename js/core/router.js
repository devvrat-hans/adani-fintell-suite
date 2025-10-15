/**
 * Client-Side Router
 * Handles navigation and page routing without page reloads
 */

import { parseQueryParams } from '../utils/helpers.js';

/**
 * Router class for client-side routing
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeHooks = [];
        this.afterHooks = [];
        this.init();
    }

    /**
     * Initialize router
     */
    init() {
        // Handle popstate (browser back/forward)
        window.addEventListener('popstate', (event) => {
            this.handleRoute(window.location.pathname, event.state);
        });

        // Intercept link clicks
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[data-route]');
            if (link) {
                event.preventDefault();
                const href = link.getAttribute('href');
                this.navigate(href);
            }
        });
    }

    /**
     * Register a route
     * @param {string} path - Route path
     * @param {Function} handler - Route handler function
     * @param {Object} options - Route options
     */
    register(path, handler, options = {}) {
        this.routes.set(path, {
            handler,
            options,
        });
    }

    /**
     * Navigate to a route
     * @param {string} path - Path to navigate to
     * @param {Object} state - State to pass
     */
    navigate(path, state = {}) {
        if (this.currentRoute === path) {
            return;
        }

        window.history.pushState(state, '', path);
        this.handleRoute(path, state);
    }

    /**
     * Replace current route
     * @param {string} path - Path to replace with
     * @param {Object} state - State to pass
     */
    replace(path, state = {}) {
        window.history.replaceState(state, '', path);
        this.handleRoute(path, state);
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }

    /**
     * Handle route change
     * @param {string} path - Route path
     * @param {Object} state - Route state
     */
    async handleRoute(path, state = {}) {
        const route = this.matchRoute(path);

        if (!route) {
            this.handle404(path);
            return;
        }

        const context = {
            path,
            state,
            params: this.extractParams(path, route.pattern),
            query: parseQueryParams(),
        };

        // Run before hooks
        for (const hook of this.beforeHooks) {
            const result = await hook(context);
            if (result === false) {
                return; // Navigation cancelled
            }
        }

        // Execute route handler
        try {
            await route.handler(context);
            this.currentRoute = path;

            // Run after hooks
            for (const hook of this.afterHooks) {
                await hook(context);
            }

            // Dispatch route change event
            this.dispatchRouteEvent('change', context);
        } catch (error) {
            console.error('Route handler error:', error);
            this.handleError(error, context);
        }
    }

    /**
     * Match route path to registered routes
     * @param {string} path - Path to match
     * @returns {Object|null} Matched route
     */
    matchRoute(path) {
        for (const [pattern, route] of this.routes) {
            if (this.isMatch(path, pattern)) {
                return { ...route, pattern };
            }
        }
        return null;
    }

    /**
     * Check if path matches pattern
     * @param {string} path - Path to check
     * @param {string} pattern - Pattern to match against
     * @returns {boolean} Match result
     */
    isMatch(path, pattern) {
        // Exact match
        if (path === pattern) {
            return true;
        }

        // Pattern with parameters (e.g., /invoice/:id)
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) {
            return false;
        }

        return patternParts.every((part, i) => {
            return part.startsWith(':') || part === pathParts[i];
        });
    }

    /**
     * Extract parameters from path
     * @param {string} path - Current path
     * @param {string} pattern - Route pattern
     * @returns {Object} Extracted parameters
     */
    extractParams(path, pattern) {
        const params = {};
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        patternParts.forEach((part, i) => {
            if (part.startsWith(':')) {
                const paramName = part.slice(1);
                params[paramName] = pathParts[i];
            }
        });

        return params;
    }

    /**
     * Register before navigation hook
     * @param {Function} hook - Hook function
     */
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }

    /**
     * Register after navigation hook
     * @param {Function} hook - Hook function
     */
    afterEach(hook) {
        this.afterHooks.push(hook);
    }

    /**
     * Handle 404 error
     * @param {string} path - Path that was not found
     */
    handle404(path) {
        console.warn('Route not found:', path);
        
        // Dispatch 404 event
        this.dispatchRouteEvent('notfound', { path });

        // Show 404 message (can be customized)
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="error-page">
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="/" data-route>Go to Home</a>
                </div>
            `;
        }
    }

    /**
     * Handle route error
     * @param {Error} error - Error object
     * @param {Object} context - Route context
     */
    handleError(error, context) {
        console.error('Route error:', error);
        
        // Dispatch error event
        this.dispatchRouteEvent('error', { error, context });
    }

    /**
     * Dispatch router event
     * @param {string} type - Event type
     * @param {Object} data - Event data
     */
    dispatchRouteEvent(type, data = {}) {
        const event = new CustomEvent(`router:${type}`, {
            detail: data,
            bubbles: true,
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current route
     * @returns {string|null} Current route path
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Update page title
     * @param {string} title - New page title
     */
    setTitle(title) {
        document.title = `${title} - Adani-Fintell-Suite`;
    }

    /**
     * Scroll to top of page
     */
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Create singleton instance
const router = new Router();

export default router;
