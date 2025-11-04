/**
 * Adani Fintell Suite - Templates JavaScript
 * Dynamic template loading and rendering for shared components
 */

'use strict';

// ==========================================================================
// Template Configuration
// ==========================================================================

const TEMPLATE_CONFIG = {
    navbar: {
        path: 'templates/shared/navbar.html',
        target: 'navbar-placeholder',
        scripts: [],
        styles: [
            'css/navbar.css'
        ]
    },
    sidebar: {
        path: 'templates/shared/sidebar.html',
        target: 'sidebar-placeholder',
        scripts: [],
        styles: [
            'css/sidebar.css'
        ]
    }
};

// ==========================================================================
// Template Loading Functions
// ==========================================================================

/**
 * Fetch HTML template from file
 * @param {string} path - Path to template file
 * @returns {Promise<string>} - Template HTML content
 */
async function fetchTemplate(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to fetch template: ${path} (${response.status})`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching template from ${path}:`, error);
        return '';
    }
}

/**
 * Render template HTML into target element
 * @param {string} html - Template HTML
 * @param {string} targetId - Target element ID
 * @returns {boolean} - Success status
 */
function renderTemplate(html, targetId) {
    const targetElement = document.getElementById(targetId);
    
    if (!targetElement) {
        console.error(`Target element not found: ${targetId}`);
        return false;
    }
    
    targetElement.innerHTML = html;
    return true;
}

/**
 * Load and inject CSS file
 * @param {string} href - Path to CSS file
 */
function loadStylesheet(href) {
    // Check if stylesheet is already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
        return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

/**
 * Load and execute JavaScript file
 * @param {string} src - Path to JS file
 * @returns {Promise} - Promise that resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

// ==========================================================================
// Component Loading Functions
// ==========================================================================

/**
 * Load a specific component (navbar or sidebar)
 * @param {string} componentName - Component name (navbar or sidebar)
 * @returns {Promise} - Promise that resolves when component is loaded
 */
async function loadComponent(componentName) {
    const config = TEMPLATE_CONFIG[componentName];
    
    if (!config) {
        console.error(`Unknown component: ${componentName}`);
        return;
    }
    
    try {
        // Load CSS files
        if (config.styles) {
            config.styles.forEach(loadStylesheet);
        }
        
        // Fetch and render template
        const html = await fetchTemplate(config.path);
        const rendered = renderTemplate(html, config.target);
        
        if (!rendered) {
            throw new Error(`Failed to render ${componentName} template`);
        }
        
        // Load JavaScript files
        if (config.scripts) {
            for (const script of config.scripts) {
                await loadScript(script);
            }
        }
        
        console.log(`${componentName} component loaded successfully`);
    } catch (error) {
        console.error(`Error loading ${componentName} component:`, error);
    }
}

/**
 * Load all shared components
 * @returns {Promise} - Promise that resolves when all components are loaded
 */
async function loadAllComponents() {
    const components = Object.keys(TEMPLATE_CONFIG);
    
    try {
        await Promise.all(components.map(loadComponent));
        console.log('All components loaded successfully');
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// ==========================================================================
// Authentication Check
// ==========================================================================

/**
 * Check if user is authenticated
 * @returns {boolean} - Authentication status
 */
function isUserAuthenticated() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    const userData = sessionStorage.getItem('user');
    return isAuthenticated === 'true' && userData !== null;
}

/**
 * Redirect to signin if not authenticated
 */
function checkAuthenticationAndRedirect() {
    if (!isUserAuthenticated()) {
        console.log('User not authenticated, redirecting to signin...');
        window.location.href = 'signin.html';
    }
}

// ==========================================================================
// Page Layout Setup
// ==========================================================================

/**
 * Setup page layout with navbar and sidebar
 * This should be called on authenticated pages
 */
async function setupPageLayout() {
    // Check authentication first
    checkAuthenticationAndRedirect();
    
    // Load components
    await loadAllComponents();
    
    // Mark templates as loaded
    document.body.classList.add('templates-loaded');
    document.body.classList.remove('loading-layout');
    
    // Dispatch event to notify that templates are loaded
    const event = new CustomEvent('templatesLoaded');
    document.dispatchEvent(event);
}

// ==========================================================================
// Public API
// ==========================================================================

const Templates = {
    loadComponent,
    loadAllComponents,
    setupPageLayout,
    isUserAuthenticated,
    checkAuthenticationAndRedirect
};

// Make available globally
if (typeof window !== 'undefined') {
    window.Templates = Templates;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Templates;
}

// Auto-setup if page has placeholders
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const hasNavbar = document.getElementById('navbar-placeholder');
        const hasSidebar = document.getElementById('sidebar-placeholder');
        
        if (hasNavbar || hasSidebar) {
            setupPageLayout();
        }
    });
} else {
    const hasNavbar = document.getElementById('navbar-placeholder');
    const hasSidebar = document.getElementById('sidebar-placeholder');
    
    if (hasNavbar || hasSidebar) {
        setupPageLayout();
    }
}
