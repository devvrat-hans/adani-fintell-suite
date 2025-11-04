/**
 * SheetSense Page
 * Coming Soon placeholder
 */

/**
 * Initialize the page
 */
async function init() {
    // Load templates
    await window.templateLoader.loadNavbar();
    await window.templateLoader.loadSidebar();

    // Remove loading state
    document.body.classList.remove('loading-layout');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
