/**
 * Adani-Fintell-Suite - Navbar JavaScript
 * User profile dropdown and navigation functionality
 */

'use strict';

// ==========================================================================
// DOM Elements
// ==========================================================================

const NavbarDOM = {
    profileButton: document.querySelector('[data-action="toggle-profile-menu"]'),
    profileDropdown: document.querySelector('[data-profile-dropdown]'),
    helpButton: document.querySelector('[data-action="toggle-help-menu"]'),
    helpDropdown: document.querySelector('[data-help-dropdown]'),
    signoutButton: document.querySelector('[data-action="signout"]'),
    viewProfileBtn: document.querySelector('[data-action="view-profile"]'),
    viewSettingsBtn: document.querySelector('[data-action="view-settings"]'),
    viewShortcutsBtn: document.querySelector('[data-action="view-shortcuts"]'),
    viewDocsBtn: document.querySelector('[data-action="view-docs"]'),
    userName: document.querySelector('[data-user-name]'),
    userEmail: document.querySelector('[data-user-email]'),
    dropdownUserName: document.querySelector('[data-dropdown-user-name]'),
    dropdownUserEmail: document.querySelector('[data-dropdown-user-email]')
};

// ==========================================================================
// Profile Dropdown Functions
// ==========================================================================

/**
 * Toggle profile dropdown visibility
 */
function toggleProfileDropdown() {
    const isHidden = NavbarDOM.profileDropdown.getAttribute('data-profile-dropdown') === 'hidden';
    
    if (isHidden) {
        openProfileDropdown();
    } else {
        closeProfileDropdown();
    }
}

/**
 * Open profile dropdown
 */
function openProfileDropdown() {
    NavbarDOM.profileDropdown.setAttribute('data-profile-dropdown', 'visible');
    NavbarDOM.profileButton.setAttribute('aria-expanded', 'true');
}

/**
 * Close profile dropdown
 */
function closeProfileDropdown() {
    NavbarDOM.profileDropdown.setAttribute('data-profile-dropdown', 'hidden');
    NavbarDOM.profileButton.setAttribute('aria-expanded', 'false');
}

/**
 * Close dropdown when clicking outside
 * @param {Event} e - Click event
 */
function handleOutsideClick(e) {
    const isClickInsideProfile = NavbarDOM.profileButton.contains(e.target) || 
                                NavbarDOM.profileDropdown.contains(e.target);
    
    const isClickInsideHelp = NavbarDOM.helpButton && 
                             (NavbarDOM.helpButton.contains(e.target) || 
                              NavbarDOM.helpDropdown.contains(e.target));
    
    if (!isClickInsideProfile) {
        closeProfileDropdown();
    }
    
    if (!isClickInsideHelp) {
        closeHelpDropdown();
    }
}

// ==========================================================================
// Help Dropdown Functions
// ==========================================================================

/**
 * Toggle help dropdown visibility
 */
function toggleHelpDropdown() {
    const isHidden = NavbarDOM.helpDropdown.getAttribute('data-help-dropdown') === 'hidden';
    
    if (isHidden) {
        openHelpDropdown();
    } else {
        closeHelpDropdown();
    }
}

/**
 * Open help dropdown
 */
function openHelpDropdown() {
    // Close profile dropdown if open
    closeProfileDropdown();
    
    NavbarDOM.helpDropdown.setAttribute('data-help-dropdown', 'visible');
    NavbarDOM.helpButton.setAttribute('aria-expanded', 'true');
}

/**
 * Close help dropdown
 */
function closeHelpDropdown() {
    NavbarDOM.helpDropdown.setAttribute('data-help-dropdown', 'hidden');
    NavbarDOM.helpButton.setAttribute('aria-expanded', 'false');
}

// ==========================================================================
// User Data Management
// ==========================================================================

/**
 * Load and display user information
 */
function loadUserInfo() {
    const userDataString = sessionStorage.getItem('user');
    
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            updateUserDisplay(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            setDefaultUserInfo();
        }
    } else {
        setDefaultUserInfo();
    }
}

/**
 * Update user display with data
 * @param {Object} userData - User data object
 */
function updateUserDisplay(userData) {
    const fullName = userData.fullName || 'User';
    const email = userData.email || userData.emailAddress || 'user@adani.com';
    
    // Update navbar user info
    if (NavbarDOM.userName) {
        NavbarDOM.userName.textContent = fullName;
    }
    
    if (NavbarDOM.userEmail) {
        NavbarDOM.userEmail.textContent = email;
    }
    
    // Update dropdown user info
    if (NavbarDOM.dropdownUserName) {
        NavbarDOM.dropdownUserName.textContent = fullName;
    }
    
    if (NavbarDOM.dropdownUserEmail) {
        NavbarDOM.dropdownUserEmail.textContent = email;
    }
}

/**
 * Set default user information
 */
function setDefaultUserInfo() {
    const defaultUser = {
        fullName: 'User',
        email: 'user@adani.com'
    };
    updateUserDisplay(defaultUser);
}

/**
 * Get initials from full name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
function getInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return 'U';
}

// ==========================================================================
// Navigation Actions
// ==========================================================================

/**
 * Handle sign out action
 */
function handleSignout() {
    console.log('Signing out...');
    
    // Clear session data
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    localStorage.clear();
    
    // Redirect to signin page
    window.location.href = 'signin.html';
}

/**
 * Handle view profile action
 * @param {Event} e - Click event
 */
function handleViewProfile(e) {
    e.preventDefault();
    console.log('View profile clicked');
    closeProfileDropdown();
    window.location.href = 'profile.html';
}

/**
 * Handle view settings action
 * @param {Event} e - Click event
 */
function handleViewSettings(e) {
    e.preventDefault();
    console.log('View settings clicked');
    closeProfileDropdown();
    window.location.href = 'settings.html';
}

/**
 * Handle view keyboard shortcuts action
 * @param {Event} e - Click event
 */
function handleViewShortcuts(e) {
    e.preventDefault();
    console.log('View keyboard shortcuts clicked');
    closeHelpDropdown();
    // TODO: Open keyboard shortcuts modal
    alert('Keyboard Shortcuts:\n\n' +
          'Ctrl/Cmd + K: Quick Search\n' +
          'Ctrl/Cmd + B: Toggle Sidebar\n' +
          'Ctrl/Cmd + ,: Settings\n' +
          'Ctrl/Cmd + /: Help\n' +
          'Esc: Close Dropdown');
}

/**
 * Handle view documentation action
 * @param {Event} e - Click event
 */
function handleViewDocs(e) {
    e.preventDefault();
    console.log('View documentation clicked');
    closeHelpDropdown();
    // TODO: Navigate to documentation page
    window.open('https://docs.adani-fintell-suite.com', '_blank');
}

// ==========================================================================
// Event Listeners
// ==========================================================================

/**
 * Initialize event listeners
 */
function initNavbarEventListeners() {
    // Profile dropdown toggle
    if (NavbarDOM.profileButton) {
        NavbarDOM.profileButton.addEventListener('click', toggleProfileDropdown);
    }
    
    // Help dropdown toggle
    if (NavbarDOM.helpButton) {
        NavbarDOM.helpButton.addEventListener('click', toggleHelpDropdown);
    }
    
    // Signout button
    if (NavbarDOM.signoutButton) {
        NavbarDOM.signoutButton.addEventListener('click', handleSignout);
    }
    
    // Profile actions
    if (NavbarDOM.viewProfileBtn) {
        NavbarDOM.viewProfileBtn.addEventListener('click', handleViewProfile);
    }
    
    if (NavbarDOM.viewSettingsBtn) {
        NavbarDOM.viewSettingsBtn.addEventListener('click', handleViewSettings);
    }
    
    // Help actions
    if (NavbarDOM.viewShortcutsBtn) {
        NavbarDOM.viewShortcutsBtn.addEventListener('click', handleViewShortcuts);
    }
    
    if (NavbarDOM.viewDocsBtn) {
        NavbarDOM.viewDocsBtn.addEventListener('click', handleViewDocs);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', handleOutsideClick);
    
    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProfileDropdown();
            closeHelpDropdown();
        }
    });
}

// ==========================================================================
// Initialization
// ==========================================================================

/**
 * Initialize navbar functionality
 */
function initNavbar() {
    console.log('Navbar initialized');
    
    // Re-query DOM elements in case they were just loaded
    Object.keys(NavbarDOM).forEach(key => {
        const selector = {
            profileButton: '[data-action="toggle-profile-menu"]',
            profileDropdown: '[data-profile-dropdown]',
            helpButton: '[data-action="toggle-help-menu"]',
            helpDropdown: '[data-help-dropdown]',
            signoutButton: '[data-action="signout"]',
            viewProfileBtn: '[data-action="view-profile"]',
            viewSettingsBtn: '[data-action="view-settings"]',
            viewShortcutsBtn: '[data-action="view-shortcuts"]',
            viewDocsBtn: '[data-action="view-docs"]',
            userName: '[data-user-name]',
            userEmail: '[data-user-email]',
            dropdownUserName: '[data-dropdown-user-name]',
            dropdownUserEmail: '[data-dropdown-user-email]'
        };
        
        if (selector[key]) {
            NavbarDOM[key] = document.querySelector(selector[key]);
        }
    });
    
    // Load user information
    loadUserInfo();
    
    // Setup event listeners
    initNavbarEventListeners();
}

// Auto-initialize when DOM is ready OR when templates are loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}

// Re-initialize when templates are loaded (for dynamic template loading)
document.addEventListener('templatesLoaded', () => {
    console.log('Templates loaded, re-initializing navbar');
    initNavbar();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavbar,
        loadUserInfo,
        closeProfileDropdown,
        closeHelpDropdown
    };
}
