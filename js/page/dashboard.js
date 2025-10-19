/**
 * Dashboard Page JavaScript
 * Handles dashboard data loading, stats updates, and user interactions
 */

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeDashboard();
});

/**
 * Check if user is authenticated
 * Redirect to signin if not authenticated
 */
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    
    if (!isAuthenticated || isAuthenticated !== 'true') {
        window.location.href = 'signin.html';
        return;
    }
}

/**
 * Initialize dashboard functionality
 */
function initializeDashboard() {
    loadDashboardStats();
    setupEventListeners();
}

/**
 * Load dashboard statistics
 * In production, this would fetch from API
 */
function loadDashboardStats() {
    // Simulate loading stats
    setTimeout(() => {
        updateStatValue('total-invoices', '1,234');
        updateStatValue('pending-reviews', '42');
        updateStatValue('compliance-rate', '96.5%');
        updateStatValue('anomalies-detected', '7');
    }, 500);
}

/**
 * Update a stat value with animation
 * @param {string} statName - Data attribute name of the stat element
 * @param {string} value - New value to display
 */
function updateStatValue(statName, value) {
    const statElement = document.querySelector(`[data-stat="${statName}"]`);
    
    if (!statElement) {
        console.warn(`Stat element not found: ${statName}`);
        return;
    }
    
    // Add fade-in animation
    statElement.style.opacity = '0';
    
    setTimeout(() => {
        statElement.textContent = value;
        statElement.style.transition = 'opacity 0.3s ease';
        statElement.style.opacity = '1';
    }, 100);
}

/**
 * Setup event listeners for dashboard interactions
 */
function setupEventListeners() {
    // Module card clicks
    const moduleButtons = document.querySelectorAll('.module-card-button');
    moduleButtons.forEach(button => {
        button.addEventListener('click', handleModuleClick);
    });
}

/**
 * Handle module card button clicks
 * @param {Event} event - Click event
 */
function handleModuleClick(event) {
    const href = event.currentTarget.getAttribute('href');
    
    // Check if module page exists, otherwise show coming soon
    if (href && (href === 'finguard.html' || href === 'sheetsense.html')) {
        // Let the default navigation happen
        console.log(`Navigating to ${href}`);
    } else {
        event.preventDefault();
        showComingSoonMessage();
    }
}

/**
 * Show coming soon message for unavailable modules
 */
function showComingSoonMessage() {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.textContent = 'This module will be available soon!';
    notification.style.cssText = `
        position: fixed;
        top: calc(var(--navbar-height) + 1rem);
        right: 1rem;
        background: var(--adani-blue);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Get user data from session storage
 * @returns {Object|null} User data object or null
 */
function getUserData() {
    const userJson = sessionStorage.getItem('user');
    
    if (!userJson) {
        return null;
    }
    
    try {
        return JSON.parse(userJson);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
}

/**
 * Format time ago (e.g., "2 minutes ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Time ago string
 */
function formatTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
