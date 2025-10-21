/**
 * Adani Fintell Suite - FinGuard
 * Display Module
 * Handles rendering of invoice data and validation results
 */

'use strict';

import { FinguardDOM } from './dom-elements.js';

/**
 * Display extracted invoice data in a formatted way
 * @param {Object} invoiceData - Extracted invoice data
 */
export function displayInvoiceData(invoiceData) {
    // Create formatted HTML for the invoice data
    let htmlContent = '<div class="invoice-data">';
    
    // Header Information
    htmlContent += '<div class="invoice-section">';
    htmlContent += '<h3 class="section-title">Invoice Information</h3>';
    htmlContent += '<div class="data-grid">';
    
    if (invoiceData.invoice_number) {
        htmlContent += `<div class="data-item">
            <span class="data-label">Invoice Number:</span>
            <span class="data-value">${invoiceData.invoice_number}</span>
        </div>`;
    }
    
    if (invoiceData.invoice_date) {
        htmlContent += `<div class="data-item">
            <span class="data-label">Invoice Date:</span>
            <span class="data-value">${invoiceData.invoice_date}</span>
        </div>`;
    }
    
    if (invoiceData.invoice_amount) {
        htmlContent += `<div class="data-item">
            <span class="data-label">Total Amount:</span>
            <span class="data-value amount">₹${parseFloat(invoiceData.invoice_amount).toLocaleString('en-IN')}</span>
        </div>`;
    }
    
    htmlContent += '</div></div>';
    
    // GST Information
    if (invoiceData.vendor_gstin || invoiceData.company_gstin) {
        htmlContent += '<div class="invoice-section">';
        htmlContent += '<h3 class="section-title">GST Information</h3>';
        htmlContent += '<div class="data-grid">';
        
        if (invoiceData.vendor_gstin) {
            htmlContent += `<div class="data-item">
                <span class="data-label">Vendor GSTIN:</span>
                <span class="data-value">${invoiceData.vendor_gstin}</span>
            </div>`;
        }
        
        if (invoiceData.company_gstin) {
            htmlContent += `<div class="data-item">
                <span class="data-label">Company GSTIN:</span>
                <span class="data-value">${invoiceData.company_gstin}</span>
            </div>`;
        }
        
        if (invoiceData.hsn_sac_codes && invoiceData.hsn_sac_codes.length > 0) {
            htmlContent += `<div class="data-item full-width">
                <span class="data-label">HSN/SAC Codes:</span>
                <span class="data-value">${invoiceData.hsn_sac_codes.join(', ')}</span>
            </div>`;
        }
        
        htmlContent += '</div></div>';
    }
    
    // Line Items
    if (invoiceData.line_items && invoiceData.line_items.length > 0) {
        htmlContent += '<div class="invoice-section">';
        htmlContent += '<h3 class="section-title">Line Items</h3>';
        htmlContent += '<div class="line-items-table">';
        htmlContent += `
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>HSN/SAC</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        invoiceData.line_items.forEach(item => {
            htmlContent += `
                <tr>
                    <td>${item.description || '-'}</td>
                    <td>${item.hsn_sac || '-'}</td>
                    <td>${item.quantity || '-'}</td>
                    <td>₹${item.rate ? parseFloat(item.rate).toLocaleString('en-IN') : '-'}</td>
                    <td>₹${item.amount ? parseFloat(item.amount).toLocaleString('en-IN') : '-'}</td>
                </tr>
            `;
        });
        
        htmlContent += `
                </tbody>
            </table>
        `;
        htmlContent += '</div></div>';
    }
    
    // Tax Summary
    htmlContent += '<div class="invoice-section">';
    htmlContent += '<h3 class="section-title">Tax Summary</h3>';
    htmlContent += '<div class="data-grid">';
    
    if (invoiceData.subtotal) {
        htmlContent += `<div class="data-item">
            <span class="data-label">Subtotal:</span>
            <span class="data-value">₹${parseFloat(invoiceData.subtotal).toLocaleString('en-IN')}</span>
        </div>`;
    }
    
    if (invoiceData.cgst_amount) {
        htmlContent += `<div class="data-item">
            <span class="data-label">CGST:</span>
            <span class="data-value">₹${parseFloat(invoiceData.cgst_amount).toLocaleString('en-IN')}</span>
        </div>`;
    }
    
    if (invoiceData.sgst_amount) {
        htmlContent += `<div class="data-item">
            <span class="data-label">SGST:</span>
            <span class="data-value">₹${parseFloat(invoiceData.sgst_amount).toLocaleString('en-IN')}</span>
        </div>`;
    }
    
    if (invoiceData.igst_amount) {
        htmlContent += `<div class="data-item">
            <span class="data-label">IGST:</span>
            <span class="data-value">₹${parseFloat(invoiceData.igst_amount).toLocaleString('en-IN')}</span>
        </div>`;
    }
    
    if (invoiceData.gst_rate) {
        htmlContent += `<div class="data-item">
            <span class="data-label">GST Rate:</span>
            <span class="data-value">${invoiceData.gst_rate}%</span>
        </div>`;
    }
    
    htmlContent += '</div></div>';
    htmlContent += '</div>';
    
    // Display in results section
    FinguardDOM.resultsContent.innerHTML = htmlContent;
    FinguardDOM.resultsSection.style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        FinguardDOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Display error message
 * @param {string} message - Error message to display
 */
export function displayError(message) {
    const errorHtml = `
        <div class="error-message">
            <div class="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <h3 class="error-title">Processing Failed</h3>
            <p class="error-text">${message}</p>
            <button class="retry-btn" onclick="location.reload()">Try Again</button>
        </div>
    `;
    
    FinguardDOM.resultsContent.innerHTML = errorHtml;
    FinguardDOM.resultsSection.style.display = 'block';
    
    // Scroll to error message
    setTimeout(() => {
        FinguardDOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Display validation error
 * @param {string} type - Type of validation (duplicate, anomaly, gst, gst-rate)
 * @param {string} message - Error message
 */
export function displayValidationError(type, message) {
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector(`[data-validation-section="${type}"]`);
    if (existingSection) {
        existingSection.remove();
    }
    
    const getValidationTitle = (t) => {
        const titles = {
            arithmetic: 'Arithmetical Accuracy Check',
            'price-anomaly': 'Price Anomaly Detection',
            duplicate: 'Duplicate Check',
            anomaly: 'Anomaly Detection',
            gst: 'GST Validation',
            'gst-rate': 'GST Rate Validation'
        };
        return titles[t] || 'Validation';
    };
    
    const html = `
        <div class="validation-section" data-validation-section="${type}">
            <div class="validation-header">
                <h3 class="section-title">${getValidationTitle(type)}</h3>
            </div>
            <div class="validation-alert alert-info">
                <div class="alert-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <div class="alert-content">
                    <h4 class="alert-title">Validation Unavailable</h4>
                    <p class="alert-message">${message}</p>
                </div>
            </div>
        </div>
    `;
    
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}
