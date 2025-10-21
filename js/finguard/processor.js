/**
 * Adani Fintell Suite - FinGuard
 * Processor Module
 * Orchestrates the invoice processing and validation workflow
 */

'use strict';

import { API_ENDPOINTS } from '../utils/api-endpoints.js';
import { getSelectedFile } from './state.js';
import { getFileType, disableSubmitButton, enableSubmitButton } from './file-upload.js';
import { showLoadingState, hideLoadingState, showValidationLoading } from './ui-helpers.js';
import { showProcessingPopup, hideProcessingPopup, updateTimelineStep } from './timeline-popup.js';
import { displayInvoiceData, displayError, displayValidationError } from './display.js';
import { 
    displayArithmeticResults, 
    displayPriceAnomalyResults, 
    displayDuplicateResults, 
    displayGSTResults, 
    displayGSTRateResults 
} from './display-results.js';
import { checkArithmeticalAccuracy } from './validation.js';
import { checkDuplicate, validateGST, validateGSTRate, checkPriceAnomaly } from './api-service.js';

/**
 * Process file with OCR
 */
export async function processFile() {
    const selectedFile = getSelectedFile();
    
    if (!selectedFile) {
        alert('Please select a file first');
        return;
    }
    
    // Show processing timeline popup
    showProcessingPopup();
    
    // Show loading state
    showLoadingState();
    disableSubmitButton();
    
    try {
        // Update timeline: OCR in progress
        updateTimelineStep('ocr', 'in-progress', 'Extracting data from invoice...');
        
        // Get file type
        const fileType = getFileType(selectedFile);
        
        console.log('Processing file:', selectedFile.name);
        console.log('File type:', fileType);
        console.log('File size:', selectedFile.size);
        
        // Determine endpoint based on file type
        let endpoint;
        if (fileType === 'pdf') {
            endpoint = API_ENDPOINTS.FINGUARD.OCR_PDF;
        } else {
            // For png and jpeg
            endpoint = API_ENDPOINTS.FINGUARD.OCR_IMAGE;
        }
        
        console.log('Sending request to:', endpoint);
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Send request to OCR endpoint
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        console.log('Response received:', responseData);
        
        // Display results
        displayResults(responseData);
        
    } catch (error) {
        console.error('Error processing file:', error);
        // Update timeline: OCR failed
        updateTimelineStep('ocr', 'failed', 'Failed to extract data from invoice');
        displayError('Error processing file. Please try again.');
        // Hide popup after a delay
        setTimeout(hideProcessingPopup, 2000);
    } finally {
        hideLoadingState();
        enableSubmitButton();
    }
}

/**
 * Display OCR results
 * @param {Array|Object} responseData - Response data from OCR endpoint
 */
function displayResults(responseData) {
    // Handle response - it should be an array with a single object
    let data = responseData;
    
    // If response is an array, get the first element
    if (Array.isArray(responseData) && responseData.length > 0) {
        data = responseData[0];
    }
    
    // Check if OCR was successful
    if (!data || typeof data !== 'object') {
        // Update timeline: OCR failed
        updateTimelineStep('ocr', 'failed', 'Invalid response format received');
        displayError('Invalid response format received.');
        setTimeout(hideProcessingPopup, 2000);
        return;
    }
    
    // Check success field
    if (data.success === false) {
        // Update timeline: OCR failed
        updateTimelineStep('ocr', 'failed', 'Document could not be processed');
        displayError('OCR processing failed. The document could not be processed successfully.');
        setTimeout(hideProcessingPopup, 2000);
        return;
    }
    
    if (data.success !== true) {
        // Update timeline: OCR failed
        updateTimelineStep('ocr', 'failed', 'Processing status unknown');
        displayError('OCR processing status unknown. Please try again.');
        setTimeout(hideProcessingPopup, 2000);
        return;
    }
    
    // If success is true, display the extracted data and start the validation workflow
    if (data.data) {
        // Update timeline: OCR completed
        updateTimelineStep('ocr', 'completed', 'Data extracted successfully');
        
        // First display the extracted data
        displayInvoiceData(data.data);
        
        // Start the validation workflow: duplicate check -> GST validation
        startValidationWorkflow(data.data);
    } else {
        // Update timeline: OCR failed
        updateTimelineStep('ocr', 'failed', 'No data extracted');
        displayError('OCR was successful but no data was extracted.');
        setTimeout(hideProcessingPopup, 2000);
    }
}

/**
 * Start the complete validation workflow
 * Step 0: Check arithmetical accuracy
 * Step 1: Check for price anomalies
 * Step 2: Check for duplicates
 * Step 3: If not duplicate (is_duplicate: false), validate GST directly
 * Step 4: If GST validation successful, validate GST rates
 * @param {Object} invoiceData - Extracted invoice data
 */
async function startValidationWorkflow(invoiceData) {
    try {
        console.log('Starting validation workflow...');
        
        // Step 0: Check arithmetical accuracy
        const arithmeticResult = await checkArithmeticalAccuracy(invoiceData);
        
        // Update timeline: Arithmetic check in progress
        updateTimelineStep('arithmetic', 'in-progress', 'Verifying calculations...');
        
        // Show loading indicator
        showValidationLoading('arithmetic', 'Checking arithmetical accuracy...');
        
        // Display results
        displayArithmeticResults(arithmeticResult);
        
        // If arithmetic check fails, stop the workflow
        if (!arithmeticResult.accurate) {
            console.log('Arithmetical accuracy check failed');
            updateTimelineStep('arithmetic', 'failed', 'Calculation mismatch detected');
            setTimeout(hideProcessingPopup, 2000);
            return;
        }
        
        // Update timeline: Arithmetic check completed
        updateTimelineStep('arithmetic', 'completed', 'All calculations verified');
        
        // Step 1: Check for price anomalies
        updateTimelineStep('price-anomaly', 'in-progress', 'Checking for price anomalies...');
        showValidationLoading('price-anomaly', 'Checking for price anomalies...');
        
        const priceAnomalyResult = await checkPriceAnomaly(invoiceData);
        
        // Display results
        displayPriceAnomalyResults(priceAnomalyResult);
        
        // Price anomaly check is informational, continue regardless
        if (priceAnomalyResult && priceAnomalyResult.anomalyFound) {
            updateTimelineStep('price-anomaly', 'failed', 'Price anomalies detected');
        } else {
            updateTimelineStep('price-anomaly', 'completed', 'No price anomalies found');
        }
        
        // Step 2: Check for duplicates
        updateTimelineStep('duplicate', 'in-progress', 'Checking for duplicate invoices...');
        showValidationLoading('duplicate', 'Checking for duplicate invoices...');
        
        const duplicateResult = await checkDuplicate(invoiceData);
        
        // Display results
        displayDuplicateResults(duplicateResult);
        
        // If duplicate check returns is_duplicate: false (not a duplicate), proceed to GST validation
        if (duplicateResult && duplicateResult.is_duplicate === false) {
            console.log('No duplicate found, proceeding to GST validation...');
            
            // Update timeline: Duplicate check completed
            updateTimelineStep('duplicate', 'completed', 'No duplicate found');
            
            // Step 3: Validate GST
            updateTimelineStep('gst', 'in-progress', 'Validating GST information...');
            showValidationLoading('gst', 'Validating GST information...');
            
            const gstResult = await validateGST(invoiceData);
            
            // Display results
            displayGSTResults(gstResult);
            
            // Check if GST validation was successful using the 'valid' field
            if (gstResult && gstResult.valid === true) {
                // Update timeline: GST validation completed
                updateTimelineStep('gst', 'completed', 'GST validation successful');
                
                // Step 4: Validate GST Rates
                console.log('GST validation successful, proceeding to GST rate validation...');
                updateTimelineStep('gst-rate', 'in-progress', 'Validating GST rates...');
                showValidationLoading('gst-rate', 'Validating GST rates for line items...');
                
                const gstRateResult = await validateGSTRate(invoiceData);
                
                // Display results
                displayGSTRateResults(gstRateResult);
                
                // Check if GST rate validation was successful (status: "ok")
                if (gstRateResult && gstRateResult.status === 'ok') {
                    // Update timeline: GST rate validation completed
                    updateTimelineStep('gst-rate', 'completed', 'All GST rates are valid');
                    // Hide popup after a delay
                    setTimeout(hideProcessingPopup, 2000);
                } else if (gstRateResult && gstRateResult.status === 'anomaly') {
                    // Update timeline: GST rate validation failed
                    updateTimelineStep('gst-rate', 'failed', 'GST rate anomalies detected');
                    // Hide popup after a delay
                    setTimeout(hideProcessingPopup, 2000);
                }
            } else if (gstResult && gstResult.valid === false) {
                // Update timeline: GST validation failed
                updateTimelineStep('gst', 'failed', 'GST validation failed');
                // Hide popup after a delay
                setTimeout(hideProcessingPopup, 2000);
            }
        } else if (duplicateResult && duplicateResult.is_duplicate === true) {
            // Update timeline: Duplicate found (failed state)
            updateTimelineStep('duplicate', 'failed', 'Duplicate invoice detected');
            // Hide popup after a delay
            setTimeout(hideProcessingPopup, 2000);
        }
        
    } catch (error) {
        console.error('Error in validation workflow:', error);
        // Hide popup on error
        setTimeout(hideProcessingPopup, 2000);
    }
}
