/**
 * Adani-Fintell-Suite - FinGuard AI
 * DOM Elements Module
 * Contains all DOM element references
 */

'use strict';

export const FinguardDOM = {
    uploadArea: document.querySelector('[data-upload-area]'),
    fileInput: document.querySelector('[data-file-input]'),
    browseBtn: document.querySelector('[data-action="browse-file"]'),
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
