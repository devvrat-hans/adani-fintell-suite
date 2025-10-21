/**
 * Adani Fintell Suite - FinGuard
 * UI Helpers Module
 * Common UI utility functions
 */

'use strict';

import { FinguardDOM } from './dom-elements.js';

/**
 * Show loading state
 */
export function showLoadingState() {
    FinguardDOM.loadingState.style.display = 'block';
}

/**
 * Hide loading state
 */
export function hideLoadingState() {
    FinguardDOM.loadingState.style.display = 'none';
}

/**
 * Hide results section
 */
export function hideResults() {
    FinguardDOM.resultsSection.style.display = 'none';
}

/**
 * Show loading indicator for validation steps
 * @param {string} type - Type of validation (duplicate, anomaly, gst)
 * @param {string} message - Loading message
 */
export function showValidationLoading(type, message) {
    const loadingHtml = `
        <div class="validation-section loading" data-validation-section="${type}">
            <div class="validation-header">
                <h3 class="section-title">${getValidationTitle(type)}</h3>
            </div>
            <div class="validation-loading">
                <div class="spinner-small"></div>
                <p class="loading-text-small">${message}</p>
            </div>
        </div>
    `;
    
    // Remove existing section if present
    const resultsContent = FinguardDOM.resultsContent;
    const existingSection = resultsContent.querySelector(`[data-validation-section="${type}"]`);
    
    if (existingSection) {
        existingSection.remove();
    }
    
    // Append to results
    resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', loadingHtml);
}

/**
 * Get validation section title
 * @param {string} type - Type of validation
 * @returns {string} - Section title
 */
export function getValidationTitle(type) {
    const titles = {
        arithmetic: 'Arithmetical Accuracy Check',
        'price-anomaly': 'Price Anomaly Detection',
        duplicate: 'Duplicate Check',
        anomaly: 'Anomaly Detection',
        gst: 'GST Validation',
        'gst-rate': 'GST Rate Validation'
    };
    return titles[type] || 'Validation';
}

/**
 * Copy results to clipboard
 */
export async function copyResults() {
    const resultsElement = FinguardDOM.resultsContent;
    
    // Check if there's an error message
    if (resultsElement.querySelector('.error-message')) {
        alert('Cannot copy error message');
        return;
    }
    
    // Extract text content from the formatted results
    let text = '';
    
    // Try to get the text content in a readable format
    const sections = resultsElement.querySelectorAll('.invoice-section');
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        if (title) {
            text += title.textContent + '\n';
            text += '='.repeat(title.textContent.length) + '\n\n';
        }
        
        // Get data items
        const dataItems = section.querySelectorAll('.data-item');
        dataItems.forEach(item => {
            const label = item.querySelector('.data-label');
            const value = item.querySelector('.data-value');
            if (label && value) {
                text += `${label.textContent} ${value.textContent}\n`;
            }
        });
        
        // Get table data
        const table = section.querySelector('table');
        if (table) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                const rowText = Array.from(cells).map(cell => cell.textContent.trim()).join('\t');
                text += rowText + '\n';
            });
        }
        
        text += '\n';
    });
    
    // Fallback to plain text content if no structured data
    if (!text.trim()) {
        text = resultsElement.textContent;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Update button text temporarily
        const originalText = FinguardDOM.copyBtn.innerHTML;
        FinguardDOM.copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Copied!
        `;
        
        setTimeout(() => {
            FinguardDOM.copyBtn.innerHTML = originalText;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy to clipboard');
    }
}
