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
import { checkDuplicate, validateGST, validateGSTRate, checkPriceAnomaly, storeProcessedInvoice } from './api-service.js';

/**
 * Process file with OCR
 */
export async function processFile() {
    console.log('=== processFile called ===');
    
    const selectedFile = getSelectedFile();
    console.log('Selected file:', selectedFile);
    
    if (!selectedFile) {
        console.error('No file selected!');
        alert('Please select a file first');
        return;
    }
    
    console.log('File details:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
    });
    
    // Show processing timeline popup
    console.log('Showing processing popup...');
    showProcessingPopup();
    
    // Show loading state
    console.log('Showing loading state...');
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
 * Step 5: Store processed invoice with all validation results
 * @param {Object} invoiceData - Extracted invoice data
 */
async function startValidationWorkflow(invoiceData) {
    // Get file information for storing
    const selectedFile = getSelectedFile();
    const fileName = selectedFile ? selectedFile.name : 'unknown';
    const fileType = selectedFile ? getFileType(selectedFile) : 'unknown';
    
    // Initialize processing status tracking
    const processingStatus = {
        ocr_processing: {
            success: true,
            comments: null
        },
        arithmetic_accuracy: {
            success: false,
            comments: null
        },
        price_anomaly_check: {
            success: false,
            comments: null
        },
        duplicate_detection: {
            success: false,
            comments: null
        },
        gst_validation: {
            success: false,
            comments: null
        },
        gst_rate_validation: {
            success: false,
            comments: null
        }
    };
    
    let overallStatus = 'failed';
    
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
            console.log('=== Arithmetical accuracy check failed ===');
            updateTimelineStep('arithmetic', 'failed', 'Calculation mismatch detected');
            
            // Update processing status
            processingStatus.arithmetic_accuracy.success = false;
            processingStatus.arithmetic_accuracy.comments = arithmeticResult.message || 'Calculation mismatch detected';
            
            // Mark remaining steps as not executed
            processingStatus.price_anomaly_check.comments = 'Not executed due to arithmetic failure';
            processingStatus.duplicate_detection.comments = 'Not executed due to arithmetic failure';
            processingStatus.gst_validation.comments = 'Not executed due to arithmetic failure';
            processingStatus.gst_rate_validation.comments = 'Not executed due to arithmetic failure';
            
            console.log('=== Storing invoice with arithmetic failure ===');
            console.log('Invoice Data:', invoiceData);
            console.log('Processing Status:', processingStatus);
            
            // Store the invoice with failure status
            const storeResult = await storeProcessedInvoice(invoiceData, processingStatus, 'failed', fileName, fileType);
            console.log('=== Store invoice result (arithmetic failure):', storeResult);
            
            setTimeout(hideProcessingPopup, 2000);
            return;
        }
        
        console.log('=== Arithmetical accuracy check passed ===');
        
        // Update processing status - arithmetic passed
        processingStatus.arithmetic_accuracy.success = true;
        processingStatus.arithmetic_accuracy.comments = null;
        
        // Update timeline: Arithmetic check completed
        updateTimelineStep('arithmetic', 'completed', 'All calculations verified');
        
        // Step 1: Check for price anomalies
        console.log('=== Starting price anomaly check ===');
        updateTimelineStep('price-anomaly', 'in-progress', 'Checking for price anomalies...');
        showValidationLoading('price-anomaly', 'Checking for price anomalies...');
        
        const priceAnomalyResult = await checkPriceAnomaly(invoiceData);
        console.log('=== Price anomaly check result:', priceAnomalyResult);
        
        // Display results
        displayPriceAnomalyResults(priceAnomalyResult);
        
        // Price anomaly check is informational, continue regardless
        if (priceAnomalyResult && priceAnomalyResult.anomalyFound) {
            console.log('=== Price anomalies detected - marking as warning ===');
            updateTimelineStep('price-anomaly', 'failed', 'Price anomalies detected');
            processingStatus.price_anomaly_check.success = false;
            processingStatus.price_anomaly_check.comments = 'Price anomalies detected';
            overallStatus = 'completed_with_warnings'; // Has warnings but can continue
        } else {
            console.log('=== No price anomalies detected ===');
            updateTimelineStep('price-anomaly', 'completed', 'No price anomalies found');
            processingStatus.price_anomaly_check.success = true;
            processingStatus.price_anomaly_check.comments = 'No price anomalies detected';
        }
        
        // Step 2: Check for duplicates
        console.log('=== Starting duplicate detection ===');
        updateTimelineStep('duplicate', 'in-progress', 'Checking for duplicate invoices...');
        showValidationLoading('duplicate', 'Checking for duplicate invoices...');
        
        const duplicateResult = await checkDuplicate(invoiceData);
        console.log('=== Duplicate check result:', duplicateResult);
        
        // Display results
        displayDuplicateResults(duplicateResult);
        
        // If duplicate check returns is_duplicate: false (not a duplicate), proceed to GST validation
        if (duplicateResult && duplicateResult.is_duplicate === false) {
            console.log('=== No duplicate found, proceeding to GST validation ===');
            
            // Update timeline: Duplicate check completed
            updateTimelineStep('duplicate', 'completed', 'No duplicate found');
            processingStatus.duplicate_detection.success = true;
            processingStatus.duplicate_detection.comments = 'No duplicate found';
            
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
                processingStatus.gst_validation.success = true;
                processingStatus.gst_validation.comments = null;
                
                // Step 4: Validate GST Rates
                console.log('=== GST validation successful, proceeding to GST rate validation ===');
                updateTimelineStep('gst-rate', 'in-progress', 'Validating GST rates...');
                showValidationLoading('gst-rate', 'Validating GST rates for line items...');
                
                const gstRateResult = await validateGSTRate(invoiceData);
                console.log('=== GST rate validation result:', gstRateResult);
                
                // Display results
                displayGSTRateResults(gstRateResult);
                
                // Check if GST rate validation was successful (status: "ok")
                if (gstRateResult && gstRateResult.status === 'ok') {
                    console.log('=== GST rate validation passed - ALL CHECKS COMPLETE ===');
                    // Update timeline: GST rate validation completed
                    updateTimelineStep('gst-rate', 'completed', 'All GST rates are valid');
                    processingStatus.gst_rate_validation.success = true;
                    processingStatus.gst_rate_validation.comments = 'All GST rates are valid';
                    
                    // Set overall status based on warnings
                    if (overallStatus !== 'completed_with_warnings') {
                        overallStatus = 'completed';
                    }
                    
                    console.log('=== Storing invoice with SUCCESS status ===');
                    console.log('Overall Status:', overallStatus);
                    console.log('Invoice Data:', invoiceData);
                    console.log('Processing Status:', processingStatus);
                    
                    // Store the processed invoice
                    const storeResult = await storeProcessedInvoice(invoiceData, processingStatus, overallStatus, fileName, fileType);
                    console.log('=== Store invoice result (success):', storeResult);
                    
                    // Hide popup after a delay
                    setTimeout(hideProcessingPopup, 2000);
                } else if (gstRateResult && gstRateResult.status === 'anomaly') {
                    console.log('=== GST rate validation has anomalies ===');
                    // Update timeline: GST rate validation failed
                    updateTimelineStep('gst-rate', 'failed', 'GST rate anomalies detected');
                    processingStatus.gst_rate_validation.success = false;
                    processingStatus.gst_rate_validation.comments = 'GST rate anomalies detected';
                    overallStatus = 'completed_with_warnings';
                    
                    console.log('=== Storing invoice with warnings (GST rate anomalies) ===');
                    console.log('Overall Status:', overallStatus);
                    
                    // Store the processed invoice with warnings
                    const storeResult = await storeProcessedInvoice(invoiceData, processingStatus, overallStatus, fileName, fileType);
                    console.log('=== Store invoice result (warnings):', storeResult);
                    
                    // Hide popup after a delay
                    setTimeout(hideProcessingPopup, 2000);
                }
            } else if (gstResult && gstResult.valid === false) {
                console.log('=== GST validation failed ===');
                // Update timeline: GST validation failed
                updateTimelineStep('gst', 'failed', 'GST validation failed');
                processingStatus.gst_validation.success = false;
                processingStatus.gst_validation.comments = 'GST validation failed';
                processingStatus.gst_rate_validation.comments = 'Not executed due to GST validation failure';
                overallStatus = 'failed';
                
                console.log('=== Storing invoice with GST validation failure ===');
                console.log('Overall Status:', overallStatus);
                
                // Store the processed invoice with failure status
                const storeResult = await storeProcessedInvoice(invoiceData, processingStatus, overallStatus, fileName, fileType);
                console.log('=== Store invoice result (GST failure):', storeResult);
                
                // Hide popup after a delay
                setTimeout(hideProcessingPopup, 2000);
            }
        } else if (duplicateResult && duplicateResult.is_duplicate === true) {
            console.log('=== Duplicate invoice detected ===');
            // Update timeline: Duplicate found (failed state)
            updateTimelineStep('duplicate', 'failed', 'Duplicate invoice detected');
            processingStatus.duplicate_detection.success = false;
            processingStatus.duplicate_detection.comments = 'Duplicate invoice detected';
            processingStatus.gst_validation.comments = 'Not executed due to duplicate detection';
            processingStatus.gst_rate_validation.comments = 'Not executed due to duplicate detection';
            overallStatus = 'failed';
            
            console.log('=== Storing invoice with duplicate detection failure ===');
            console.log('Overall Status:', overallStatus);
            
            // Store the processed invoice with failure status
            const storeResult = await storeProcessedInvoice(invoiceData, processingStatus, overallStatus, fileName, fileType);
            console.log('=== Store invoice result (duplicate):', storeResult);
            
            // Hide popup after a delay
            setTimeout(hideProcessingPopup, 2000);
        }
        
    } catch (error) {
        console.error('Error in validation workflow:', error);
        // Hide popup on error
        setTimeout(hideProcessingPopup, 2000);
    }
}
