/**
 * Adani Fintell Suite - FinGuard
 * State Management Module
 * Manages application state
 */

'use strict';

// Application state
export let selectedFile = null;

/**
 * Set selected file
 * @param {File} file - File to set
 */
export function setSelectedFile(file) {
    selectedFile = file;
}

/**
 * Get selected file
 * @returns {File|null} - Currently selected file
 */
export function getSelectedFile() {
    // Check window.selectedInvoiceFile first (from file-upload-handler.js)
    if (window.selectedInvoiceFile) {
        return window.selectedInvoiceFile;
    }
    // Fallback to module state
    return selectedFile;
}

/**
 * Clear selected file
 */
export function clearSelectedFile() {
    selectedFile = null;
}
