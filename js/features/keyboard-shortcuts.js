/**
 * Keyboard Shortcuts
 * Global keyboard shortcut handler for the application
 */

/**
 * Keyboard shortcuts configuration
 */
const shortcuts = {
    // Global Navigation
    'g+h': {
        description: 'Go to Home',
        handler: () => navigateTo('index.html'),
    },
    'g+f': {
        description: 'Go to FinGuard',
        handler: () => navigateTo('finguard.html'),
    },
    'g+s': {
        description: 'Go to SheetSense',
        handler: () => navigateTo('sheetsense.html'),
    },
    'g+a': {
        description: 'Go to Analytics',
        handler: () => navigateTo('analytics.html'),
    },
    'g+t': {
        description: 'Go to Settings',
        handler: () => navigateTo('settings.html'),
    },
    '?': {
        description: 'Show keyboard shortcuts',
        handler: () => navigateTo('keyboard-shortcuts.html'),
    },
    
    // FinGuard - Invoice Processing
    'u': {
        description: 'Upload new invoice',
        pageContext: 'finguard',
        handler: () => triggerFileUpload('[data-invoice-uploader] [data-input]'),
    },
    'v': {
        description: 'Validate GST',
        pageContext: 'finguard',
        handler: () => clickElement('[data-validate-gst]'),
    },
    'd': {
        description: 'Check for duplicates',
        pageContext: 'finguard',
        handler: () => clickElement('[data-check-duplicate]'),
    },
    'a': {
        description: 'Approve invoice',
        pageContext: 'finguard',
        handler: () => clickElement('[data-approve-invoice]'),
    },
    'r': {
        description: 'Reject invoice',
        pageContext: 'finguard',
        handler: () => clickElement('[data-reject-invoice]'),
    },
    'e': {
        description: 'Export report',
        pageContext: 'finguard',
        handler: () => clickElement('[data-export-report]'),
    },
    
    // SheetSense - Balance Sheet
    'u': {
        description: 'Upload trial balance',
        pageContext: 'sheetsense',
        handler: () => triggerFileUpload('[data-tb-uploader] [data-input]'),
    },
    'v': {
        description: 'Validate GL accounts',
        pageContext: 'sheetsense',
        handler: () => clickElement('[data-validate-gl]'),
    },
    'a': {
        description: 'Assign stakeholders',
        pageContext: 'sheetsense',
        handler: () => clickElement('[data-assign-stakeholders]'),
    },
    'g': {
        description: 'Generate report',
        pageContext: 'sheetsense',
        handler: () => clickElement('[data-generate-report]'),
    },
    'e': {
        description: 'Export to Excel',
        pageContext: 'sheetsense',
        handler: () => clickElement('[data-export-excel]'),
    },
    
    // Search & Filter
    '/': {
        description: 'Focus search',
        handler: () => focusSearch(),
    },
    'Escape': {
        description: 'Close modals/dropdowns',
        handler: () => closeOverlays(),
    },
};

/**
 * Current key sequence for multi-key shortcuts
 */
let keySequence = [];
let sequenceTimer = null;

/**
 * Get current page context
 */
function getPageContext() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    
    if (filename.includes('finguard')) return 'finguard';
    if (filename.includes('sheetsense')) return 'sheetsense';
    if (filename.includes('analytics')) return 'analytics';
    if (filename.includes('settings')) return 'settings';
    
    return 'global';
}

/**
 * Navigate to a page
 */
function navigateTo(page) {
    window.location.href = page;
}

/**
 * Click an element
 */
function clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.click();
        return true;
    }
    return false;
}

/**
 * Trigger file upload
 */
function triggerFileUpload(selector) {
    const input = document.querySelector(selector);
    if (input) {
        input.click();
        return true;
    }
    return false;
}

/**
 * Focus search input
 */
function focusSearch() {
    const searchInput = document.querySelector('[data-search-input]') || 
                       document.querySelector('input[type="search"]') ||
                       document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
        searchInput.focus();
        return true;
    }
    return false;
}

/**
 * Close all overlays (modals, dropdowns)
 */
function closeOverlays() {
    // Close dropdowns
    document.querySelectorAll('.is-open').forEach(el => {
        el.classList.remove('is-open');
    });
    
    // Close modals
    document.querySelectorAll('[data-modal].is-open').forEach(modal => {
        modal.classList.remove('is-open');
    });
    
    // Blur active element
    if (document.activeElement) {
        document.activeElement.blur();
    }
}

/**
 * Handle keyboard event
 */
function handleKeyboardEvent(event) {
    // Ignore if user is typing in an input/textarea
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    );
    
    // Allow escape key even in input fields
    if (isInputField && event.key !== 'Escape') {
        return;
    }
    
    // Build key identifier
    let key = event.key;
    
    // Special keys
    if (event.ctrlKey || event.metaKey) key = `Ctrl+${key}`;
    if (event.altKey) key = `Alt+${key}`;
    if (event.shiftKey && key.length > 1) key = `Shift+${key}`;
    
    // Add to sequence for multi-key shortcuts
    keySequence.push(key.toLowerCase());
    
    // Clear sequence after 1 second
    clearTimeout(sequenceTimer);
    sequenceTimer = setTimeout(() => {
        keySequence = [];
    }, 1000);
    
    // Build shortcut key
    const shortcutKey = keySequence.join('+');
    
    // Find matching shortcut
    const shortcut = shortcuts[shortcutKey] || shortcuts[key];
    
    if (shortcut) {
        const pageContext = getPageContext();
        
        // Check if shortcut applies to current page
        if (shortcut.pageContext && shortcut.pageContext !== pageContext) {
            return;
        }
        
        // Prevent default behavior
        event.preventDefault();
        
        // Execute handler
        try {
            shortcut.handler();
            keySequence = []; // Reset sequence after successful execution
        } catch (error) {
            console.error('Keyboard shortcut error:', error);
        }
    }
}

/**
 * Initialize keyboard shortcuts
 */
export function initKeyboardShortcuts() {
    // Remove existing listener if any
    document.removeEventListener('keydown', handleKeyboardEvent);
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyboardEvent);
    
    console.log('Keyboard shortcuts initialized');
}

/**
 * Get all shortcuts for display
 */
export function getAllShortcuts() {
    return shortcuts;
}

/**
 * Get shortcuts for current page
 */
export function getPageShortcuts() {
    const pageContext = getPageContext();
    const pageShortcuts = {};
    
    Object.entries(shortcuts).forEach(([key, shortcut]) => {
        if (!shortcut.pageContext || shortcut.pageContext === pageContext) {
            pageShortcuts[key] = shortcut;
        }
    });
    
    return pageShortcuts;
}

// Auto-initialize if not imported as module
if (typeof window !== 'undefined' && !window.keyboardShortcutsInitialized) {
    window.keyboardShortcutsInitialized = true;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);
    } else {
        initKeyboardShortcuts();
    }
}
