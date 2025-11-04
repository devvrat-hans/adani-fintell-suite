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
    // Re-query sidebar in case it was dynamically loaded
    if (!SidebarDOM.sidebar) {
        SidebarDOM.sidebar = document.querySelector('.app-sidebar');
    }
    
    if (!SidebarDOM.sidebar) {
        return; // Sidebar not loaded yet
    }
    
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

// Track currently hovered section
let currentlyHoveredSection = null;

/**
 * Keep submenu open for the section with the active page
 */
function setupSubmenuHandlers() {
    console.log('Setting up submenu handlers');
    
    const sectionGroups = document.querySelectorAll('.sidebar-section-group');
    
    // Hide all submenus by default
    sectionGroups.forEach(group => {
        const submenu = group.querySelector('.sidebar-submenu');
        if (submenu) {
            submenu.style.display = 'none';
        }
    });
    
    // Create a shared submenu container
    const sharedSubmenu = document.createElement('div');
    sharedSubmenu.className = 'sidebar-submenu sidebar-submenu-shared';
    sharedSubmenu.style.position = 'fixed';
    sharedSubmenu.style.left = 'var(--sidebar-collapsed-width)';
    sharedSubmenu.style.top = 'var(--navbar-height, 64px)';
    sharedSubmenu.style.width = 'var(--submenu-width)';
    sharedSubmenu.style.height = 'calc(100vh - var(--navbar-height, 64px))';
    sharedSubmenu.style.background = 'var(--sidebar-bg)';
    sharedSubmenu.style.border = '1px solid var(--sidebar-border)';
    sharedSubmenu.style.borderLeft = 'none';
    sharedSubmenu.style.boxShadow = '2px 0 8px rgba(0, 0, 0, 0.1)';
    sharedSubmenu.style.opacity = '0';
    sharedSubmenu.style.visibility = 'hidden';
    sharedSubmenu.style.pointerEvents = 'none';
    sharedSubmenu.style.zIndex = '10003';
    sharedSubmenu.style.overflowY = 'auto';
    sharedSubmenu.style.borderRadius = '0';
    sharedSubmenu.style.transition = 'none';
    
    document.body.appendChild(sharedSubmenu);
    
    // Function to update shared submenu content (instant, no fade)
    function updateSharedSubmenu(group) {
        const originalSubmenu = group.querySelector('.sidebar-submenu');
        if (originalSubmenu) {
            // Clone the content
            const clonedContent = originalSubmenu.cloneNode(true);
            clonedContent.style.display = 'block';
            clonedContent.style.position = 'static';
            clonedContent.style.width = 'auto';
            clonedContent.style.height = 'auto';
            clonedContent.style.opacity = '1';
            clonedContent.style.visibility = 'visible';
            clonedContent.style.border = 'none';
            clonedContent.style.boxShadow = 'none';
            clonedContent.style.transition = 'none';
            clonedContent.style.pointerEvents = 'auto';
            
            // Remove all transitions from child elements and ensure pointer events
            const allElements = clonedContent.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.transition = 'none';
                el.style.pointerEvents = 'auto';
            });
            
            // Ensure all links are clickable
            const allLinks = clonedContent.querySelectorAll('.sidebar-link');
            allLinks.forEach(link => {
                link.style.pointerEvents = 'auto';
                link.style.cursor = 'pointer';
            });
            
            // Replace content instantly
            sharedSubmenu.innerHTML = '';
            sharedSubmenu.appendChild(clonedContent);
        }
    }
    
    // Sidebar submenu should be collapsed by default on page load
    // No auto-opening of submenus
    
    // Track hover state
    let closeTimeout = null;
    const sidebar = document.querySelector('.app-sidebar');
    let isOverSidebarArea = false;
    
    // Track sidebar and shared submenu hover
    if (sidebar) {
        sidebar.addEventListener('mouseenter', () => {
            isOverSidebarArea = true;
        });
        
        sidebar.addEventListener('mouseleave', (e) => {
            const relatedTarget = e.relatedTarget;
            const movingToSubmenu = relatedTarget === sharedSubmenu || sharedSubmenu.contains(relatedTarget);
            
            if (!movingToSubmenu) {
                isOverSidebarArea = false;
                closeTimeout = setTimeout(() => {
                    if (!isOverSidebarArea) {
                        sharedSubmenu.style.opacity = '0';
                        sharedSubmenu.style.visibility = 'hidden';
                        sharedSubmenu.style.pointerEvents = 'none';
                        sectionGroups.forEach(g => g.classList.remove('sidebar-section-active'));
                        currentlyHoveredSection = null;
                    }
                }, 150);
            }
        });
    }
    
    sharedSubmenu.addEventListener('mouseenter', () => {
        isOverSidebarArea = true;
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
    });
    
    sharedSubmenu.addEventListener('mouseleave', (e) => {
        const relatedTarget = e.relatedTarget;
        const movingToSidebar = relatedTarget === sidebar || sidebar.contains(relatedTarget);
        
        if (!movingToSidebar) {
            isOverSidebarArea = false;
            closeTimeout = setTimeout(() => {
                if (!isOverSidebarArea) {
                    sharedSubmenu.style.opacity = '0';
                    sharedSubmenu.style.visibility = 'hidden';
                    sharedSubmenu.style.pointerEvents = 'none';
                    sectionGroups.forEach(g => g.classList.remove('sidebar-section-active'));
                    currentlyHoveredSection = null;
                }
            }, 150);
        }
    });
    
    // Handle section header hover
    sectionGroups.forEach((group, index) => {
        const sectionHeader = group.querySelector('.sidebar-section-header');
        
        if (sectionHeader) {
            sectionHeader.addEventListener('mouseenter', () => {
                if (closeTimeout) {
                    clearTimeout(closeTimeout);
                    closeTimeout = null;
                }
                
                // Update active state
                sectionGroups.forEach(g => g.classList.remove('sidebar-section-active'));
                group.classList.add('sidebar-section-active');
                currentlyHoveredSection = group;
                
                // Show and update shared submenu instantly (no fade)
                sharedSubmenu.style.opacity = '1';
                sharedSubmenu.style.visibility = 'visible';
                sharedSubmenu.style.pointerEvents = 'auto';
                updateSharedSubmenu(group);
                
                sessionStorage.setItem('sidebar-active-section', index.toString());
            });
        }
    });
    
    // Handle link clicks for navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.sidebar-link');
        if (link) {
            const parentGroup = link.closest('.sidebar-section-group');
            if (!parentGroup) {
                // Link is in shared submenu, find original group
                const linkPage = link.getAttribute('data-page');
                sectionGroups.forEach((group, index) => {
                    const originalLink = group.querySelector(`[data-page="${linkPage}"]`);
                    if (originalLink) {
                        sessionStorage.setItem('sidebar-active-section', index.toString());
                    }
                });
            } else {
                const groups = Array.from(sectionGroups);
                const index = groups.indexOf(parentGroup);
                sessionStorage.setItem('sidebar-active-section', index.toString());
            }
        }
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
