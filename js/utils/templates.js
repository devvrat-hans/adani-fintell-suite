/**
 * Templates - HTML component templates for reusable UI elements
 * Loads sidebar and navbar from HTML template files
 */

// Cache for loaded templates
const templateCache = {
    sidebar: null,
    navbar: null
};

/**
 * Load HTML template file
 * @param {string} templateName - Name of template ('sidebar' or 'navbar')
 * @returns {Promise<string>} HTML content of template
 */
async function loadTemplate(templateName) {
    // Return cached template if available
    if (templateCache[templateName]) {
        return templateCache[templateName];
    }

    try {
        const response = await fetch(`templates/shared/${templateName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${templateName}`);
        }
        
        const html = await response.text();
        templateCache[templateName] = html;
        return html;
    } catch (error) {
        console.error(`Template loading error for ${templateName}:`, error);
        return '';
    }
}

/**
 * Get sidebar template HTML
 * @param {string} activePage - Current active page identifier
 * @returns {Promise<string>} HTML string for sidebar
 */
export async function getSidebarTemplate(activePage = 'home') {
    const html = await loadTemplate('sidebar');
    
    // Create temporary container to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Set active page
    const links = temp.querySelectorAll('[data-page]');
    links.forEach(link => {
        if (link.dataset.page === activePage) {
            link.classList.add('app-sidebar__link--active');
        } else {
            link.classList.remove('app-sidebar__link--active');
        }
    });
    
    return temp.innerHTML;
}

/**
 * Get header/navbar template HTML
 * @param {Object} user - User information object
 * @param {string} user.name - Full name of user
 * @param {string} user.role - User role/designation
 * @param {string} user.initials - User initials for avatar
 * @returns {Promise<string>} HTML string for header
 */
export async function getHeaderTemplate(user = {}) {
    const defaultUser = {
        name: 'Admin User',
        role: 'Administrator',
        initials: 'AU'
    };

    const userData = { ...defaultUser, ...user };
    const html = await loadTemplate('navbar');
    
    // Create temporary container to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Update user info
    const initialsElement = temp.querySelector('[data-user-initials]');
    if (initialsElement) {
        initialsElement.textContent = userData.initials;
    }
    
    const nameElement = temp.querySelector('[data-user-name]');
    if (nameElement) {
        nameElement.textContent = userData.name;
    }
    
    const roleElement = temp.querySelector('[data-user-role]');
    if (roleElement) {
        roleElement.textContent = userData.role;
    }
    
    return temp.innerHTML;
}

/**
 * Initialize templates on a page
 * Renders sidebar and header into the app container
 * @param {Object} config - Configuration object
 * @param {string} config.activePage - Current active page identifier
 * @param {Object} config.user - User information object
 * @returns {Promise<void>}
 */
export async function initTemplates(config = {}) {
    const {
        activePage = 'home',
        user = {}
    } = config;

    // Find the app container
    const appContainer = document.querySelector('.app-container');
    
    if (!appContainer) {
        console.error('Templates: .app-container not found');
        return;
    }

    try {
        // Generate sidebar and header HTML (async)
        const sidebarHTML = await getSidebarTemplate(activePage);
        const headerHTML = await getHeaderTemplate(user);

        // Insert sidebar as first child
        appContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
        
        // Insert header after sidebar
        const sidebar = appContainer.querySelector('.app-sidebar');
        if (sidebar) {
            sidebar.insertAdjacentHTML('afterend', headerHTML);
        }

        // Initialize user menu interactions
        initUserMenu();
        
        // Initialize help menu interactions
        initHelpMenu();
    } catch (error) {
        console.error('Templates initialization error:', error);
    }
}

/**
 * Initialize user profile menu interactions
 * Adds click handler for dropdown menu functionality
 */
function initUserMenu() {
    const userMenuTrigger = document.querySelector('[data-user-menu-trigger]');
    const dropdown = document.querySelector('[data-user-dropdown]');
    const logoutBtn = document.querySelector('[data-logout]');
    
    if (userMenuTrigger && dropdown) {
        // Toggle dropdown on user profile click
        userMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('is-open');
            
            // Close help menu if open
            const helpDropdown = document.querySelector('[data-help-dropdown]');
            if (helpDropdown) {
                helpDropdown.classList.remove('is-open');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !userMenuTrigger.contains(e.target)) {
                dropdown.classList.remove('is-open');
            }
        });
        
        // Close dropdown when clicking on a menu item
        dropdown.querySelectorAll('.app-header__dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                dropdown.classList.remove('is-open');
            });
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Future: Implement actual logout functionality
            if (confirm('Are you sure you want to logout?')) {
                console.log('Logout confirmed');
                // Redirect to login page or clear session
                window.location.href = 'index.html';
            }
        });
    }
}

/**
 * Initialize help menu interactions
 * Adds click handler for help dropdown menu functionality
 */
function initHelpMenu() {
    const helpMenuTrigger = document.querySelector('[data-help-menu-trigger]');
    const helpDropdown = document.querySelector('[data-help-dropdown]');
    
    if (helpMenuTrigger && helpDropdown) {
        // Toggle dropdown on help icon click
        helpMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            helpDropdown.classList.toggle('is-open');
            
            // Close user menu if open
            const userDropdown = document.querySelector('[data-user-dropdown]');
            if (userDropdown) {
                userDropdown.classList.remove('is-open');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!helpDropdown.contains(e.target) && !helpMenuTrigger.contains(e.target)) {
                helpDropdown.classList.remove('is-open');
            }
        });
        
        // Close dropdown when clicking on a menu item
        helpDropdown.querySelectorAll('.app-header__dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                helpDropdown.classList.remove('is-open');
            });
        });
    }
}

/**
 * Update user information in the header
 * @param {Object} user - User information object
 * @param {string} user.name - Full name of user
 * @param {string} user.role - User role/designation
 * @param {string} user.initials - User initials for avatar
 */
export function updateUserInfo(user) {
    const userName = document.querySelector('.app-header__user-name');
    const userRole = document.querySelector('.app-header__user-role');
    const userAvatar = document.querySelector('.app-header__user-avatar');

    if (userName && user.name) {
        userName.textContent = user.name;
    }

    if (userRole && user.role) {
        userRole.textContent = user.role;
    }

    if (userAvatar && user.initials) {
        userAvatar.textContent = user.initials;
    }
}

/**
 * Highlight active sidebar link based on current page
 * @param {string} pageId - Page identifier to activate
 */
export function setActivePage(pageId) {
    // Remove active class from all links
    const allLinks = document.querySelectorAll('.app-sidebar__link');
    allLinks.forEach(link => {
        link.classList.remove('app-sidebar__link--active');
    });

    // Add active class to the matching link
    const links = [
        { id: 'home', href: 'index.html' },
        { id: 'finguard', href: 'finguard.html' },
        { id: 'sheetsense', href: 'sheetsense.html' },
        { id: 'analytics', href: 'analytics.html' },
        { id: 'settings', href: 'settings.html' }
    ];

    const matchingLink = links.find(l => l.id === pageId);
    if (matchingLink) {
        const linkElement = document.querySelector(`a[href="${matchingLink.href}"]`);
        if (linkElement) {
            linkElement.classList.add('app-sidebar__link--active');
        }
    }
}

// Export default object with all functions
export default {
    getSidebarTemplate,
    getHeaderTemplate,
    initTemplates,
    updateUserInfo,
    setActivePage
};