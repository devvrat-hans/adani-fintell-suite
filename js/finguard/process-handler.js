/**
 * Adani Fintell Suite - FinGuard
 * Process Handler - Non-module script for reliable button handling
 */

'use strict';

console.log('=== process-handler.js loaded ===');

// Global flag to track if processing has been cancelled
let processingCancelled = false;

// Wait for DOM and all scripts to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Process handler: DOM ready');
    
    setTimeout(function() {
        console.log('Process handler: Setting up button click handlers');
        
        const submitBtn = document.querySelector('[data-action="process-file"]');
        const cancelBtn = document.querySelector('[data-action="cancel-processing"]');
        
        if (!submitBtn) {
            console.error('Process handler: Submit button not found!');
            return;
        }
        
        console.log('Process handler: Submit button found, attaching click handler');
        
        // Cancel button handler - minimizes the modal
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                console.log('Minimize processing modal clicked');
                minimizeProcessingModal();
            });
            console.log('Process handler: Cancel/minimize button handler attached');
        }
        
        // Make functions available globally for HTML onclick handlers
        window.expandProcessingModal = expandProcessingModal;
        window.cancelProcessing = cancelProcessing;
        
        submitBtn.addEventListener('click', async function() {
            console.log('=== Process button clicked ===');
            
            const selectedFile = window.selectedInvoiceFile;
            console.log('Selected file:', selectedFile);
            
            if (!selectedFile) {
                window.NotificationSystem.warning(
                    'No File Selected',
                    'Please select a file before processing'
                );
                return;
            }
            
            console.log('File details:', {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size
            });
            
            // Reset cancellation flag at the start of processing
            processingCancelled = false;
            
            // Show processing popup
            const processingPopup = document.querySelector('[data-processing-popup]');
            if (processingPopup) {
                processingPopup.style.display = 'flex';
                console.log('Processing popup shown');
            }
            
            // Show loading state
            const loadingState = document.querySelector('[data-loading-state]');
            if (loadingState) {
                loadingState.style.display = 'block';
                console.log('Loading state shown');
            }
            
            // Disable submit button
            submitBtn.disabled = true;
            
            try {
                // Update timeline step
                updateTimelineStep('ocr', 'in-progress', 'Extracting data from invoice...');
                
                // Check if cancelled before proceeding
                if (processingCancelled) {
                    console.log('Processing cancelled by user before API call');
                    return;
                }
                
                // Verify API_ENDPOINTS is available
                if (!window.API_ENDPOINTS) {
                    throw new Error('API_ENDPOINTS not available. Please ensure api-endpoints.js is loaded.');
                }
                
                console.log('API_ENDPOINTS available:', !!window.API_ENDPOINTS);
                console.log('FINGUARD endpoints:', window.API_ENDPOINTS.FINGUARD);
                
                // Determine endpoint based on file type
                const fileType = getFileType(selectedFile);
                console.log('File type detected:', fileType);
                
                let endpoint;
                if (fileType === 'pdf') {
                    endpoint = window.API_ENDPOINTS.FINGUARD.OCR_PDF;
                    console.log('Using PDF OCR endpoint');
                } else if (fileType === 'png' || fileType === 'jpeg') {
                    endpoint = window.API_ENDPOINTS.FINGUARD.OCR_IMAGE;
                    console.log('Using IMAGE OCR endpoint');
                } else {
                    throw new Error('Unsupported file type: ' + fileType);
                }
                
                console.log('Endpoint selected:', endpoint);
                console.log('Sending request to:', endpoint);
                
                // Create FormData
                const formData = new FormData();
                formData.append('file', selectedFile);
                console.log('FormData created with file:', selectedFile.name);
                
                // Send request
                console.log('Sending POST request...');
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                
                // Check if cancelled after API call
                if (processingCancelled) {
                    console.log('Processing cancelled by user after API call');
                    return;
                }
                
                console.log('Response received');
                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                let ocrResponse = await response.json();
                console.log('OCR Response data:', ocrResponse);
                
                // Check if cancelled before updating UI
                if (processingCancelled) {
                    console.log('Processing cancelled by user after receiving response');
                    return;
                }
                
                // Handle array response - extract first element if array
                if (Array.isArray(ocrResponse) && ocrResponse.length > 0) {
                    ocrResponse = ocrResponse[0];
                }
                
                // Check if OCR was successful
                if (!ocrResponse.success) {
                    throw new Error('OCR processing failed: ' + (ocrResponse.message || 'Unknown error'));
                }
                
                // Store the OCR data in localStorage
                const invoiceData = ocrResponse.data;
                localStorage.setItem('currentInvoiceData', JSON.stringify(invoiceData));
                console.log('Invoice data stored in localStorage:', invoiceData);
                
                // Initialize processing status tracking object
                const processingStatus = {
                    ocr_extraction: {
                        success: true,
                        comments: 'OCR extraction successful'
                    },
                    arithmetic_accuracy: {
                        success: null,
                        comments: 'Not executed yet'
                    },
                    price_anomaly_check: {
                        success: null,
                        comments: 'Not executed yet'
                    },
                    duplicate_detection: {
                        success: null,
                        comments: 'Not executed yet'
                    },
                    gst_validation: {
                        success: null,
                        comments: 'Not executed yet'
                    },
                    gst_rate_validation: {
                        success: null,
                        comments: 'Not executed yet'
                    }
                };
                
                // Initialize API responses tracking object
                const apiResponses = {
                    ocr_processing: {
                        success: true,
                        comments: 'OCR extraction successful',
                        full_response: ocrResponse // Store complete OCR response
                    },
                    arithmetic_accuracy: {
                        success: null,
                        comments: 'Not executed yet',
                        full_response: null
                    },
                    price_anomaly_check: {
                        success: null,
                        comments: 'Not executed yet',
                        full_response: null
                    },
                    duplicate_detection: {
                        success: null,
                        comments: 'Not executed yet',
                        full_response: null
                    },
                    gst_validation: {
                        success: null,
                        comments: 'Not executed yet',
                        full_response: null
                    },
                    gst_rate_validation: {
                        success: null,
                        comments: 'Not executed yet',
                        full_response: null
                    }
                };
                
                // Track overall status
                let overallStatus = 'completed'; // Can be: completed, completed_with_warnings, failed
                
                console.log('=== Processing status tracking initialized ===');
                console.log('=== API responses tracking initialized ===');
                console.log('Initial processing status:', processingStatus);
                
                // Update timeline: OCR completed
                updateTimelineStep('ocr', 'completed', 'Data extracted successfully');
                
                // Wait a bit before next step
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (processingCancelled) return;
                
                // Step 2: Arithmetical Accuracy Check (Frontend validation)
                updateTimelineStep('arithmetic', 'in-progress', 'Performing arithmetical checks...');
                
                try {
                    const arithmeticCheck = performArithmeticValidation(invoiceData);
                    
                    if (processingCancelled) return;
                    
                    if (arithmeticCheck.isValid) {
                        // Show success message with details
                        const successMessage = arithmeticCheck.details && arithmeticCheck.details.length > 0 
                            ? arithmeticCheck.details[0] // Show first detail
                            : 'All calculations verified successfully';
                        updateTimelineStep('arithmetic', 'completed', successMessage);
                        processingStatus.arithmetic_accuracy.success = true;
                        processingStatus.arithmetic_accuracy.comments = 'All calculations verified successfully';
                        apiResponses.arithmetic_accuracy.success = true;
                        apiResponses.arithmetic_accuracy.comments = 'All calculations verified successfully';
                        apiResponses.arithmetic_accuracy.full_response = arithmeticCheck;
                        console.log('Arithmetic validation passed:', arithmeticCheck);
                    } else {
                        // Show detailed error message
                        const errorMessage = arithmeticCheck.errors && arithmeticCheck.errors.length > 0 
                            ? arithmeticCheck.errors[0] // Show first error for brevity
                            : 'Calculation errors found';
                        updateTimelineStep('arithmetic', 'failed', errorMessage);
                        processingStatus.arithmetic_accuracy.success = false;
                        processingStatus.arithmetic_accuracy.comments = arithmeticCheck.errors.join('; ');
                        apiResponses.arithmetic_accuracy.success = false;
                        apiResponses.arithmetic_accuracy.comments = arithmeticCheck.errors.join('; ');
                        apiResponses.arithmetic_accuracy.full_response = arithmeticCheck;
                        overallStatus = 'failed';
                        console.warn('Arithmetic validation failed:', arithmeticCheck);
                        // Continue to next step even if this fails
                    }
                } catch (error) {
                    console.error('Arithmetic validation error:', error);
                    updateTimelineStep('arithmetic', 'failed', `Failed to perform checks: ${error.message}`);
                    processingStatus.arithmetic_accuracy.success = false;
                    processingStatus.arithmetic_accuracy.comments = `Error: ${error.message}`;
                    apiResponses.arithmetic_accuracy.success = false;
                    apiResponses.arithmetic_accuracy.comments = `Error: ${error.message}`;
                    apiResponses.arithmetic_accuracy.full_response = { error: error.message };
                    overallStatus = 'failed';
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                if (processingCancelled) return;
                
                // Step 3: Price Anomaly Detection
                updateTimelineStep('price-anomaly', 'in-progress', 'Checking for price anomalies...');
                
                try {
                    const priceAnomalyResponse = await fetch(window.API_ENDPOINTS.FINGUARD.PRICE_ANOMALY, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(invoiceData)
                    });
                    
                    if (processingCancelled) return;
                    
                    let priceAnomalyData = await priceAnomalyResponse.json();
                    console.log('=== Price Anomaly Response:', priceAnomalyData);
                    
                    // Handle array response - API returns: [{ json: { anomalyFound: true/false, ... } }]
                    if (Array.isArray(priceAnomalyData) && priceAnomalyData.length > 0) {
                        priceAnomalyData = priceAnomalyData[0].json || priceAnomalyData[0];
                    }
                    
                    console.log('=== Processed price anomaly data:', priceAnomalyData);
                    
                    // Updated API response format: response directly contains anomalyFound field
                    const hasAnomalies = priceAnomalyData.anomalyFound === true;
                    const anomalyCount = priceAnomalyData.anomalyCount || 0;
                    const totalItems = priceAnomalyData.totalItems || 0;
                    
                    console.log('=== Price Anomaly Results - hasAnomalies:', hasAnomalies, 'count:', anomalyCount, 'total:', totalItems);
                    
                    if (hasAnomalies) {
                        // Anomalies found - mark as failed (red)
                        const failureMessage = `Price anomalies detected: ${anomalyCount} of ${totalItems} items`;
                        updateTimelineStep('price-anomaly', 'failed', failureMessage);
                        processingStatus.price_anomaly_check.success = false;
                        processingStatus.price_anomaly_check.comments = failureMessage;
                        apiResponses.price_anomaly_check.success = false;
                        apiResponses.price_anomaly_check.comments = failureMessage;
                        apiResponses.price_anomaly_check.full_response = priceAnomalyData;
                        overallStatus = 'failed';
                    } else {
                        // No anomalies found - mark as completed (green)
                        const successMessage = `No price anomalies detected (${totalItems} items checked)`;
                        updateTimelineStep('price-anomaly', 'completed', successMessage);
                        processingStatus.price_anomaly_check.success = true;
                        processingStatus.price_anomaly_check.comments = successMessage;
                        apiResponses.price_anomaly_check.success = true;
                        apiResponses.price_anomaly_check.comments = successMessage;
                        apiResponses.price_anomaly_check.full_response = priceAnomalyData;
                    }
                } catch (error) {
                    console.error('Price anomaly check error:', error);
                    updateTimelineStep('price-anomaly', 'failed', 'Failed to check price anomalies');
                    processingStatus.price_anomaly_check.success = false;
                    processingStatus.price_anomaly_check.comments = `Error: ${error.message}`;
                    apiResponses.price_anomaly_check.success = false;
                    apiResponses.price_anomaly_check.comments = `Error: ${error.message}`;
                    apiResponses.price_anomaly_check.full_response = { error: error.message };
                    overallStatus = 'failed';
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                if (processingCancelled) return;
                
                // Step 4: Duplicate Detection
                updateTimelineStep('duplicate', 'in-progress', 'Checking for duplicate invoices...');
                
                try {
                    const duplicateResponse = await fetch(window.API_ENDPOINTS.FINGUARD.DETECT_DUPLICATE, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(invoiceData)
                    });
                    
                    if (processingCancelled) return;
                    
                    let duplicateData = await duplicateResponse.json();
                    console.log('=== Duplicate Detection Response:', duplicateData);
                    
                    // Handle array response
                    if (Array.isArray(duplicateData) && duplicateData.length > 0) {
                        duplicateData = duplicateData[0];
                    }
                    
                    // Updated API response format: response directly contains is_duplicate field
                    // No nested success/data structure
                    const isDuplicate = duplicateData.is_duplicate === true;
                    const duplicateType = duplicateData.duplicate_type || 'none';
                    const confidenceScore = duplicateData.confidence_score || 0;
                    
                    console.log('=== Duplicate Check Results - is_duplicate:', isDuplicate, 'type:', duplicateType, 'confidence:', confidenceScore);
                    
                    if (isDuplicate) {
                        // Duplicate found - mark as failed (red)
                        let failureMessage = 'Duplicate invoice detected';
                        
                        // Provide more specific message based on duplicate type
                        if (duplicateType === 'exact_match') {
                            failureMessage = `Exact duplicate found (${confidenceScore}% confidence)`;
                        } else if (duplicateType === 'fuzzy_match') {
                            failureMessage = `Similar invoice found (${confidenceScore}% confidence)`;
                        } else if (duplicateType === 'potential_duplicate') {
                            failureMessage = `Potential duplicate detected (${confidenceScore}% confidence)`;
                        } else if (duplicateType === 'content_match') {
                            failureMessage = `Content match found (${confidenceScore}% confidence)`;
                        }
                        
                        updateTimelineStep('duplicate', 'failed', failureMessage);
                        processingStatus.duplicate_detection.success = false;
                        processingStatus.duplicate_detection.comments = failureMessage;
                        apiResponses.duplicate_detection.success = false;
                        apiResponses.duplicate_detection.comments = failureMessage;
                        apiResponses.duplicate_detection.full_response = duplicateData;
                        overallStatus = 'failed';
                    } else {
                        // No duplicate found - mark as completed (green)
                        updateTimelineStep('duplicate', 'completed', 'No duplicates found');
                        processingStatus.duplicate_detection.success = true;
                        processingStatus.duplicate_detection.comments = 'No duplicate invoice found';
                        apiResponses.duplicate_detection.success = true;
                        apiResponses.duplicate_detection.comments = 'No duplicate invoice found';
                        apiResponses.duplicate_detection.full_response = duplicateData;
                    }
                } catch (error) {
                    console.error('Duplicate detection error:', error);
                    updateTimelineStep('duplicate', 'failed', 'Failed to check for duplicates');
                    processingStatus.duplicate_detection.success = false;
                    processingStatus.duplicate_detection.comments = `Error: ${error.message}`;
                    apiResponses.duplicate_detection.success = false;
                    apiResponses.duplicate_detection.comments = `Error: ${error.message}`;
                    apiResponses.duplicate_detection.full_response = { error: error.message };
                    overallStatus = 'completed_with_warnings';
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                if (processingCancelled) return;
                
                // Step 5: GST Validation
                updateTimelineStep('gst', 'in-progress', 'Validating GST numbers...');
                
                try {
                    const gstResponse = await fetch(window.API_ENDPOINTS.FINGUARD.VALIDATE_GST, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(invoiceData)
                    });
                    
                    if (processingCancelled) return;
                    
                    let gstData = await gstResponse.json();
                    console.log('GST Validation Response:', gstData);
                    
                    // Handle array response
                    if (Array.isArray(gstData) && gstData.length > 0) {
                        gstData = gstData[0];
                    }
                    
                    if (gstData.success) {
                        updateTimelineStep('gst', 'completed', 'GST numbers validated');
                        processingStatus.gst_validation.success = true;
                        processingStatus.gst_validation.comments = 'GST numbers validated successfully';
                        apiResponses.gst_validation.success = true;
                        apiResponses.gst_validation.comments = 'GST numbers validated successfully';
                        apiResponses.gst_validation.full_response = gstData;
                    } else {
                        updateTimelineStep('gst', 'failed', 'GST validation failed');
                        processingStatus.gst_validation.success = false;
                        processingStatus.gst_validation.comments = 'GST validation failed';
                        apiResponses.gst_validation.success = false;
                        apiResponses.gst_validation.comments = 'GST validation failed';
                        apiResponses.gst_validation.full_response = gstData;
                        overallStatus = 'failed';
                        // Continue to next step even if this fails
                    }
                } catch (error) {
                    console.error('GST validation error:', error);
                    updateTimelineStep('gst', 'failed', 'Failed to validate GST');
                    processingStatus.gst_validation.success = false;
                    processingStatus.gst_validation.comments = `Error: ${error.message}`;
                    apiResponses.gst_validation.success = false;
                    apiResponses.gst_validation.comments = `Error: ${error.message}`;
                    apiResponses.gst_validation.full_response = { error: error.message };
                    overallStatus = 'failed';
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                if (processingCancelled) return;
                
                // Step 6: GST Rate Validation
                updateTimelineStep('gst-rate', 'in-progress', 'Validating GST rates...');
                
                try {
                    const gstRateResponse = await fetch(window.API_ENDPOINTS.FINGUARD.VALIDATE_GST_RATE, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(invoiceData)
                    });
                    
                    if (processingCancelled) return;
                    
                    let gstRateData = await gstRateResponse.json();
                    console.log('GST Rate Validation Response:', gstRateData);
                    
                    // Handle array response
                    if (Array.isArray(gstRateData) && gstRateData.length > 0) {
                        gstRateData = gstRateData[0];
                    }
                    
                    if (gstRateData.success) {
                        updateTimelineStep('gst-rate', 'completed', 'GST rates validated');
                        processingStatus.gst_rate_validation.success = true;
                        processingStatus.gst_rate_validation.comments = 'GST rates validated successfully';
                        apiResponses.gst_rate_validation.success = true;
                        apiResponses.gst_rate_validation.comments = 'GST rates validated successfully';
                        apiResponses.gst_rate_validation.full_response = gstRateData;
                    } else {
                        updateTimelineStep('gst-rate', 'failed', 'GST rate validation failed');
                        processingStatus.gst_rate_validation.success = false;
                        processingStatus.gst_rate_validation.comments = 'GST rate validation failed';
                        apiResponses.gst_rate_validation.success = false;
                        apiResponses.gst_rate_validation.comments = 'GST rate validation failed';
                        apiResponses.gst_rate_validation.full_response = gstRateData;
                        overallStatus = 'failed';
                    }
                } catch (error) {
                    console.error('GST rate validation error:', error);
                    updateTimelineStep('gst-rate', 'failed', 'Failed to validate GST rates');
                    processingStatus.gst_rate_validation.success = false;
                    processingStatus.gst_rate_validation.comments = `Error: ${error.message}`;
                    apiResponses.gst_rate_validation.success = false;
                    apiResponses.gst_rate_validation.comments = `Error: ${error.message}`;
                    apiResponses.gst_rate_validation.full_response = { error: error.message };
                    overallStatus = 'failed';
                }
                
                // Store processed invoice in database
                if (!processingCancelled) {
                    console.log('=== Storing processed invoice in database ===');
                    console.log('Invoice Data:', invoiceData);
                    console.log('Processing Status:', processingStatus);
                    console.log('API Responses:', apiResponses);
                    console.log('Overall Status:', overallStatus);
                    console.log('File Name:', selectedFile.name);
                    console.log('File Type:', fileType);
                    
                    try {
                        const storeResponse = await storeProcessedInvoice(
                            invoiceData,
                            processingStatus,
                            apiResponses, // Include full API responses
                            overallStatus,
                            selectedFile.name,
                            fileType
                        );
                        console.log('=== Store invoice response:', storeResponse);
                        console.log('=== Response type:', typeof storeResponse);
                        console.log('=== Is Array:', Array.isArray(storeResponse));
                        
                        // Determine success/failure based on response
                        let isSuccess = false;
                        let notificationTitle = '';
                        let notificationMessage = '';
                        
                        // Handle the response format: [{ success: true/false, invoice_id: "...", message/error: "..." }]
                        let responseData = storeResponse;
                        
                        // Handle array response
                        if (Array.isArray(storeResponse) && storeResponse.length > 0) {
                            responseData = storeResponse[0];
                            console.log('=== Extracted response data from array:', responseData);
                        }
                        
                        // Check if response is valid and has success indicator
                        // SUCCESS CRITERIA: If all 6 APIs were successfully executed (regardless of validation pass/fail),
                        // and the store-processed-invoice API returns success, then show success
                        if (responseData && typeof responseData === 'object') {
                            // Check for the success field (new API format)
                            if (responseData.success === true || responseData._id || responseData.invoice_id) {
                                console.log('✅ Invoice processing complete - all APIs executed successfully');
                                isSuccess = true;
                                notificationTitle = '✅ Invoice Processed Successfully';
                                
                                // Get processing summary to show what passed/failed
                                const summary = responseData.processing_summary || storeResponse.processing_summary;
                                if (summary) {
                                    const passRate = ((summary.passed_checks / summary.total_checks) * 100).toFixed(0);
                                    notificationMessage = `Invoice processing complete! ${summary.passed_checks}/${summary.total_checks} validation checks passed (${passRate}%). Data saved to database.`;
                                } else {
                                    notificationMessage = 'Invoice processing complete! All validation checks have been performed and results have been saved to the database.';
                                }
                            }
                            // Explicit failure (success === false)
                            else if (responseData.success === false) {
                                console.warn('❌ Failed to complete invoice processing:', responseData);
                                isSuccess = false;
                                notificationTitle = '❌ Invoice Processing Failed';
                                notificationMessage = responseData.error || responseData.message || 'Failed to complete invoice processing. Please try again.';
                                if (responseData.details) {
                                    notificationMessage += ` (${responseData.details})`;
                                }
                            }
                            // No clear success/failure indicator
                            else {
                                console.warn('⚠️ Ambiguous response - no clear success indicator:', responseData);
                                isSuccess = false;
                                notificationTitle = '❌ Invoice Processing Failed';
                                notificationMessage = 'Unexpected response from server. Please check if invoice was stored.';
                            }
                        } else {
                            // Response is null or not an object
                            console.warn('❌ Invalid response - null or not an object:', storeResponse);
                            isSuccess = false;
                            notificationTitle = '❌ Invoice Processing Failed';
                            notificationMessage = 'No response from server. Please try again.';
                        }
                        
                        console.log('=== Notification decision - isSuccess:', isSuccess);
                        console.log('=== Notification title:', notificationTitle);
                        console.log('=== Notification message:', notificationMessage);
                        
                        // Close timeline modal first
                        if (processingPopup) {
                            console.log('=== Closing timeline modal');
                            processingPopup.style.display = 'none';
                        }
                        
                        // Show completion modal after a brief delay to ensure timeline modal has closed
                        setTimeout(() => {
                            console.log('=== Showing completion modal - isSuccess:', isSuccess);
                            showCompletionModal(isSuccess, notificationMessage, responseData);
                        }, 300);
                        
                    } catch (storeError) {
                        console.error('Error storing invoice:', storeError);
                        
                        // Close timeline modal
                        if (processingPopup) {
                            console.log('=== Closing timeline modal due to error');
                            processingPopup.style.display = 'none';
                        }
                        
                        // Show failure modal after a brief delay
                        setTimeout(() => {
                            console.log('=== Showing error modal for store exception');
                            showCompletionModal(false, `Error storing invoice: ${storeError.message}`, null);
                        }, 300);
                    }
                } else {
                    // Processing was cancelled
                    console.log('=== Processing was cancelled by user');
                    if (processingPopup) {
                        processingPopup.style.display = 'none';
                        document.body.classList.remove('modal-open');
                    }
                }
                
                // Removed - No longer showing generic completion notification
                
            } catch (error) {
                // Don't show error if processing was cancelled
                if (processingCancelled) {
                    console.log('Processing cancelled by user - ignoring error');
                    return;
                }
                
                console.error('Error processing file:', error);
                
                // Only update OCR step if it's an OCR-specific error (early in the workflow)
                // Don't reset OCR if error occurs in later validation steps
                const ocrData = localStorage.getItem('currentInvoiceData');
                if (!ocrData) {
                    // OCR never completed successfully, so it's an OCR error
                    updateTimelineStep('ocr', 'failed', 'Failed to extract data from invoice');
                    
                    // Show error notification
                    window.NotificationSystem.error(
                        'Processing Failed',
                        'Failed to extract data from invoice. Please try again.'
                    );
                } else {
                    // OCR completed but later validation failed
                    console.log('Validation workflow error - OCR was successful but later step failed');
                    
                    // Show generic error notification
                    window.NotificationSystem.error(
                        'Processing Error',
                        'An error occurred during validation. Please check the timeline for details.'
                    );
                }
                
                // Hide popup after delay and remove modal-open class
                setTimeout(function() {
                    if (processingPopup) {
                        processingPopup.style.display = 'none';
                    }
                    document.body.classList.remove('modal-open');
                }, 2000);
            } finally {
                // Only reset UI if not cancelled (cancelled state is handled separately)
                if (!processingCancelled) {
                    if (loadingState) {
                        loadingState.style.display = 'none';
                    }
                    submitBtn.disabled = false;
                }
            }
        });
        
        console.log('Process handler: Button click handler attached successfully');
        
    }, 600); // Wait 600ms to ensure all elements are ready
});

/**
 * Perform arithmetic validation on invoice data
 * @param {Object} invoiceData - Invoice data from OCR
 * @returns {Object} - Validation result with isValid and errors array
 */
function performArithmeticValidation(invoiceData) {
    const errors = [];
    let isValid = true;
    const details = [];
    
    try {
        // Parse numeric values with better error handling
        const parseAmount = (value, fieldName) => {
            const parsed = parseFloat(value);
            if (isNaN(parsed)) {
                errors.push(`Invalid ${fieldName}: "${value}" is not a number`);
                isValid = false;
                return 0;
            }
            return parsed;
        };
        
        const subtotal = parseAmount(invoiceData.subtotal, 'subtotal');
        const cgst = parseAmount(invoiceData.cgst_amount, 'CGST amount') || 0;
        const sgst = parseAmount(invoiceData.sgst_amount, 'SGST amount') || 0;
        const igst = parseAmount(invoiceData.igst_amount, 'IGST amount') || 0;
        const invoiceAmount = parseAmount(invoiceData.invoice_amount, 'invoice amount');
        
        // Validate line items
        if (invoiceData.line_items && Array.isArray(invoiceData.line_items)) {
            let calculatedSubtotal = 0;
            
            invoiceData.line_items.forEach((item, index) => {
                const quantity = parseFloat(item.quantity);
                const rate = parseFloat(item.rate);
                const amount = parseFloat(item.amount);
                
                if (isNaN(quantity) || isNaN(rate) || isNaN(amount)) {
                    errors.push(`Line ${index + 1}: Invalid data (Qty: ${item.quantity}, Rate: ${item.rate}, Amount: ${item.amount})`);
                    isValid = false;
                    return;
                }
                
                const expectedAmount = quantity * rate;
                
                // Check if line item calculation is correct (allow 0.01 tolerance for rounding)
                if (Math.abs(expectedAmount - amount) > 0.01) {
                    errors.push(`Line ${index + 1}: ${quantity} × ₹${rate} = ₹${expectedAmount.toFixed(2)} but shows ₹${amount.toFixed(2)}`);
                    isValid = false;
                } else {
                    details.push(`Line ${index + 1}: ✓ ${quantity} × ₹${rate} = ₹${amount.toFixed(2)}`);
                }
                
                calculatedSubtotal += amount;
            });
            
            // Check if subtotal matches sum of line items (allow 1 rupee tolerance)
            if (Math.abs(calculatedSubtotal - subtotal) > 1) {
                errors.push(`Subtotal Error: Line items sum to ₹${calculatedSubtotal.toFixed(2)} but subtotal is ₹${subtotal.toFixed(2)}`);
                isValid = false;
            } else {
                details.push(`✓ Line items total: ₹${calculatedSubtotal.toFixed(2)} matches subtotal: ₹${subtotal.toFixed(2)}`);
            }
        }
        
        // Calculate total with taxes
        const calculatedTotal = subtotal + cgst + sgst + igst;
        
        // Build tax breakdown detail
        const taxDetails = [];
        if (cgst > 0) taxDetails.push(`CGST: ₹${cgst.toFixed(2)}`);
        if (sgst > 0) taxDetails.push(`SGST: ₹${sgst.toFixed(2)}`);
        if (igst > 0) taxDetails.push(`IGST: ₹${igst.toFixed(2)}`);
        
        // Check if invoice amount matches calculated total (allow 1 rupee tolerance)
        if (Math.abs(calculatedTotal - invoiceAmount) > 1) {
            errors.push(`Total Error: ₹${subtotal.toFixed(2)} + ${taxDetails.join(' + ')} = ₹${calculatedTotal.toFixed(2)} but invoice shows ₹${invoiceAmount.toFixed(2)}`);
            isValid = false;
        } else {
            details.push(`✓ Subtotal + Taxes: ₹${subtotal.toFixed(2)} + ${taxDetails.join(' + ')} = ₹${invoiceAmount.toFixed(2)}`);
        }
        
        return {
            isValid,
            errors,
            details,
            calculations: {
                subtotal,
                cgst,
                sgst,
                igst,
                calculatedTotal,
                invoiceAmount,
                difference: Math.abs(calculatedTotal - invoiceAmount)
            }
        };
    } catch (error) {
        console.error('Arithmetic validation exception:', error);
        return {
            isValid: false,
            errors: [`Failed to parse invoice amounts: ${error.message}`],
            details: [],
            calculations: null
        };
    }
}

/**
 * Store processed invoice in database
 */
async function storeProcessedInvoice(invoiceData, processingStatus, apiResponses, overallStatus, fileName, fileType) {
    try {
        console.log('Storing processed invoice...');
        
        // Count passed and failed checks
        let passedChecks = 0;
        let failedChecks = 0;
        const allChecks = [];
        
        // Create all_checks array with proper structure
        const checkNames = [
            { key: 'ocr_extraction', apiKey: 'ocr_processing', label: 'OCR Extraction' },
            { key: 'arithmetic_accuracy', label: 'Arithmetic Accuracy' },
            { key: 'price_anomaly_check', label: 'Price Anomaly Check' },
            { key: 'duplicate_detection', label: 'Duplicate Detection' },
            { key: 'gst_validation', label: 'GST Validation' },
            { key: 'gst_rate_validation', label: 'GST Rate Validation' }
        ];
        
        checkNames.forEach(({ key, apiKey, label }) => {
            const apiResponseKey = apiKey || key;
            const success = apiResponses[apiResponseKey]?.success || false;
            const comments = apiResponses[apiResponseKey]?.comments || 'Not executed';
            
            if (success === true) {
                passedChecks++;
            } else if (success === false) {
                failedChecks++;
            }
            
            allChecks.push({
                check_name: key,
                success: success,
                comments: comments
            });
        });
        
        const totalChecks = passedChecks + failedChecks;
        
        // Create the invoice result object
        const invoiceResult = {
            invoice_id: invoiceData.invoice_id || invoiceData.id || invoiceData._id,
            invoice_number: invoiceData.invoice_number,
            invoice_date: invoiceData.invoice_date,
            invoice_amount: invoiceData.invoice_amount,
            vendor_name: invoiceData.vendor_name,
            vendor_gstin: invoiceData.vendor_gstin,
            company_gstin: invoiceData.company_gstin,
            subtotal: invoiceData.subtotal,
            cgst_amount: invoiceData.cgst_amount,
            sgst_amount: invoiceData.sgst_amount,
            igst_amount: invoiceData.igst_amount,
            gst_rate: invoiceData.gst_rate,
            hsn_sac_codes: invoiceData.hsn_sac_codes,
            line_items: invoiceData.line_items,
            upload_timestamp: invoiceData.upload_timestamp || new Date().toISOString(),
            processing_status: {
                ocr_extraction: {
                    success: apiResponses.ocr_processing?.success || false,
                    comments: apiResponses.ocr_processing?.comments || 'OCR processing status'
                },
                arithmetic_accuracy: {
                    success: apiResponses.arithmetic_accuracy?.success || false,
                    comments: apiResponses.arithmetic_accuracy?.comments || 'Arithmetic accuracy status'
                },
                price_anomaly_check: {
                    success: apiResponses.price_anomaly_check?.success || false,
                    comments: apiResponses.price_anomaly_check?.comments || 'Price anomaly check status'
                },
                duplicate_detection: {
                    success: apiResponses.duplicate_detection?.success || false,
                    comments: apiResponses.duplicate_detection?.comments || 'Duplicate detection status'
                },
                gst_validation: {
                    success: apiResponses.gst_validation?.success || false,
                    comments: apiResponses.gst_validation?.comments || 'GST validation status'
                },
                gst_rate_validation: {
                    success: apiResponses.gst_rate_validation?.success || false,
                    comments: apiResponses.gst_rate_validation?.comments || 'GST rate validation status'
                }
            },
            api_responses: {
                ocr_processing: {
                    success: apiResponses.ocr_processing?.success || false,
                    comments: apiResponses.ocr_processing?.comments || null,
                    full_response: apiResponses.ocr_processing?.full_response || null
                },
                arithmetic_accuracy: {
                    success: apiResponses.arithmetic_accuracy?.success || false,
                    comments: apiResponses.arithmetic_accuracy?.comments || null,
                    full_response: apiResponses.arithmetic_accuracy?.full_response || null
                },
                price_anomaly_check: {
                    success: apiResponses.price_anomaly_check?.success || false,
                    comments: apiResponses.price_anomaly_check?.comments || null,
                    full_response: apiResponses.price_anomaly_check?.full_response || null
                },
                duplicate_detection: {
                    success: apiResponses.duplicate_detection?.success || false,
                    comments: apiResponses.duplicate_detection?.comments || null,
                    full_response: apiResponses.duplicate_detection?.full_response || null
                },
                gst_validation: {
                    success: apiResponses.gst_validation?.success || false,
                    comments: apiResponses.gst_validation?.comments || null,
                    full_response: apiResponses.gst_validation?.full_response || null
                },
                gst_rate_validation: {
                    success: apiResponses.gst_rate_validation?.success || false,
                    comments: apiResponses.gst_rate_validation?.comments || null,
                    full_response: apiResponses.gst_rate_validation?.full_response || null
                }
            }
        };
        
        // Prepare request body with the new structure
        const requestBody = {
            results: [invoiceResult],
            metadata: {
                overall_status: overallStatus,
                processed_at: new Date().toISOString(),
                file_name: fileName,
                file_type: fileType,
                total_invoices: 1
            },
            processing_summary: {
                passed_checks: passedChecks,
                failed_checks: failedChecks,
                total_checks: totalChecks,
                all_checks: allChecks
            },
            api_responses_full: apiResponses
        };
        
        console.log('Store invoice request body:', JSON.stringify(requestBody, null, 2));
        
        // Send POST request
        const response = await fetch(window.API_ENDPOINTS.FINGUARD.STORE_PROCESSED_INVOICE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const storeResponse = await response.json();
        console.log('Store invoice response:', storeResponse);
        
        // The response should now have the complete structure with _id, results, metadata, processing_summary
        return storeResponse;
        
    } catch (error) {
        console.error('Error storing processed invoice:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get file type from file object
 */
function getFileType(file) {
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
 * Update timeline step status
 */
function updateTimelineStep(step, status, message) {
    console.log(`=== UPDATE TIMELINE STEP (process-handler.js) ===`);
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
        // Hide all icons in THIS specific container only
        const allIcons = iconContainer.querySelectorAll('svg');
        console.log(`Found ${allIcons.length} icons in container for step ${step}`);
        allIcons.forEach(icon => {
            icon.style.display = 'none';
        });
        
        // Show appropriate icon based on status
        let iconClass;
        if (status === 'in-progress') {
            iconClass = '.icon-loading';
        } else if (status === 'completed') {
            iconClass = '.icon-success';
        } else if (status === 'failed') {
            iconClass = '.icon-error';
        } else {
            iconClass = '.icon-pending';
        }
        
        console.log(`Determined icon class: ${iconClass}`);
        
        const activeIcon = iconContainer.querySelector(iconClass);
        if (activeIcon) {
            activeIcon.style.display = 'block';
            console.log(`Successfully set ${iconClass} to display:block for step ${step}`);
        } else {
            console.warn(`Icon ${iconClass} not found for step ${step}`);
        }
    } else {
        console.warn(`Icon container not found for step: ${step}`);
    }
    
    // Update progress percentage
    if (status === 'completed') {
        updateProgressPercentage();
    }
    
    console.log(`=== TIMELINE STEP UPDATE COMPLETE (process-handler.js) ===\n`);
}

/**
 * Update the progress percentage indicator
 */
function updateProgressPercentage() {
    const steps = ['ocr', 'arithmetic', 'price-anomaly', 'duplicate', 'gst', 'gst-rate'];
    const totalSteps = steps.length;
    
    let completedSteps = 0;
    steps.forEach(step => {
        const timelineItem = document.querySelector(`[data-timeline-step="${step}"]`);
        if (timelineItem && timelineItem.getAttribute('data-status') === 'completed') {
            completedSteps++;
        }
    });
    
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    const percentageElement = document.querySelector('[data-progress-percentage]');
    
    if (percentageElement) {
        percentageElement.textContent = `${percentage}%`;
    }
    
    console.log(`Progress: ${completedSteps}/${totalSteps} steps completed (${percentage}%)`);
}

/**
 * Reset all timeline steps to pending state
 */
function resetTimelineSteps() {
    const steps = ['ocr', 'arithmetic', 'price-anomaly', 'duplicate', 'gst', 'gst-rate'];
    const defaultMessages = {
        'ocr': 'Waiting to process...',
        'arithmetic': 'Waiting to verify...',
        'price-anomaly': 'Waiting to check prices...',
        'duplicate': 'Waiting to check...',
        'gst': 'Waiting to validate...',
        'gst-rate': 'Waiting to validate rates...'
    };
    
    steps.forEach(step => {
        updateTimelineStep(step, 'pending', defaultMessages[step]);
    });
    
    // Reset progress percentage
    const percentageElement = document.querySelector('[data-progress-percentage]');
    if (percentageElement) {
        percentageElement.textContent = '0%';
    }
}

/**
 * Minimize the processing modal to bottom corner
 */
function minimizeProcessingModal() {
    const processingPopup = document.querySelector('[data-processing-popup]');
    const minimizedIndicator = document.querySelector('[data-minimized-processing]');
    const loadingState = document.querySelector('[data-loading-state]');
    
    if (processingPopup) {
        processingPopup.style.display = 'none';
    }
    
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    if (minimizedIndicator) {
        minimizedIndicator.style.display = 'flex';
        updateMinimizedIndicator();
    }
}

/**
 * Expand the minimized indicator back to full modal
 */
function expandProcessingModal() {
    const processingPopup = document.querySelector('[data-processing-popup]');
    const minimizedIndicator = document.querySelector('[data-minimized-processing]');
    const loadingState = document.querySelector('[data-loading-state]');
    
    if (minimizedIndicator) {
        minimizedIndicator.style.display = 'none';
    }
    
    if (processingPopup) {
        processingPopup.style.display = 'flex';
    }
    
    if (loadingState) {
        loadingState.style.display = 'block';
    }
}

/**
 * Cancel processing completely
 */
function cancelProcessing() {
    // Set the cancellation flag to stop any ongoing processing
    processingCancelled = true;
    
    const processingPopup = document.querySelector('[data-processing-popup]');
    const minimizedIndicator = document.querySelector('[data-minimized-processing]');
    const loadingState = document.querySelector('[data-loading-state]');
    const submitBtn = document.querySelector('[data-action="process-file"]');
    
    if (processingPopup) {
        processingPopup.style.display = 'none';
    }
    
    if (minimizedIndicator) {
        minimizedIndicator.style.display = 'none';
    }
    
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
    }
    
    // Remove modal-open class when cancelling
    document.body.classList.remove('modal-open');
    
    resetTimelineSteps();
    
    console.log('Processing cancelled by user - all operations stopped');
}

/**
 * Update the minimized indicator with current step information
 */
function updateMinimizedIndicator() {
    const currentStepElement = document.querySelector('[data-current-step]');
    if (!currentStepElement) return;
    
    // Find the current in-progress step
    const steps = ['ocr', 'arithmetic', 'price-anomaly', 'duplicate', 'gst', 'gst-rate'];
    const stepTitles = {
        'ocr': 'OCR Processing',
        'arithmetic': 'Arithmetical Check',
        'price-anomaly': 'Price Anomaly Detection',
        'duplicate': 'Duplicate Detection',
        'gst': 'GST Validation',
        'gst-rate': 'GST Rate Validation'
    };
    
    for (const step of steps) {
        const timelineItem = document.querySelector(`[data-timeline-step="${step}"]`);
        if (timelineItem && timelineItem.getAttribute('data-status') === 'in-progress') {
            currentStepElement.textContent = stepTitles[step];
            return;
        }
    }
    
    // If no step is in progress, show first pending step
    currentStepElement.textContent = 'Preparing...';
}

/**
 * Show completion modal with processing results
 * @param {boolean} isSuccess - Whether processing was successful
 * @param {string} message - Message to display
 * @param {object} responseData - Response data from store-processed-invoice API
 */
function showCompletionModal(isSuccess, message, responseData) {
    console.log('=== showCompletionModal called ===');
    console.log('isSuccess:', isSuccess);
    console.log('message:', message);
    console.log('responseData:', responseData);
    
    const completionModal = document.querySelector('[data-completion-modal]');
    const completionHeader = document.querySelector('[data-completion-header]');
    const completionTitle = document.querySelector('[data-completion-title]');
    const completionSubtitle = document.querySelector('[data-completion-subtitle]');
    const completionMessage = document.querySelector('[data-completion-message]');
    const completionMessageBox = document.querySelector('[data-completion-message-box]');
    const totalChecksEl = document.querySelector('[data-total-checks]');
    const passedChecksEl = document.querySelector('[data-passed-checks]');
    const iconSuccess = completionModal.querySelector('.icon-success');
    const iconError = completionModal.querySelector('.icon-error');
    
    if (!completionModal) {
        console.error('Completion modal not found!');
        alert(isSuccess ? 'Invoice Processed Successfully!' : 'Invoice Processing Failed!');
        return;
    }
    
    // Update modal styling based on success/failure
    if (isSuccess) {
        completionHeader.classList.add('success');
        completionHeader.classList.remove('failed');
        completionMessageBox.classList.add('success');
        completionMessageBox.classList.remove('failed');
        iconSuccess.style.display = 'block';
        iconError.style.display = 'none';
        completionTitle.textContent = 'Invoice Processed Successfully';
        completionSubtitle.textContent = 'All validation steps have been completed';
    } else {
        completionHeader.classList.add('failed');
        completionHeader.classList.remove('success');
        completionMessageBox.classList.add('failed');
        completionMessageBox.classList.remove('success');
        iconSuccess.style.display = 'none';
        iconError.style.display = 'block';
        completionTitle.textContent = 'Invoice Processing Failed';
        completionSubtitle.textContent = 'Unable to complete processing';
    }
    
    // Update message
    completionMessage.textContent = message;
    
    // Update stats if available
    if (responseData && responseData.processing_summary) {
        const summary = responseData.processing_summary;
        totalChecksEl.textContent = summary.total_checks || '6';
        passedChecksEl.textContent = summary.passed_checks || '0';
        
        if (summary.passed_checks > 0) {
            passedChecksEl.classList.add('success');
            passedChecksEl.classList.remove('failed');
        } else {
            passedChecksEl.classList.add('failed');
            passedChecksEl.classList.remove('success');
        }
    } else {
        // Default values - all 6 APIs were executed (success/failure determined by store API)
        totalChecksEl.textContent = '6';
        if (isSuccess) {
            passedChecksEl.textContent = '6';
            passedChecksEl.classList.add('success');
            passedChecksEl.classList.remove('failed');
        } else {
            passedChecksEl.textContent = '0';
            passedChecksEl.classList.add('failed');
            passedChecksEl.classList.remove('success');
        }
    }
    
    // Keep body blur active (modal-open class)
    document.body.classList.add('modal-open');
    
    // Show the modal
    completionModal.classList.add('show');
    console.log('=== Completion modal should now be visible ===');
}

/**
 * Close completion modal
 */
function closeCompletionModal() {
    console.log('=== Closing completion modal ===');
    const completionModal = document.querySelector('[data-completion-modal]');
    
    if (completionModal) {
        completionModal.classList.remove('show');
    }
    
    // Remove blur from body
    document.body.classList.remove('modal-open');
    
    // Reset the file input and UI
    const fileInput = document.querySelector('[data-file-input]');
    const filePreview = document.querySelector('[data-file-preview]');
    const uploadArea = document.querySelector('[data-upload-area]');
    const submitBtn = document.querySelector('[data-action="process-file"]');
    
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (filePreview) {
        filePreview.style.display = 'none';
    }
    
    if (uploadArea) {
        uploadArea.style.display = 'flex';
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // Clear the selected file reference
    window.selectedInvoiceFile = null;
    
    console.log('=== File input and UI reset ===');
}

// Attach event listeners for completion modal
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Setting up completion modal event listeners ===');
    
    const closeButtons = document.querySelectorAll('[data-action="close-completion-modal"]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeCompletionModal);
    });
    
    // Close on overlay click
    const overlay = document.querySelector('.completion-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeCompletionModal);
    }
    
    console.log('=== Completion modal event listeners attached ===');
});
