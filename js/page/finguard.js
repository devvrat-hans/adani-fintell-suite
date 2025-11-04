/**
 * Adani Fintell Suite - FinGuard JavaScript
 * Main entry point - imports and initializes all modules
 */

'use strict';

console.log('=== finguard.js module loading ===');

// Import modules
console.log('Importing modules...');
import { FinguardDOM, initDOM } from '../finguard/dom-elements.js';
import { processFile } from '../finguard/processor.js';
import { copyResults } from '../finguard/ui-helpers.js';

console.log('All modules imported successfully');

// ==========================================================================
// Event Listeners
// ==========================================================================

/**
 * Initialize event listeners
 * Note: File upload and process button are handled by file-upload-handler.js
 */
function initEventListeners() {
    console.log('Initializing FinGuard event listeners...');
    
    // Expose processFile as a global function so file-upload-handler.js can call it
    window.finguardProcessFile = processFile;
    console.log('processFile exposed as window.finguardProcessFile');
    
    // Copy button
    if (FinguardDOM.copyBtn) {
        FinguardDOM.copyBtn.addEventListener('click', copyResults);
        console.log('Copy button event listener attached');
    } else {
        console.warn('Copy button not found in DOM (this is normal if results haven\'t been shown yet)');
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

let isInitialized = false;

/**
 * Initialize FinGuard page
 */
function initFinguard() {
    console.log('Initializing FinGuard page...');
    
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Prevent multiple initializations
    if (isInitialized) {
        console.log('FinGuard already initialized, skipping...');
        return;
    }
    
    // Initialize DOM elements first
    initDOM();
    
    console.log('DOM elements after initialization:', {
        fileInput: FinguardDOM.fileInput,
        browseBtn: FinguardDOM.browseBtn,
        uploadArea: FinguardDOM.uploadArea,
        fileInputValue: FinguardDOM.fileInput ? FinguardDOM.fileInput.value : 'N/A',
        fileInputId: FinguardDOM.fileInput ? FinguardDOM.fileInput.id : 'N/A'
    });
    
    // Verify file input exists
    if (!FinguardDOM.fileInput) {
        console.error('CRITICAL: File input element not found! Retrying in 100ms...');
        setTimeout(initFinguard, 100);
        return;
    }
    
    // Then set up event listeners
    initEventListeners();
    
    isInitialized = true;
    console.log('FinGuard initialization complete');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinguard);
} else {
    initFinguard();
}

// Re-initialize when templates are loaded (only if not already initialized)
document.addEventListener('templatesLoaded', () => {
    console.log('Templates loaded event received');
    if (!isInitialized) {
        console.log('Re-initializing FinGuard after templates loaded');
        setTimeout(initFinguard, 100);
    }
});

// Export for use in other modules
export {
    initFinguard,
    processFile
};
