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
                        updateTimelineStep('arithmetic', 'completed', 'All calculations verified successfully');
                        console.log('Arithmetic validation passed:', arithmeticCheck);
                    } else {
                        updateTimelineStep('arithmetic', 'failed', `Calculation errors found: ${arithmeticCheck.errors.join(', ')}`);
                        console.warn('Arithmetic validation failed:', arithmeticCheck);
                        // Continue to next step even if this fails
                    }
                } catch (error) {
                    console.error('Arithmetic validation error:', error);
                    updateTimelineStep('arithmetic', 'failed', 'Failed to perform arithmetic checks');
                    // Continue to next step
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
                    console.log('Price Anomaly Response:', priceAnomalyData);
                    
                    // Handle array response
                    if (Array.isArray(priceAnomalyData) && priceAnomalyData.length > 0) {
                        priceAnomalyData = priceAnomalyData[0];
                    }
                    
                    if (priceAnomalyData.success) {
                        updateTimelineStep('price-anomaly', 'completed', 'No price anomalies detected');
                    } else {
                        updateTimelineStep('price-anomaly', 'failed', 'Price anomaly check failed');
                        // Continue to next step even if this fails
                    }
                } catch (error) {
                    console.error('Price anomaly check error:', error);
                    updateTimelineStep('price-anomaly', 'failed', 'Failed to check price anomalies');
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
                    console.log('Duplicate Detection Response:', duplicateData);
                    
                    // Handle array response
                    if (Array.isArray(duplicateData) && duplicateData.length > 0) {
                        duplicateData = duplicateData[0];
                    }
                    
                    if (duplicateData.success) {
                        updateTimelineStep('duplicate', 'completed', 'No duplicates found');
                    } else {
                        updateTimelineStep('duplicate', 'failed', 'Duplicate check failed');
                        // Continue to next step even if this fails
                    }
                } catch (error) {
                    console.error('Duplicate detection error:', error);
                    updateTimelineStep('duplicate', 'failed', 'Failed to check for duplicates');
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
                    } else {
                        updateTimelineStep('gst', 'failed', 'GST validation failed');
                        // Continue to next step even if this fails
                    }
                } catch (error) {
                    console.error('GST validation error:', error);
                    updateTimelineStep('gst', 'failed', 'Failed to validate GST');
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
                    } else {
                        updateTimelineStep('gst-rate', 'failed', 'GST rate validation failed');
                    }
                } catch (error) {
                    console.error('GST rate validation error:', error);
                    updateTimelineStep('gst-rate', 'failed', 'Failed to validate GST rates');
                }
                
                // Display final success notification
                if (!processingCancelled) {
                    window.NotificationSystem.success(
                        'Processing Complete',
                        'All validation checks completed successfully!'
                    );
                    
                    // Auto-hide modal after 3 seconds
                    setTimeout(() => {
                        if (processingPopup) {
                            processingPopup.style.display = 'none';
                        }
                    }, 3000);
                }
                
            } catch (error) {
                // Don't show error if processing was cancelled
                if (processingCancelled) {
                    console.log('Processing cancelled by user - ignoring error');
                    return;
                }
                
                console.error('Error processing file:', error);
                updateTimelineStep('ocr', 'failed', 'Failed to extract data from invoice');
                
                // Show error notification
                window.NotificationSystem.error(
                    'Processing Failed',
                    'Failed to extract data from invoice. Please try again.'
                );
                
                // Hide popup after delay
                setTimeout(function() {
                    if (processingPopup) {
                        processingPopup.style.display = 'none';
                    }
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
    
    try {
        // Parse numeric values
        const subtotal = parseFloat(invoiceData.subtotal);
        const cgst = parseFloat(invoiceData.cgst_amount) || 0;
        const sgst = parseFloat(invoiceData.sgst_amount) || 0;
        const igst = parseFloat(invoiceData.igst_amount) || 0;
        const invoiceAmount = parseFloat(invoiceData.invoice_amount);
        
        // Validate line items
        if (invoiceData.line_items && Array.isArray(invoiceData.line_items)) {
            let calculatedSubtotal = 0;
            
            invoiceData.line_items.forEach((item, index) => {
                const quantity = parseFloat(item.quantity);
                const rate = parseFloat(item.rate);
                const amount = parseFloat(item.amount);
                const expectedAmount = quantity * rate;
                
                // Check if line item calculation is correct
                if (Math.abs(expectedAmount - amount) > 0.01) {
                    errors.push(`Line item ${index + 1}: Amount mismatch (${amount} vs expected ${expectedAmount})`);
                    isValid = false;
                }
                
                calculatedSubtotal += amount;
            });
            
            // Check if subtotal matches sum of line items
            if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
                errors.push(`Subtotal mismatch (${subtotal} vs calculated ${calculatedSubtotal})`);
                isValid = false;
            }
        }
        
        // Calculate total with taxes
        const calculatedTotal = subtotal + cgst + sgst + igst;
        
        // Check if invoice amount matches calculated total
        if (Math.abs(calculatedTotal - invoiceAmount) > 0.01) {
            errors.push(`Invoice total mismatch (${invoiceAmount} vs calculated ${calculatedTotal})`);
            isValid = false;
        }
        
        return {
            isValid,
            errors,
            calculations: {
                subtotal,
                cgst,
                sgst,
                igst,
                calculatedTotal,
                invoiceAmount
            }
        };
    } catch (error) {
        console.error('Arithmetic validation exception:', error);
        return {
            isValid: false,
            errors: ['Failed to parse invoice amounts'],
            calculations: null
        };
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
    
    // Update progress percentage
    if (status === 'completed') {
        updateProgressPercentage();
    }
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
