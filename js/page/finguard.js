/**
 * Adani Fintell Suite - FinGuard JavaScript
 * Main entry point - imports and initializes all modules
 */

'use strict';

// Import modules
import { FinguardDOM } from '../finguard/dom-elements.js';
import { 
    handleFileSelect, 
    removeFile, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop 
} from '../finguard/file-upload.js';
import { processFile } from '../finguard/processor.js';
import { copyResults } from '../finguard/ui-helpers.js';

// ==========================================================================
// Event Listeners
// ==========================================================================

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Browse button click
    if (FinguardDOM.browseBtn) {
        FinguardDOM.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            FinguardDOM.fileInput.click();
        });
    }
    
    // File input change
    if (FinguardDOM.fileInput) {
        FinguardDOM.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }
    
    // Upload area click
    if (FinguardDOM.uploadArea) {
        FinguardDOM.uploadArea.addEventListener('click', (e) => {
            if (e.target !== FinguardDOM.browseBtn && !FinguardDOM.browseBtn.contains(e.target)) {
                FinguardDOM.fileInput.click();
            }
        });
        
        FinguardDOM.uploadArea.addEventListener('dragover', handleDragOver);
        FinguardDOM.uploadArea.addEventListener('dragleave', handleDragLeave);
        FinguardDOM.uploadArea.addEventListener('drop', handleDrop);
    }
    
    // Remove file button
    if (FinguardDOM.removeFileBtn) {
        FinguardDOM.removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFile();
        });
    }
    
    // Submit button
    if (FinguardDOM.submitBtn) {
        FinguardDOM.submitBtn.addEventListener('click', processFile);
    }
    
    // Copy button
    if (FinguardDOM.copyBtn) {
        FinguardDOM.copyBtn.addEventListener('click', copyResults);
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
 * Initialize FinGuard page
 */
function initFinguard() {
    console.log('FinGuard page initialized');
    
    if (!checkAuthentication()) {
        return;
    }
    
    initEventListeners();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinguard);
} else {
    initFinguard();
}

// Export for use in other modules
export {
    initFinguard,
    processFile,
    removeFile
};
