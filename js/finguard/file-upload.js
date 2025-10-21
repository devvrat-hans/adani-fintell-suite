/**
 * Adani-Fintell-Suite - FinGuard AI
 * File Upload Utilities Module
 * Handles file selection, validation, and UI updates
 */

'use strict';

import { FinguardDOM } from './dom-elements.js';
import { setSelectedFile, clearSelectedFile } from './state.js';
import { hideResults } from './ui-helpers.js';

/**
 * Handle file selection
 * @param {File} file - Selected file
 */
export function handleFileSelect(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid file type (PDF, PNG, or JPEG)');
        return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
    }
    
    // Store selected file
    setSelectedFile(file);
    
    // Update UI
    displayFilePreview(file);
    enableSubmitButton();
    hideUploadArea();
}

/**
 * Display file preview
 * @param {File} file - File to preview
 */
export function displayFilePreview(file) {
    FinguardDOM.fileName.textContent = file.name;
    FinguardDOM.fileSize.textContent = formatFileSize(file.size);
    FinguardDOM.filePreview.style.display = 'block';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file type string
 * @param {File} file - File object
 * @returns {string} - File type (pdf, png, jpeg)
 */
export function getFileType(file) {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType === 'application/pdf') {
        return 'pdf';
    } else if (mimeType === 'image/png') {
        return 'png';
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return 'jpeg';
    }
    
    // Fallback: check extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (['pdf', 'png', 'jpg', 'jpeg'].includes(extension)) {
        return extension === 'jpg' ? 'jpeg' : extension;
    }
    
    return 'unknown';
}

/**
 * Hide upload area
 */
export function hideUploadArea() {
    FinguardDOM.uploadArea.style.display = 'none';
}

/**
 * Show upload area
 */
export function showUploadArea() {
    FinguardDOM.uploadArea.style.display = 'block';
}

/**
 * Enable submit button
 */
export function enableSubmitButton() {
    FinguardDOM.submitBtn.disabled = false;
}

/**
 * Disable submit button
 */
export function disableSubmitButton() {
    FinguardDOM.submitBtn.disabled = true;
}

/**
 * Remove selected file
 */
export function removeFile() {
    clearSelectedFile();
    FinguardDOM.fileInput.value = '';
    FinguardDOM.filePreview.style.display = 'none';
    showUploadArea();
    disableSubmitButton();
    hideResults();
}

/**
 * Handle drag over event
 * @param {DragEvent} e - Drag event
 */
export function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    FinguardDOM.uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave event
 * @param {DragEvent} e - Drag event
 */
export function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    FinguardDOM.uploadArea.classList.remove('drag-over');
}

/**
 * Handle drop event
 * @param {DragEvent} e - Drop event
 */
export function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    FinguardDOM.uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}
