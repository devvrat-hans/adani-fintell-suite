/**
 * Adani Fintell Suite - Index Page JavaScript
 * Main landing page interactions and animations
 */

'use strict';

// ==========================================================================
// State Management
// ==========================================================================

const AppState = {
    currentSection: 'home',
    isLoading: false,
    
    /**
     * Update current section
     * @param {string} section - Section name
     */
    setCurrentSection(section) {
        this.currentSection = section;
    },
    
    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        toggleLoadingOverlay(loading);
    }
};

// ==========================================================================
// DOM Elements Cache
// ==========================================================================

const DOM = {
    navLinks: document.querySelectorAll('[data-nav]'),
    actionButtons: document.querySelectorAll('[data-action]'),
    loadingOverlay: document.querySelector('[data-loading]'),
    statNumbers: document.querySelectorAll('[data-stat]'),
    moduleCards: document.querySelectorAll('[data-module]'),
};

// ==========================================================================
// Navigation & Smooth Scrolling
// ==========================================================================

/**
 * Initialize navigation event listeners
 */
function initNavigation() {
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
}

/**
 * Handle navigation link clicks
 * @param {Event} e - Click event
 */
function handleNavClick(e) {
    e.preventDefault();
    
    const targetSection = e.currentTarget.getAttribute('data-nav');
    const targetElement = document.getElementById(targetSection);
    
    if (targetElement) {
        // Smooth scroll to section
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Update active state
        updateActiveNavLink(e.currentTarget);
        AppState.setCurrentSection(targetSection);
    }
}

/**
 * Update active navigation link
 * @param {HTMLElement} activeLink - Active link element
 */
function updateActiveNavLink(activeLink) {
    DOM.navLinks.forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// ==========================================================================
// Action Button Handlers
// ==========================================================================

/**
 * Initialize action button event listeners
 */
function initActionButtons() {
    DOM.actionButtons.forEach(button => {
        button.addEventListener('click', handleActionClick);
    });
}

/**
 * Handle action button clicks
 * @param {Event} e - Click event
 */
function handleActionClick(e) {
    const action = e.currentTarget.getAttribute('data-action');
    
    switch (action) {
        case 'login':
            handleLogin();
            break;
        case 'get-started':
            handleGetStarted();
            break;
        case 'explore-finguard':
            handleExploreFinguard();
            break;
        case 'explore-sheetsense':
            handleExploreSheetSense();
            break;
        case 'learn-more-finguard':
            handleLearnMoreFinguard();
            break;
        case 'learn-more-sheetsense':
            handleLearnMoreSheetSense();
            break;
        default:
            console.log(`Action not handled: ${action}`);
    }
}

/**
 * Handle login action
 */
function handleLogin() {
    console.log('Sign in action triggered');
    // Navigate to sign in page
    window.location.href = 'signin.html';
}

/**
 * Handle get started action
 */
function handleGetStarted() {
    console.log('Get started action triggered');
    const modulesSection = document.getElementById('modules');
    if (modulesSection) {
        modulesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Handle explore FinGuard action
 */
function handleExploreFinguard() {
    console.log('Explore FinGuard triggered');
    AppState.setLoading(true);
    
    setTimeout(() => {
        AppState.setLoading(false);
        // TODO: Navigate to FinGuard module
    }, 1500);
}

/**
 * Handle explore SheetSense action
 */
function handleExploreSheetSense() {
    console.log('Explore SheetSense triggered');
    AppState.setLoading(true);
    
    setTimeout(() => {
        AppState.setLoading(false);
        // TODO: Navigate to SheetSense module
    }, 1500);
}

/**
 * Handle learn more FinGuard action
 */
function handleLearnMoreFinguard() {
    console.log('Learn more about FinGuard');
    // TODO: Show detailed module information
}

/**
 * Handle learn more SheetSense action
 */
function handleLearnMoreSheetSense() {
    console.log('Learn more about SheetSense');
    // TODO: Show detailed module information
}

// ==========================================================================
// Loading Overlay
// ==========================================================================

/**
 * Toggle loading overlay visibility
 * @param {boolean} show - Show or hide overlay
 */
function toggleLoadingOverlay(show) {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.setAttribute('data-loading', show ? 'visible' : 'hidden');
        DOM.loadingOverlay.setAttribute('aria-busy', show.toString());
    }
}

// ==========================================================================
// Animated Counter for Statistics
// ==========================================================================

/**
 * Animate numbers counting up
 * @param {HTMLElement} element - Element containing the number
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 */
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Initialize statistics animation when in viewport
 */
function initStatsAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statElement = entry.target;
                const originalText = statElement.textContent;
                const numericValue = parseInt(originalText.replace(/[^\d]/g, ''), 10);
                
                if (!isNaN(numericValue)) {
                    animateCounter(statElement, numericValue);
                }
                
                observer.unobserve(statElement);
            }
        });
    }, { threshold: 0.5 });
    
    DOM.statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

// ==========================================================================
// Module Card Interactions
// ==========================================================================

/**
 * Initialize module card interactions
 */
function initModuleCards() {
    DOM.moduleCards.forEach(card => {
        card.addEventListener('mouseenter', handleModuleCardHover);
        card.addEventListener('mouseleave', handleModuleCardLeave);
    });
}

/**
 * Handle module card hover
 * @param {Event} e - Mouse event
 */
function handleModuleCardHover(e) {
    const card = e.currentTarget;
    card.style.transform = 'scale(1.02)';
}

/**
 * Handle module card leave
 * @param {Event} e - Mouse event
 */
function handleModuleCardLeave(e) {
    const card = e.currentTarget;
    card.style.transform = 'scale(1)';
}

// ==========================================================================
// Scroll-based Active Section Detection
// ==========================================================================

/**
 * Update active navigation based on scroll position
 */
function updateActiveNavOnScroll() {
    const sections = Array.from(DOM.navLinks).map(link => {
        const sectionId = link.getAttribute('data-nav');
        return document.getElementById(sectionId);
    }).filter(Boolean);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                const correspondingLink = document.querySelector(`[data-nav="${sectionId}"]`);
                if (correspondingLink) {
                    updateActiveNavLink(correspondingLink);
                    AppState.setCurrentSection(sectionId);
                }
            }
        });
    }, {
        threshold: 0.5
    });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// ==========================================================================
// Initialization
// ==========================================================================

/**
 * Initialize all functionality when DOM is ready
 */
function init() {
    console.log('Adani Fintell Suite initialized');
    
    // Initialize features
    initNavigation();
    initActionButtons();
    initStatsAnimation();
    initModuleCards();
    updateActiveNavOnScroll();
    
    // Set initial loading state
    AppState.setLoading(false);
    
    // Log current state
    console.log('Current state:', AppState);
}

// ==========================================================================
// Event Listeners
// ==========================================================================

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
    }
});

// Export for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        toggleLoadingOverlay
    };
}
