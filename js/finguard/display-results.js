/**
 * Adani Fintell Suite - FinGuard
 * Display Results Module
 * Handles rendering of specific validation results
 */

'use strict';

import { FinguardDOM } from './dom-elements.js';

/**
 * Display arithmetical accuracy check results
 * @param {Object} arithmeticData - Arithmetic check result
 */
export function displayArithmeticResults(arithmeticData) {
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector('[data-validation-section="arithmetic"]');
    if (existingSection) {
        existingSection.remove();
    }
    
    let html = '<div class="validation-section" data-validation-section="arithmetic">';
    html += '<div class="validation-header">';
    html += '<h3 class="section-title">Arithmetical Accuracy Check</h3>';
    html += '</div>';
    
    if (arithmeticData.accurate) {
        html += '<div class="validation-alert alert-success">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">✓ Calculations Verified</h4>
                <p class="alert-message">All arithmetical calculations are accurate. Line items sum to subtotal, and taxes are correctly applied.</p>
            </div>
        `;
        html += '</div>';
    } else {
        html += '<div class="validation-alert alert-error">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">❌ Calculation Errors Detected</h4>
                <p class="alert-message">Discrepancies found in invoice calculations. Further validation has been stopped.</p>
            </div>
        `;
        html += '</div>';
        
        // Show error details
        if (arithmeticData.errors && arithmeticData.errors.length > 0) {
            html += '<div class="arithmetic-errors">';
            html += '<h4 class="errors-title">Detected Issues:</h4>';
            html += '<ul class="errors-list">';
            arithmeticData.errors.forEach(error => {
                html += `<li class="error-item">${error}</li>`;
            });
            html += '</ul>';
            html += '</div>';
        }
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}

/**
 * Display price anomaly detection results
 * @param {Object} priceAnomalyData - Price anomaly check response
 */
export function displayPriceAnomalyResults(priceAnomalyData) {
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector('[data-validation-section="price-anomaly"]');
    if (existingSection) {
        existingSection.remove();
    }
    
    let html = '<div class="validation-section" data-validation-section="price-anomaly">';
    html += '<div class="validation-header">';
    html += '<h3 class="section-title">Price Anomaly Detection</h3>';
    html += '</div>';
    
    const hasAnomalies = priceAnomalyData.anomalyFound === true;
    
    // Display summary if available
    if (priceAnomalyData.summary) {
        html += '<div class="validation-summary">';
        html += `<p class="summary-text">${priceAnomalyData.summary}</p>`;
        html += '</div>';
    }
    
    if (!hasAnomalies) {
        html += '<div class="validation-alert alert-success">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">✓ No Price Anomalies Detected</h4>
                <p class="alert-message">All prices are within expected range based on market comparisons. All items have less than 20% deviation from market rates.</p>
            </div>
        `;
        html += '</div>';
        
        // Show all items even if no anomalies
        if (priceAnomalyData.anomalies && priceAnomalyData.anomalies.length > 0) {
            html += '<div class="price-anomaly-group">';
            html += '<h4 class="validation-group-title">Price Analysis Details</h4>';
            html += '<div class="anomaly-items-list">';
            
            priceAnomalyData.anomalies.forEach((item, index) => {
                html += '<div class="anomaly-item-card success-item">';
                html += `<div class="item-header">${item.description || `Item ${index + 1}`}</div>`;
                html += '<div class="item-details">';
                
                html += `<div class="detail-row">
                    <span class="detail-label">Billed Rate:</span>
                    <span class="detail-value">₹${item.billed_rate || 'N/A'}</span>
                </div>`;
                
                html += `<div class="detail-row">
                    <span class="detail-label">Market Rate:</span>
                    <span class="detail-value">₹${item.market_rate || 'N/A'}</span>
                </div>`;
                
                html += `<div class="detail-row">
                    <span class="detail-label">Deviation:</span>
                    <span class="detail-value deviation-success">${item.deviation_percent || 0}%</span>
                </div>`;
                
                html += `<div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-success">${item.issue || 'Within acceptable range'}</span>
                </div>`;
                
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '</div>';
        }
    } else {
        html += '<div class="validation-alert alert-error">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">⚠️ Price Anomalies Detected</h4>
                <p class="alert-message">Found ${priceAnomalyData.anomalyCount || 0} item(s) with prices that deviate more than 20% from market rates.</p>
            </div>
        `;
        html += '</div>';
        
        // Show all analyzed items with anomaly highlights
        if (priceAnomalyData.anomalies && priceAnomalyData.anomalies.length > 0) {
            html += '<div class="price-anomaly-group">';
            html += '<h4 class="validation-group-title">Price Analysis Details</h4>';
            html += '<div class="anomaly-items-list">';
            
            priceAnomalyData.anomalies.forEach((item, index) => {
                // Check if this specific item has an anomaly (deviation > 20%)
                const isAnomaly = item.issue && item.issue.includes('above 20%');
                const cardClass = isAnomaly ? 'anomaly-item-card error-item' : 'anomaly-item-card success-item';
                
                html += `<div class="${cardClass}">`;
                html += `<div class="item-header">`;
                html += `<span>${item.description || `Item ${index + 1}`}</span>`;
                if (isAnomaly) {
                    html += `<span class="anomaly-badge">Anomaly</span>`;
                }
                html += `</div>`;
                html += '<div class="item-details">';
                
                html += `<div class="detail-row">
                    <span class="detail-label">Billed Rate:</span>
                    <span class="detail-value">₹${item.billed_rate || 'N/A'}</span>
                </div>`;
                
                html += `<div class="detail-row">
                    <span class="detail-label">Market Rate:</span>
                    <span class="detail-value">₹${item.market_rate || 'N/A'}</span>
                </div>`;
                
                const deviationClass = isAnomaly ? 'deviation-error' : 'deviation-success';
                html += `<div class="detail-row">
                    <span class="detail-label">Deviation:</span>
                    <span class="detail-value ${deviationClass}">${item.deviation_percent || 0}%</span>
                </div>`;
                
                const statusClass = isAnomaly ? 'status-error' : 'status-success';
                html += `<div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value ${statusClass}">${item.issue || 'Within acceptable range'}</span>
                </div>`;
                
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '</div>';
        }
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}

/**
 * Display duplicate check results
 * @param {Object} duplicateData - Duplicate check response
 */
export function displayDuplicateResults(duplicateData) {
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector('[data-validation-section="duplicate"]');
    if (existingSection) {
        existingSection.remove();
    }
    
    let html = '<div class="validation-section" data-validation-section="duplicate">';
    html += '<div class="validation-header">';
    html += '<h3 class="section-title">Duplicate Check</h3>';
    html += '</div>';
    
    // Check if duplicate was found using is_duplicate field
    const isDuplicate = duplicateData.is_duplicate === true;
    
    if (isDuplicate) {
        html += '<div class="validation-alert alert-error">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">⚠️ Duplicate Invoice Detected</h4>
                <p class="alert-message">This invoice already exists in the system. Further validation has been stopped.</p>
            </div>
        `;
        html += '</div>';
        
        // Show duplicate details
        html += '<div class="duplicate-details">';
        
        // Confidence score
        if (duplicateData.confidence_score !== undefined && duplicateData.confidence_score !== null) {
            html += `<div class="detail-row">
                <span class="detail-label">Confidence Score:</span>
                <span class="detail-value">${duplicateData.confidence_score}%</span>
            </div>`;
        }
        
        // Duplicate type
        if (duplicateData.duplicate_type) {
            html += `<div class="detail-row">
                <span class="detail-label">Match Type:</span>
                <span class="detail-value">${duplicateData.duplicate_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>`;
        }
        
        // Duplicate reason
        if (duplicateData.duplicate_reason) {
            html += `<div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">${duplicateData.duplicate_reason}</span>
            </div>`;
        }
        
        // Matched invoice IDs
        if (duplicateData.matched_invoice_ids && duplicateData.matched_invoice_ids.length > 0) {
            html += '<div class="detail-row">';
            html += '<span class="detail-label">Matched Invoice(s):</span>';
            html += '<div class="matched-invoices">';
            duplicateData.matched_invoice_ids.forEach(id => {
                html += `<span class="invoice-id-badge">${id}</span>`;
            });
            html += '</div>';
            html += '</div>';
        }
        
        html += '</div>';
    } else {
        html += '<div class="validation-alert alert-success">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">✓ No Duplicate Found</h4>
                <p class="alert-message">This invoice is unique. Proceeding with GST validation...</p>
            </div>
        `;
        html += '</div>';
        
        // Show confidence score even when no duplicate
        if (duplicateData.confidence_score !== undefined && duplicateData.confidence_score !== null) {
            html += '<div class="duplicate-details">';
            html += `<div class="detail-row">
                <span class="detail-label">Confidence Score:</span>
                <span class="detail-value">${duplicateData.confidence_score}%</span>
            </div>`;
            html += '</div>';
        }
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}

/**
 * Display GST validation results
 * @param {Object|Array} gstResponse - Response from GST validation endpoint
 */
export function displayGSTResults(gstResponse) {
    // Parse response - it's an array with a single object
    let gstData = gstResponse;
    
    if (Array.isArray(gstResponse) && gstResponse.length > 0) {
        gstData = gstResponse[0];
    }
    
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector('[data-validation-section="gst"]');
    if (existingSection) {
        existingSection.remove();
    }
    
    let html = '<div class="validation-section" data-validation-section="gst">';
    html += '<div class="validation-header">';
    html += '<h3 class="section-title">GST Validation</h3>';
    html += '</div>';
    
    // Check if GST validation passed using the 'valid' field
    const isValid = gstData.valid === true;
    
    if (isValid) {
        // All validations passed
        html += '<div class="validation-alert alert-success">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">✓ GST Validation Passed</h4>
                <p class="alert-message">All GST information is valid and verified.</p>
            </div>
        `;
        html += '</div>';
        
        // Display vendor validation details
        if (gstData.vendorValidation) {
            html += '<div class="gst-validation-group">';
            html += '<h4 class="validation-group-title">Vendor GSTIN Details</h4>';
            html += '<div class="gst-validation-details">';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">GSTIN:</span>';
            html += `<span class="validation-value">${gstData.vendorValidation.gstin || 'N/A'}</span>`;
            html += '</div>';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">Legal Name:</span>';
            html += `<span class="validation-value">${gstData.vendorValidation.legalName || 'N/A'}</span>`;
            html += '</div>';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">Status:</span>';
            html += `<span class="validation-status-badge success">${gstData.vendorValidation.status || 'N/A'}</span>`;
            html += '</div>';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">PAN:</span>';
            html += `<span class="validation-value">${gstData.vendorValidation.pan || 'N/A'}</span>`;
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
        }
        
        // Display company validation details
        if (gstData.companyValidation) {
            html += '<div class="gst-validation-group">';
            html += '<h4 class="validation-group-title">Company GSTIN Details</h4>';
            html += '<div class="gst-validation-details">';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">GSTIN:</span>';
            html += `<span class="validation-value">${gstData.companyValidation.gstin || 'N/A'}</span>`;
            html += '</div>';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">Legal Name:</span>';
            html += `<span class="validation-value">${gstData.companyValidation.legalName || 'N/A'}</span>`;
            html += '</div>';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">Status:</span>';
            html += `<span class="validation-status-badge success">${gstData.companyValidation.status || 'N/A'}</span>`;
            html += '</div>';
            
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">PAN:</span>';
            html += `<span class="validation-value">${gstData.companyValidation.pan || 'N/A'}</span>`;
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
        }
        
    } else {
        // Some validations failed
        html += '<div class="validation-alert alert-error">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">❌ GST Validation Failed</h4>
                <p class="alert-message">Some GST information could not be verified. Please review the details below.</p>
            </div>
        `;
        html += '</div>';
        
        // Display messages
        if (gstData.messages && gstData.messages.length > 0) {
            html += '<div class="gst-messages">';
            html += '<h4 class="messages-title">Validation Messages:</h4>';
            html += '<ul class="messages-list">';
            gstData.messages.forEach(message => {
                const isError = message.toLowerCase().includes('not active') || message.toLowerCase().includes('invalid');
                html += `<li class="${isError ? 'message-error' : 'message-success'}">${message}</li>`;
            });
            html += '</ul>';
            html += '</div>';
        }
        
        // Display vendor and company validation details (similar to success case but with error states)
        // ... (rest of the error handling logic)
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}

/**
 * Display GST rate validation results
 * @param {Object} gstRateData - GST rate validation response
 */
export function displayGSTRateResults(gstRateData) {
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector('[data-validation-section="gst-rate"]');
    if (existingSection) {
        existingSection.remove();
    }
    
    let html = '<div class="validation-section" data-validation-section="gst-rate">';
    html += '<div class="validation-header">';
    html += '<h3 class="section-title">GST Rate Validation</h3>';
    html += '</div>';
    
    // Check status - can be "ok" or "anomaly"
    const isValid = gstRateData.status === 'ok';
    
    if (isValid) {
        // All rates are valid
        html += '<div class="validation-alert alert-success">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">✓ All GST Rates Valid</h4>
                <p class="alert-message">${gstRateData.message || 'All GST rates applied on line items are correct as per HSN/SAC codes.'}</p>
            </div>
        `;
        html += '</div>';
    } else {
        // Some rates are invalid (status: "anomaly")
        html += '<div class="validation-alert alert-error">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">❌ GST Rate Anomalies Detected</h4>
                <p class="alert-message">Some line items have incorrect GST rates or anomalies. Please review the details below.</p>
            </div>
        `;
        html += '</div>';
        
        // Display anomalies
        if (gstRateData.anomalies && gstRateData.anomalies.length > 0) {
            html += '<div class="gst-rate-validation-group">';
            html += '<h4 class="validation-group-title">Detected Anomalies</h4>';
            html += '<div class="invalid-items-list">';
            
            gstRateData.anomalies.forEach((anomaly, index) => {
                html += '<div class="invalid-item-card">';
                html += `<div class="item-header">Anomaly ${index + 1}</div>`;
                html += '<div class="item-details">';
                
                // Display anomaly details - the structure may vary
                if (typeof anomaly === 'string') {
                    html += `<div class="detail-row">
                        <span class="detail-value">${anomaly}</span>
                    </div>`;
                } else if (typeof anomaly === 'object') {
                    // If anomaly is an object, display its properties
                    for (const [key, value] of Object.entries(anomaly)) {
                        html += `<div class="detail-row">
                            <span class="detail-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                            <span class="detail-value">${value}</span>
                        </div>`;
                    }
                }
                
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '</div>';
        }
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}
