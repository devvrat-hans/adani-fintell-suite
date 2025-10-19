/**
 * Adani-Fintell-Suite - Profile Page JavaScript
 * User profile display and management functionality
 */

'use strict';

// ==========================================================================
// DOM Elements
// ==========================================================================

const ProfileDOM = {
    avatarCircle: document.querySelector('[data-avatar-circle]'),
    avatarInitials: document.querySelector('[data-avatar-initials]'),
    profileName: document.querySelector('[data-profile-name]'),
    profileEmail: document.querySelector('[data-profile-email]'),
    infoName: document.querySelector('[data-info-name]'),
    infoEmail: document.querySelector('[data-info-email]'),
    infoUserid: document.querySelector('[data-info-userid]'),
    infoRole: document.querySelector('[data-info-role]'),
    infoStatus: document.querySelector('[data-info-status]'),
    infoMemberSince: document.querySelector('[data-info-member-since]'),
    infoLastLogin: document.querySelector('[data-info-last-login]'),
    infoDepartment: document.querySelector('[data-info-department]'),
    infoOrganization: document.querySelector('[data-info-organization]'),
    infoEntities: document.querySelector('[data-info-entities]'),
    editProfileBtn: document.querySelector('[data-action="edit-profile"]'),
    changePasswordBtn: document.querySelector('[data-action="change-password"]')
};

// ==========================================================================
// User Data Management
// ==========================================================================

/**
 * Load and display user information
 */
function loadUserProfile() {
    const userDataString = sessionStorage.getItem('user');
    
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            displayUserProfile(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            displayDefaultProfile();
        }
    } else {
        displayDefaultProfile();
    }
}

/**
 * Display user profile information
 * @param {Object} userData - User data object
 */
function displayUserProfile(userData) {
    // Extract data from user object
    const fullName = userData.fullName || userData.name || 'User';
    const email = userData.email || userData.emailAddress || 'user@adani.com';
    const userId = userData.userId || userData.id || '-';
    const role = userData.role || userData.userRole || 'User';
    const department = userData.department || userData.dept || '-';
    const organization = userData.organization || userData.org || 'Adani Group';
    const memberSince = userData.createdAt || userData.joinDate || '-';
    const lastLogin = userData.lastLogin || new Date().toLocaleString();
    const entities = userData.entities || userData.accessibleEntities || [];
    
    // Update avatar initials
    const initials = getInitials(fullName);
    if (ProfileDOM.avatarInitials) {
        ProfileDOM.avatarInitials.textContent = initials;
    }
    
    // Update profile header
    if (ProfileDOM.profileName) {
        ProfileDOM.profileName.textContent = fullName;
    }
    
    if (ProfileDOM.profileEmail) {
        ProfileDOM.profileEmail.textContent = email;
    }
    
    // Update personal information
    if (ProfileDOM.infoName) {
        ProfileDOM.infoName.textContent = fullName;
    }
    
    if (ProfileDOM.infoEmail) {
        ProfileDOM.infoEmail.textContent = email;
    }
    
    if (ProfileDOM.infoUserid) {
        ProfileDOM.infoUserid.textContent = userId;
    }
    
    if (ProfileDOM.infoRole) {
        ProfileDOM.infoRole.textContent = role;
    }
    
    // Update account information
    if (ProfileDOM.infoMemberSince) {
        ProfileDOM.infoMemberSince.textContent = formatDate(memberSince);
    }
    
    if (ProfileDOM.infoLastLogin) {
        ProfileDOM.infoLastLogin.textContent = formatDate(lastLogin);
    }
    
    if (ProfileDOM.infoDepartment) {
        ProfileDOM.infoDepartment.textContent = department;
    }
    
    // Update additional details
    if (ProfileDOM.infoOrganization) {
        ProfileDOM.infoOrganization.textContent = organization;
    }
    
    if (ProfileDOM.infoEntities) {
        if (Array.isArray(entities) && entities.length > 0) {
            ProfileDOM.infoEntities.textContent = entities.join(', ');
        } else {
            ProfileDOM.infoEntities.textContent = 'All entities';
        }
    }
}

/**
 * Display default profile information
 */
function displayDefaultProfile() {
    const defaultUser = {
        fullName: 'User',
        email: 'user@adani.com',
        userId: '-',
        role: 'User',
        department: '-',
        organization: 'Adani Group',
        memberSince: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        entities: []
    };
    
    displayUserProfile(defaultUser);
}

/**
 * Get initials from full name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
function getInitials(name) {
    if (!name) return 'U';
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return 'U';
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    if (!dateString || dateString === '-') return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Return as is if not a valid date
        }
        
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        return dateString;
    }
}

// ==========================================================================
// Action Handlers
// ==========================================================================

/**
 * Handle edit profile action
 */
function handleEditProfile() {
    console.log('Edit profile clicked');
    // TODO: Implement edit profile functionality
    alert('Edit profile functionality coming soon!');
}

/**
 * Handle change password action
 */
function handleChangePassword() {
    console.log('Change password clicked');
    // TODO: Implement change password functionality
    alert('Change password functionality coming soon!');
}

// ==========================================================================
// Event Listeners
// ==========================================================================

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Edit profile button
    if (ProfileDOM.editProfileBtn) {
        ProfileDOM.editProfileBtn.addEventListener('click', handleEditProfile);
    }
    
    // Change password button
    if (ProfileDOM.changePasswordBtn) {
        ProfileDOM.changePasswordBtn.addEventListener('click', handleChangePassword);
    }
}

// ==========================================================================
// Authentication Check
// ==========================================================================

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    
    if (!isAuthenticated || isAuthenticated !== 'true') {
        console.log('User not authenticated, redirecting to signin');
        window.location.href = 'signin.html';
        return false;
    }
    
    return true;
}

// ==========================================================================
// Initialization
// ==========================================================================

/**
 * Initialize profile page
 */
function initProfile() {
    console.log('Profile page initialized');
    
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Load user profile
    loadUserProfile();
    
    // Setup event listeners
    initEventListeners();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile);
} else {
    initProfile();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initProfile,
        loadUserProfile,
        displayUserProfile
    };
}
