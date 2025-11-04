/**
 * Adani Fintell Suite - FinGuard
 * DOM Elements Module
 * Contains all DOM element references
 */

'use strict';

/**
 * Initialize and return all DOM element references
 * @returns {Object} - Object containing all DOM element references
 */
function initializeDOMElements() {
    return {
        uploadArea: document.querySelector('[data-upload-area]'),
        fileInput: document.querySelector('[data-file-input]'),
        browseBtn: document.querySelector('label[for="fileInput"]') || document.querySelector('[data-action="browse-file"]'),
        filePreview: document.querySelector('[data-file-preview]'),
        fileName: document.querySelector('[data-file-name]'),
        fileSize: document.querySelector('[data-file-size]'),
        removeFileBtn: document.querySelector('[data-action="remove-file"]'),
        submitBtn: document.querySelector('[data-action="process-file"]'),
        loadingState: document.querySelector('[data-loading-state]'),
        resultsSection: document.querySelector('[data-results-section]'),
        resultsContent: document.querySelector('[data-results-content]'),
        copyBtn: document.querySelector('[data-action="copy-results"]'),
        processingPopup: document.querySelector('[data-processing-popup]'),
        popupOverlay: document.querySelector('[data-popup-overlay]')
    };
}

// Initialize DOM elements - will be populated when init() is called
export let FinguardDOM = {};

/**
 * Initialize DOM elements
 * Call this after DOM is fully loaded
 */
export function initDOM() {
    Object.assign(FinguardDOM, initializeDOMElements());
}
