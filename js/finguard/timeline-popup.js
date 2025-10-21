/**
 * Adani Fintell Suite - FinGuard
 * Timeline Popup Module
 * Manages processing timeline popup UI
 */

'use strict';

import { FinguardDOM } from './dom-elements.js';

/**
 * Show processing timeline popup
 */
export function showProcessingPopup() {
    if (FinguardDOM.processingPopup) {
        FinguardDOM.processingPopup.style.display = 'flex';
        // Reset all steps to pending
        resetTimelineSteps();
    }
}

/**
 * Hide processing timeline popup
 */
export function hideProcessingPopup() {
    if (FinguardDOM.processingPopup) {
        FinguardDOM.processingPopup.style.display = 'none';
    }
}

/**
 * Reset all timeline steps to pending state
 */
export function resetTimelineSteps() {
    const steps = ['ocr', 'arithmetic', 'price-anomaly', 'duplicate', 'gst', 'gst-rate'];
    steps.forEach(step => {
        updateTimelineStep(step, 'pending', getDefaultStepMessage(step));
    });
}

/**
 * Get default message for each step
 * @param {string} step - Step name
 * @returns {string} - Default message
 */
export function getDefaultStepMessage(step) {
    const messages = {
        ocr: 'Waiting to process...',
        arithmetic: 'Waiting to verify...',
        'price-anomaly': 'Waiting to check prices...',
        duplicate: 'Waiting to check...',
        gst: 'Waiting to validate...',
        'gst-rate': 'Waiting to validate rates...'
    };
    return messages[step] || 'Waiting...';
}

/**
 * Update timeline step status
 * @param {string} step - Step name (ocr, duplicate, gst)
 * @param {string} status - Status (pending, in-progress, completed, failed)
 * @param {string} message - Status message
 */
export function updateTimelineStep(step, status, message) {
    const timelineItem = document.querySelector(`[data-timeline-step="${step}"]`);
    if (!timelineItem) return;
    
    // Update status attribute
    timelineItem.setAttribute('data-status', status);
    
    // Update description message
    const description = timelineItem.querySelector(`[data-step-description="${step}"]`);
    if (description && message) {
        description.textContent = message;
    }
    
    // Update icon visibility
    const iconContainer = timelineItem.querySelector(`[data-step-icon="${step}"]`);
    if (iconContainer) {
        // Hide all icons
        iconContainer.querySelectorAll('svg').forEach(icon => {
            icon.style.display = 'none';
        });
        
        // Show appropriate icon
        const iconClass = `.icon-${status === 'in-progress' ? 'loading' : status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'pending'}`;
        const activeIcon = iconContainer.querySelector(iconClass);
        if (activeIcon) {
            activeIcon.style.display = 'block';
        }
    }
}
