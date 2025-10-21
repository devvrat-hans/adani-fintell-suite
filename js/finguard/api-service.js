/**
 * Adani Fintell Suite - FinGuard
 * API Service Module
 * Handles all API requests to backend endpoints
 */

'use strict';

import { API_ENDPOINTS } from '../utils/api-endpoints.js';

/**
 * Check for duplicate invoices
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - Duplicate check response
 */
export async function checkDuplicate(invoiceData) {
    try {
        console.log('Checking for duplicate invoices...');
        
        // Prepare request body with full invoice data as per API specification
        const requestBody = {
            invoice_number: invoiceData.invoice_number,
            invoice_date: invoiceData.invoice_date,
            invoice_amount: invoiceData.invoice_amount,
            vendor_gstin: invoiceData.vendor_gstin,
            company_gstin: invoiceData.company_gstin,
            hsn_sac_codes: invoiceData.hsn_sac_codes,
            line_items: invoiceData.line_items,
            subtotal: invoiceData.subtotal,
            cgst_amount: invoiceData.cgst_amount,
            sgst_amount: invoiceData.sgst_amount,
            igst_amount: invoiceData.igst_amount,
            gst_rate: invoiceData.gst_rate
        };
        
        // Send POST request to DETECT_DUPLICATE endpoint
        const response = await fetch(API_ENDPOINTS.FINGUARD.DETECT_DUPLICATE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const duplicateResponse = await response.json();
        console.log('Duplicate check response:', duplicateResponse);
        
        // Parse response
        let duplicateData = duplicateResponse;
        if (Array.isArray(duplicateResponse) && duplicateResponse.length > 0) {
            duplicateData = duplicateResponse[0];
        }
        
        return duplicateData;
        
    } catch (error) {
        console.error('Error checking duplicate:', error);
        return { is_duplicate: false }; // Allow workflow to continue
    }
}

/**
 * Validate GST information
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - GST validation response
 */
export async function validateGST(invoiceData) {
    try {
        console.log('Validating GST...');
        
        // Prepare request body
        const requestBody = {
            vendor_gstin: invoiceData.vendor_gstin,
            vendor_name: invoiceData.vendor_name,
            company_gstin: invoiceData.company_gstin,
            invoice_number: invoiceData.invoice_number,
            invoice_amount: invoiceData.invoice_amount,
            cgst_amount: invoiceData.cgst_amount,
            sgst_amount: invoiceData.sgst_amount,
            igst_amount: invoiceData.igst_amount
        };
        
        // Send POST request
        const response = await fetch(API_ENDPOINTS.FINGUARD.VALIDATE_GST, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const gstResponse = await response.json();
        console.log('GST validation response:', gstResponse);
        
        // Parse response
        let gstData = gstResponse;
        if (Array.isArray(gstResponse) && gstResponse.length > 0) {
            gstData = gstResponse[0];
        }
        
        return gstData;
        
    } catch (error) {
        console.error('Error validating GST:', error);
        return null;
    }
}

/**
 * Validate GST rates for line items
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - GST rate validation response
 */
export async function validateGSTRate(invoiceData) {
    try {
        console.log('Validating GST rates...');
        
        // Prepare request body with all required fields
        const requestBody = {
            invoice_number: invoiceData.invoice_number,
            invoice_date: invoiceData.invoice_date,
            invoice_amount: invoiceData.invoice_amount,
            vendor_gstin: invoiceData.vendor_gstin,
            company_gstin: invoiceData.company_gstin,
            hsn_sac_codes: invoiceData.hsn_sac_codes,
            line_items: invoiceData.line_items,
            subtotal: invoiceData.subtotal,
            cgst_amount: invoiceData.cgst_amount,
            sgst_amount: invoiceData.sgst_amount,
            igst_amount: invoiceData.igst_amount,
            gst_rate: invoiceData.gst_rate
        };
        
        // Send POST request
        const response = await fetch(API_ENDPOINTS.FINGUARD.VALIDATE_GST_RATE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const gstRateResponse = await response.json();
        console.log('GST rate validation response:', gstRateResponse);
        
        // Parse response - it's an array with a single object
        let gstRateData = gstRateResponse;
        if (Array.isArray(gstRateResponse) && gstRateResponse.length > 0) {
            gstRateData = gstRateResponse[0];
        }
        
        return gstRateData;
        
    } catch (error) {
        console.error('Error validating GST rates:', error);
        return null;
    }
}

/**
 * Check for price anomalies
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - Price anomaly check response
 */
export async function checkPriceAnomaly(invoiceData) {
    try {
        console.log('Checking for price anomalies...');
        
        // Prepare request body with line items
        const requestBody = {
            line_items: invoiceData.line_items
        };
        
        // Send POST request
        const response = await fetch(API_ENDPOINTS.FINGUARD.PRICE_ANOMALY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const priceAnomalyResponse = await response.json();
        console.log('Price anomaly response:', priceAnomalyResponse);
        
        // Parse response
        let priceAnomalyData = priceAnomalyResponse;
        if (Array.isArray(priceAnomalyResponse) && priceAnomalyResponse.length > 0) {
            priceAnomalyData = priceAnomalyResponse[0];
        }
        
        return priceAnomalyData;
        
    } catch (error) {
        console.error('Error checking price anomalies:', error);
        return { anomalyFound: false, anomalies: [] };
    }
}
