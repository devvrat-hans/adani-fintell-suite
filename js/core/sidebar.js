/**
 * Adani Fintell Suite - Sidebar JavaScript
 * Navigation and sidebar toggle functionality
 */

'use strict';

// ==========================================================================
// DOM Elements
// ==========================================================================

const SidebarDOM = {
    sidebar: document.querySelector('.app-sidebar'),
    sidebarLinks: document.querySelectorAll('.sidebar-link'),
    toggleButton: document.querySelector('[data-action="toggle-sidebar"]')
};

// Track if event listeners have been attached to document-level events
let documentListenersAttached = false;

// ==========================================================================
// Sidebar State Management
// ==========================================================================

/**
 * Toggle sidebar visibility (mobile)
 */
function toggleSidebar() {
    const isHidden = SidebarDOM.sidebar.getAttribute('data-sidebar') === 'hidden';
    
    if (isHidden) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

/**
 * Open sidebar
 */
function openSidebar() {
    if (SidebarDOM.sidebar) {
        SidebarDOM.sidebar.setAttribute('data-sidebar', 'visible');
    }
}

/**
 * Close sidebar
 */
function closeSidebar() {
    if (SidebarDOM.sidebar) {
        SidebarDOM.sidebar.setAttribute('data-sidebar', 'hidden');
    }
}

/**
 * Close sidebar when clicking outside (mobile)
 * @param {Event} e - Click event
 */
function handleOutsideClick(e) {
    const isMobile = window.innerWidth <= 768;
    const isClickInsideSidebar = SidebarDOM.sidebar && SidebarDOM.sidebar.contains(e.target);
    const isClickOnToggle = SidebarDOM.toggleButton && SidebarDOM.toggleButton.contains(e.target);
    
    if (isMobile && !isClickInsideSidebar && !isClickOnToggle) {
        closeSidebar();
    }
}

// ==========================================================================
// Active Link Management
// ==========================================================================

/**
 * Set active sidebar link based on current page
 */
function setActiveSidebarLink() {
    const currentPage = getCurrentPageName();
    
    // Re-query sidebar links in case they were dynamically loaded
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    if (!sidebarLinks || sidebarLinks.length === 0) {
        console.warn('No sidebar links found');
        return;
    }
    
    console.log('Setting active link for page:', currentPage);
    
    sidebarLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        
        if (linkPage === currentPage) {
            link.classList.add('active');
            console.log('Active link set:', linkPage);
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Get current page name from URL
 * @returns {string} - Page name
 */
function getCurrentPageName() {
    const path = window.location.pathname;
    let page = path.split('/').pop().replace('.html', '');
    
    // Handle empty page or index
    if (!page || page === 'index') {
        page = 'dashboard';
    }
    
    return page;
}

/**
 * Handle sidebar link click
 * @param {Event} e - Click event
 */
function handleSidebarLinkClick(e) {
    // Remove active class from all links
    SidebarDOM.sidebarLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    e.currentTarget.classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        setTimeout(closeSidebar, 200);
    }
}

// ==========================================================================
// Responsive Behavior
// ==========================================================================

/**
 * Handle window resize
 */
function handleResize() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // On mobile, sidebar is hidden by default
        if (!SidebarDOM.sidebar.hasAttribute('data-sidebar')) {
            SidebarDOM.sidebar.setAttribute('data-sidebar', 'hidden');
        }
    } else {
        // On desktop, remove the attribute to show sidebar
        SidebarDOM.sidebar.removeAttribute('data-sidebar');
    }
}

// Debounce resize handler
let resizeTimer;
function debouncedResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 250);
}

// ==========================================================================
// Event Listeners
// ==========================================================================

/**
 * Initialize event listeners
 */
function initSidebarEventListeners() {
    // Toggle button
    if (SidebarDOM.toggleButton) {
        SidebarDOM.toggleButton.addEventListener('click', toggleSidebar);
    }
    
    // Sidebar links
    if (SidebarDOM.sidebarLinks && SidebarDOM.sidebarLinks.length > 0) {
        SidebarDOM.sidebarLinks.forEach(link => {
            link.addEventListener('click', handleSidebarLinkClick);
        });
    }
    
    // Document-level event listeners (only attach once)
    if (!documentListenersAttached) {
        // Outside clicks (mobile)
        document.addEventListener('click', handleOutsideClick);
        
        // Window resize
        window.addEventListener('resize', debouncedResize);
        
        // Close sidebar on escape key (mobile)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && window.innerWidth <= 768) {
                closeSidebar();
            }
        });
        
        documentListenersAttached = true;
    }
}

// ==========================================================================
// Initialization
// ==========================================================================

// ==========================================================================
// Submenu Positioning
// ==========================================================================

/**
 * Keep submenu open for the section with the active page
 */
function setupSubmenuHandlers() {
    console.log('Setting up submenu handlers');
    
    const sectionGroups = document.querySelectorAll('.sidebar-section-group');
    
    // First, check if there's a stored section from previous navigation
    const storedSection = sessionStorage.getItem('sidebar-active-section');
    
    if (storedSection !== null) {
        // Apply stored state
        console.log('Applying stored section:', storedSection);
        sectionGroups.forEach((group, index) => {
            if (index === parseInt(storedSection)) {
                group.classList.add('sidebar-section-active');
                console.log('Set section', index, 'as active');
            }
        });
    } else {
        // Default: open the section that contains the active link
        const activeLink = document.querySelector('.sidebar-link.active');
        if (activeLink) {
            const parentGroup = activeLink.closest('.sidebar-section-group');
            if (parentGroup) {
                const groups = Array.from(sectionGroups);
                const index = groups.indexOf(parentGroup);
                parentGroup.classList.add('sidebar-section-active');
                sessionStorage.setItem('sidebar-active-section', index.toString());
                console.log('Set section', index, 'as active (from active link)');
            }
        }
    }
    
    // Track when user hovers over a different section
    sectionGroups.forEach((group, index) => {
        group.addEventListener('mouseenter', () => {
            sessionStorage.setItem('sidebar-active-section', index.toString());
        });
    });
    
    // Store state when clicking a link to navigate
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const parentGroup = link.closest('.sidebar-section-group');
            if (parentGroup) {
                const groups = Array.from(sectionGroups);
                const index = groups.indexOf(parentGroup);
                sessionStorage.setItem('sidebar-active-section', index.toString());
                console.log('Storing section', index, 'before navigation');
            }
        });
    });
}

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
    console.log('Sidebar initialized');
    
    // Re-query DOM elements in case they were just loaded
    SidebarDOM.sidebar = document.querySelector('.app-sidebar');
    SidebarDOM.sidebarLinks = document.querySelectorAll('.sidebar-link');
    SidebarDOM.toggleButton = document.querySelector('[data-action="toggle-sidebar"]');
    
    // Set active link based on current page
    setActiveSidebarLink();
    
    // Handle initial responsive state
    handleResize();
    
    // Setup event listeners
    initSidebarEventListeners();
    
    // Setup submenu handlers
    setupSubmenuHandlers();
}

// Auto-initialize when DOM is ready OR when templates are loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}

// Re-initialize when templates are loaded (for dynamic template loading)
document.addEventListener('templatesLoaded', () => {
    console.log('Templates loaded, re-initializing sidebar');
    initSidebar();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSidebar,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        setActiveSidebarLink
    };
}
