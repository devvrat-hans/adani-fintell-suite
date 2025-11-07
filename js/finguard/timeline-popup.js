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
    console.log(`=== UPDATE TIMELINE STEP ===`);
    console.log(`Step: ${step}`);
    console.log(`Status: ${status}`);
    console.log(`Message: ${message}`);
    
    const timelineItem = document.querySelector(`[data-timeline-step="${step}"]`);
    if (!timelineItem) {
        console.warn(`Timeline item not found for step: ${step}`);
        return;
    }
    
    console.log(`Timeline item found:`, timelineItem);
    console.log(`Current data-status:`, timelineItem.getAttribute('data-status'));
    
    // Update status attribute
    timelineItem.setAttribute('data-status', status);
    console.log(`New data-status set to: ${status}`);
    
    // Update description message
    const description = timelineItem.querySelector(`[data-step-description="${step}"]`);
    if (description && message) {
        description.textContent = message;
        console.log(`Description updated for step ${step}`);
    }
    
    // Update icon visibility
    const iconContainer = timelineItem.querySelector(`[data-step-icon="${step}"]`);
    if (iconContainer) {
        // First, hide all icons in this specific icon container
        const allIcons = iconContainer.querySelectorAll('svg');
        console.log(`Found ${allIcons.length} icons in container for step ${step}`);
        allIcons.forEach(icon => {
            icon.style.display = 'none';
        });
        
        // Determine which icon class to show based on status
        let iconClass;
        switch (status) {
            case 'in-progress':
                iconClass = 'icon-loading';
                break;
            case 'completed':
                iconClass = 'icon-success';
                break;
            case 'failed':
                iconClass = 'icon-error';
                break;
            case 'pending':
            default:
                iconClass = 'icon-pending';
                break;
        }
        
        console.log(`Determined icon class: ${iconClass}`);
        
        // Show the appropriate icon
        const activeIcon = iconContainer.querySelector(`.${iconClass}`);
        if (activeIcon) {
            activeIcon.style.display = 'block';
            console.log(`Successfully set ${iconClass} to display:block for step ${step}`);
        } else {
            console.warn(`Icon ${iconClass} not found for step ${step}`);
        }
    } else {
        console.warn(`Icon container not found for step: ${step}`);
    }
    
    console.log(`=== TIMELINE STEP UPDATE COMPLETE ===\n`);
}

