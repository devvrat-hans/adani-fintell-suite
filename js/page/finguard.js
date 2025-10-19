/**
 * Adani-Fintell-Suite - FinGuard AI JavaScript
 * File upload and OCR processing functionality
 */

'use strict';

// ==========================================================================
// DOM Elements
// ==========================================================================

const FinguardDOM = {
    uploadArea: document.querySelector('[data-upload-area]'),
    fileInput: document.querySelector('[data-file-input]'),
    browseBtn: document.querySelector('[data-action="browse-file"]'),
    filePreview: document.querySelector('[data-file-preview]'),
    fileName: document.querySelector('[data-file-name]'),
    fileSize: document.querySelector('[data-file-size]'),
    removeFileBtn: document.querySelector('[data-action="remove-file"]'),
    submitBtn: document.querySelector('[data-action="process-file"]'),
    loadingState: document.querySelector('[data-loading-state]'),
    resultsSection: document.querySelector('[data-results-section]'),
    resultsContent: document.querySelector('[data-results-content]'),
    copyBtn: document.querySelector('[data-action="copy-results"]')
};

// ==========================================================================
// State Management
// ==========================================================================

let selectedFile = null;

// ==========================================================================
// File Upload Functions
// ==========================================================================

/**
 * Handle file selection
 * @param {File} file - Selected file
 */
function handleFileSelect(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid file type (PDF, PNG, or JPEG)');
        return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
    }
    
    // Store selected file
    selectedFile = file;
    
    // Update UI
    displayFilePreview(file);
    enableSubmitButton();
    hideUploadArea();
}

/**
 * Display file preview
 * @param {File} file - File to preview
 */
function displayFilePreview(file) {
    FinguardDOM.fileName.textContent = file.name;
    FinguardDOM.fileSize.textContent = formatFileSize(file.size);
    FinguardDOM.filePreview.style.display = 'block';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file type string
 * @param {File} file - File object
 * @returns {string} - File type (pdf, png, jpeg)
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
 * Hide upload area
 */
function hideUploadArea() {
    FinguardDOM.uploadArea.style.display = 'none';
}

/**
 * Show upload area
 */
function showUploadArea() {
    FinguardDOM.uploadArea.style.display = 'block';
}

/**
 * Enable submit button
 */
function enableSubmitButton() {
    FinguardDOM.submitBtn.disabled = false;
}

/**
 * Disable submit button
 */
function disableSubmitButton() {
    FinguardDOM.submitBtn.disabled = true;
}

/**
 * Remove selected file
 */
function removeFile() {
    selectedFile = null;
    FinguardDOM.fileInput.value = '';
    FinguardDOM.filePreview.style.display = 'none';
    showUploadArea();
    disableSubmitButton();
    hideResults();
}

// ==========================================================================
// Drag and Drop Functions
// ==========================================================================

/**
 * Handle drag over event
 * @param {DragEvent} e - Drag event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    FinguardDOM.uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave event
 * @param {DragEvent} e - Drag event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    FinguardDOM.uploadArea.classList.remove('drag-over');
}

/**
 * Handle drop event
 * @param {DragEvent} e - Drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    FinguardDOM.uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}

// ==========================================================================
// API Functions
// ==========================================================================

/**
 * Process file with OCR
 */
async function processFile() {
    if (!selectedFile) {
        alert('Please select a file first');
        return;
    }
    
    // Show loading state
    showLoadingState();
    hideResults();
    disableSubmitButton();
    
    try {
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
        displayError('Error processing file. Please try again.');
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
        displayError('Invalid response format received.');
        return;
    }
    
    // Check success field
    if (data.success === false) {
        displayError('OCR processing failed. The document could not be processed successfully.');
        return;
    }
    
    if (data.success !== true) {
        displayError('OCR processing status unknown. Please try again.');
        return;
    }
    
    // If success is true, display the extracted data and start the validation workflow
    if (data.data) {
        // First display the extracted data
        displayInvoiceData(data.data);
        
        // Start the validation workflow: duplicate check -> anomaly detection -> GST validation
        startValidationWorkflow(data.data);
    } else {
        displayError('OCR was successful but no data was extracted.');
    }
}

/**
 * Start the complete validation workflow
 * Step 1: Check for duplicates
 * Step 2: If not duplicate (success: false), detect anomalies
 * Step 3: If no anomalies (success: false), validate GST
 * @param {Object} invoiceData - Extracted invoice data
 */
async function startValidationWorkflow(invoiceData) {
    try {
        console.log('Starting validation workflow...');
        
        // Step 1: Check for duplicates
        const duplicateResult = await checkDuplicate(invoiceData);
        
        // If duplicate check returns success: false (not a duplicate), proceed to anomaly detection
        if (duplicateResult && duplicateResult.success === false) {
            console.log('No duplicate found, proceeding to anomaly detection...');
            
            // Step 2: Detect anomalies
            const anomalyResult = await detectAnomalies(invoiceData);
            
            // If anomaly detection returns success: false (no anomalies), proceed to GST validation
            if (anomalyResult && anomalyResult.success === false) {
                console.log('No anomalies found, proceeding to GST validation...');
                
                // Step 3: Validate GST
                await validateGST(invoiceData);
            }
        }
        
    } catch (error) {
        console.error('Error in validation workflow:', error);
    }
}

/**
 * Check for duplicate invoices
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - Duplicate check response
 */
async function checkDuplicate(invoiceData) {
    try {
        console.log('Checking for duplicate invoices...');
        
        // Show loading indicator
        showValidationLoading('duplicate', 'Checking for duplicate invoices...');
        
        // Prepare request body
        const requestBody = {
            invoice_number: invoiceData.invoice_number,
            vendor_gstin: invoiceData.vendor_gstin,
            invoice_amount: invoiceData.invoice_amount,
            invoice_date: invoiceData.invoice_date,
            company_gstin: invoiceData.company_gstin
        };
        
        // Send POST request
        const response = await fetch(API_ENDPOINTS.FINGUARD.CHECK_DUPLICATE, {
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
        
        // Display results
        displayDuplicateResults(duplicateData);
        
        return duplicateData;
        
    } catch (error) {
        console.error('Error checking duplicate:', error);
        displayValidationError('duplicate', 'Unable to check for duplicates. Proceeding with validation...');
        return { success: false }; // Allow workflow to continue
    }
}

/**
 * Detect anomalies in invoice data
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - Anomaly detection response
 */
async function detectAnomalies(invoiceData) {
    try {
        console.log('Detecting anomalies...');
        
        // Show loading indicator
        showValidationLoading('anomaly', 'Analyzing invoice for anomalies...');
        
        // Send POST request
        const response = await fetch(API_ENDPOINTS.FINGUARD.DETECT_ANOMALY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const anomalyResponse = await response.json();
        console.log('Anomaly detection response:', anomalyResponse);
        
        // Parse response
        let anomalyData = anomalyResponse;
        if (Array.isArray(anomalyResponse) && anomalyResponse.length > 0) {
            anomalyData = anomalyResponse[0];
        }
        
        // Display results
        displayAnomalyResults(anomalyData);
        
        return anomalyData;
        
    } catch (error) {
        console.error('Error detecting anomalies:', error);
        displayValidationError('anomaly', 'Unable to detect anomalies. Proceeding with GST validation...');
        return { success: false }; // Allow workflow to continue
    }
}

/**
 * Validate GST information
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - GST validation response
 */
async function validateGST(invoiceData) {
    try {
        console.log('Validating GST...');
        
        // Show loading indicator
        showValidationLoading('gst', 'Validating GST information...');
        
        // Prepare request body
        const requestBody = {
            vendor_gstin: invoiceData.vendor_gstin,
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
        
        // Display results
        displayGSTResults(gstData);
        
        return gstData;
        
    } catch (error) {
        console.error('Error validating GST:', error);
        displayValidationError('gst', 'Unable to validate GST information.');
        return null;
    }
}

/**
 * Show loading indicator for validation steps
 * @param {string} type - Type of validation (duplicate, anomaly, gst)
 * @param {string} message - Loading message
 */
function showValidationLoading(type, message) {
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
function getValidationTitle(type) {
    const titles = {
        duplicate: 'Duplicate Check',
        anomaly: 'Anomaly Detection',
        gst: 'GST Validation'
    };
    return titles[type] || 'Validation';
}

/**
 * Display duplicate check results
 * @param {Object} duplicateData - Duplicate check response
 */
function displayDuplicateResults(duplicateData) {
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector('[data-validation-section="duplicate"]');
    if (existingSection) {
        existingSection.remove();
    }
    
    let html = '<div class="validation-section" data-validation-section="duplicate">';
    html += '<div class="validation-header">';
    html += '<h3 class="section-title">Duplicate Check</h3>';
    html += '</div>';
    
    // Check if duplicate was found (success: true means duplicate found)
    const isDuplicate = duplicateData.success === true || 
                        duplicateData.is_duplicate === true ||
                        duplicateData.duplicate_found === true;
    
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
        
        // Show duplicate details if available
        if (duplicateData.matching_invoices && duplicateData.matching_invoices.length > 0) {
            html += '<div class="duplicate-details">';
            html += '<p class="details-title">Matching Invoice(s):</p>';
            duplicateData.matching_invoices.forEach(match => {
                html += `<div class="duplicate-item">
                    <p><strong>Invoice:</strong> ${match.invoice_number || 'N/A'}</p>
                    <p><strong>Date:</strong> ${match.date || match.invoice_date || 'N/A'}</p>
                    ${match.match_confidence ? `<span class="match-confidence">Confidence: ${match.match_confidence}</span>` : ''}
                </div>`;
            });
            html += '</div>';
        }
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
                <p class="alert-message">This invoice is unique. Proceeding with further validation...</p>
            </div>
        `;
        html += '</div>';
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}

/**
 * Display anomaly detection results
 * @param {Object|Array} anomalyResponse - Response from anomaly detection endpoint
 */
function displayAnomalyResults(anomalyResponse) {
    // Parse response - handle both object and array formats
    let anomalyData = anomalyResponse;
    
    if (Array.isArray(anomalyResponse) && anomalyResponse.length > 0) {
        anomalyData = anomalyResponse[0];
    }
    
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector('[data-validation-section="anomaly"]');
    if (existingSection) {
        existingSection.remove();
    }
    
    let html = '<div class="validation-section" data-validation-section="anomaly">';
    html += '<div class="validation-header">';
    html += '<h3 class="section-title">Anomaly Detection</h3>';
    html += '</div>';
    
    // Check if anomalies were detected (success: true means anomalies found)
    const hasAnomalies = anomalyData.success === true ||
                        anomalyData.anomaly_detected === true || 
                        anomalyData.anomalies_found === true ||
                        (anomalyData.anomalies && anomalyData.anomalies.length > 0);
    
    if (hasAnomalies) {
        html += '<div class="validation-alert alert-warning">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">⚠️ Anomalies Detected</h4>
                <p class="alert-message">This invoice contains potential issues that require attention. Further validation has been stopped.</p>
            </div>
        `;
        html += '</div>';
        
        // Display anomaly details
        if (anomalyData.anomalies && Array.isArray(anomalyData.anomalies)) {
            html += '<div class="anomaly-list">';
            anomalyData.anomalies.forEach((anomaly, index) => {
                html += `
                    <div class="anomaly-item">
                        <div class="anomaly-number">${index + 1}</div>
                        <div class="anomaly-details">
                            <p class="anomaly-type">${anomaly.type || 'Unknown Issue'}</p>
                            <p class="anomaly-description">${anomaly.description || anomaly.message || 'No details available'}</p>
                            ${anomaly.severity ? `<span class="anomaly-severity severity-${anomaly.severity.toLowerCase()}">${anomaly.severity}</span>` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else if (anomalyData.message || anomalyData.description) {
            html += `<p class="anomaly-summary">${anomalyData.message || anomalyData.description}</p>`;
        }
        
    } else {
        html += '<div class="validation-alert alert-success">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">✓ No Anomalies Detected</h4>
                <p class="alert-message">This invoice appears to be valid with no detected issues. Proceeding with GST validation...</p>
            </div>
        `;
        html += '</div>';
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}

/**
 * Display GST validation results
 * @param {Object|Array} gstResponse - Response from GST validation endpoint
 */
function displayGSTResults(gstResponse) {
    // Parse response
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
    
    // Check if GST validation passed
    const isValid = gstData.success === true ||
                    (gstData.vendor_gstin_valid !== false && 
                     gstData.company_gstin_valid !== false && 
                     gstData.tax_calculation_valid !== false);
    
    const hasErrors = gstData.errors && gstData.errors.length > 0;
    
    if (!isValid || hasErrors) {
        html += '<div class="validation-alert alert-warning">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">⚠️ GST Validation Issues</h4>
                <p class="alert-message">Some GST validation checks failed. Please review the details below.</p>
            </div>
        `;
        html += '</div>';
        
        // Display validation details
        html += '<div class="gst-validation-details">';
        
        if (gstData.vendor_gstin_valid === false) {
            html += '<div class="validation-item error">';
            html += '<span class="validation-label">Vendor GSTIN:</span>';
            html += '<span class="validation-status">❌ Invalid</span>';
            html += '</div>';
        } else if (gstData.vendor_gstin_valid === true) {
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">Vendor GSTIN:</span>';
            html += '<span class="validation-status">✓ Valid</span>';
            html += '</div>';
        }
        
        if (gstData.company_gstin_valid === false) {
            html += '<div class="validation-item error">';
            html += '<span class="validation-label">Company GSTIN:</span>';
            html += '<span class="validation-status">❌ Invalid</span>';
            html += '</div>';
        } else if (gstData.company_gstin_valid === true) {
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">Company GSTIN:</span>';
            html += '<span class="validation-status">✓ Valid</span>';
            html += '</div>';
        }
        
        if (gstData.tax_calculation_valid === false) {
            html += '<div class="validation-item error">';
            html += '<span class="validation-label">Tax Calculation:</span>';
            html += '<span class="validation-status">❌ Invalid</span>';
            html += '</div>';
        } else if (gstData.tax_calculation_valid === true) {
            html += '<div class="validation-item success">';
            html += '<span class="validation-label">Tax Calculation:</span>';
            html += '<span class="validation-status">✓ Valid</span>';
            html += '</div>';
        }
        
        html += '</div>';
        
        // Display errors if available
        if (hasErrors) {
            html += '<div class="gst-errors">';
            html += '<p class="errors-title">Error Details:</p>';
            gstData.errors.forEach(error => {
                html += `<div class="error-item">
                    <span class="error-field">${error.field}:</span>
                    <span class="error-message">${error.message}</span>
                </div>`;
            });
            html += '</div>';
        }
        
    } else {
        html += '<div class="validation-alert alert-success">';
        html += `
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div class="alert-content">
                <h4 class="alert-title">✓ GST Validation Passed</h4>
                <p class="alert-message">All GST information is valid and tax calculations are correct.</p>
            </div>
        `;
        html += '</div>';
        
        // Display validation details
        html += '<div class="gst-validation-details">';
        html += '<div class="validation-item success">';
        html += '<span class="validation-label">Vendor GSTIN:</span>';
        html += '<span class="validation-status">✓ Valid</span>';
        html += '</div>';
        html += '<div class="validation-item success">';
        html += '<span class="validation-label">Company GSTIN:</span>';
        html += '<span class="validation-status">✓ Valid</span>';
        html += '</div>';
        html += '<div class="validation-item success">';
        html += '<span class="validation-label">Tax Calculation:</span>';
        html += '<span class="validation-status">✓ Valid</span>';
        html += '</div>';
        html += '</div>';
    }
    
    html += '</div>';
    
    // Append to invoice data
    FinguardDOM.resultsContent.querySelector('.invoice-data').insertAdjacentHTML('beforeend', html);
}

/**
 * Display validation error
 * @param {string} type - Type of validation (duplicate, anomaly, gst)
 * @param {string} message - Error message
 */
function displayValidationError(type, message) {
    // Remove loading section
    const existingSection = FinguardDOM.resultsContent.querySelector(`[data-validation-section="${type}"]`);
    if (existingSection) {
        existingSection.remove();
    }
    
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

/**
 * Display anomaly detection error (legacy function kept for compatibility)
 * @param {string} message - Error message
 */
function displayAnomalyError(message) {
    displayValidationError('anomaly', message);
}

/**
 * Display extracted invoice data in a formatted way
 * @param {Object} invoiceData - Extracted invoice data
 */
function displayInvoiceData(invoiceData) {
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
function displayError(message) {
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
 * Show loading state
 */
function showLoadingState() {
    FinguardDOM.loadingState.style.display = 'block';
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    FinguardDOM.loadingState.style.display = 'none';
}

/**
 * Hide results section
 */
function hideResults() {
    FinguardDOM.resultsSection.style.display = 'none';
}

/**
 * Copy results to clipboard
 */
async function copyResults() {
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

// ==========================================================================
// Event Listeners
// ==========================================================================

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Browse button click
    if (FinguardDOM.browseBtn) {
        FinguardDOM.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling to upload area
            FinguardDOM.fileInput.click();
        });
    }
    
    // File input change
    if (FinguardDOM.fileInput) {
        FinguardDOM.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }
    
    // Upload area click
    if (FinguardDOM.uploadArea) {
        FinguardDOM.uploadArea.addEventListener('click', (e) => {
            // Only trigger if clicking directly on upload area, not on browse button
            if (e.target !== FinguardDOM.browseBtn && !FinguardDOM.browseBtn.contains(e.target)) {
                FinguardDOM.fileInput.click();
            }
        });
        
        // Drag and drop events
        FinguardDOM.uploadArea.addEventListener('dragover', handleDragOver);
        FinguardDOM.uploadArea.addEventListener('dragleave', handleDragLeave);
        FinguardDOM.uploadArea.addEventListener('drop', handleDrop);
    }
    
    // Remove file button
    if (FinguardDOM.removeFileBtn) {
        FinguardDOM.removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFile();
        });
    }
    
    // Submit button
    if (FinguardDOM.submitBtn) {
        FinguardDOM.submitBtn.addEventListener('click', processFile);
    }
    
    // Copy button
    if (FinguardDOM.copyBtn) {
        FinguardDOM.copyBtn.addEventListener('click', copyResults);
    }
}

// ==========================================================================
// Authentication Check
// ==========================================================================

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    
    if (!isAuthenticated || isAuthenticated !== 'true') {
        console.log('User not authenticated, redirecting to signin');
        window.location.href = 'signin.html';
        return false;
    }
    
    return true;
}

// ==========================================================================
// Initialization
// ==========================================================================

/**
 * Initialize FinGuard page
 */
function initFinguard() {
    console.log('FinGuard page initialized');
    
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Setup event listeners
    initEventListeners();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinguard);
} else {
    initFinguard();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initFinguard,
        processFile,
        removeFile
    };
}
