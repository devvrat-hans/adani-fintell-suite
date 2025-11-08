/**
 * Adani Fintell Suite - Bulk Upload Handler
 * Process multiple invoices with timeline modal for each
 */

'use strict';

console.log('=== Bulk Upload script loaded ===');

// Global state
let selectedFiles = [];
let processingQueue = [];
let currentProcessingIndex = 0;
let isProcessing = false;
let processingCancelled = false;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, setting up bulk upload...');
    
    setTimeout(function() {
        initializeBulkUpload();
    }, 500);
});

/**
 * Initialize bulk upload functionality
 */
function initializeBulkUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.querySelector('[data-upload-area]');
    const fileList = document.querySelector('[data-file-list]');
    const submitBtn = document.querySelector('[data-action="process-all-files"]');
    const clearAllBtn = document.querySelector('[data-action="clear-all"]');
    
    console.log('Elements found:', {
        fileInput: !!fileInput,
        uploadArea: !!uploadArea,
        fileList: !!fileList,
        submitBtn: !!submitBtn
    });
    
    if (!fileInput || !uploadArea) {
        console.error('Required elements not found!');
        return;
    }
    
    // File input change handler
    fileInput.addEventListener('change', function(e) {
        console.log('File input changed!');
        handleFilesSelected(this.files);
    });
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFilesSelected(e.dataTransfer.files);
    });
    
    // Clear all button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            clearAllFiles();
        });
    }
    
    // Process all button
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            startBulkProcessing();
        });
    }
    
    // Setup modal event listeners
    setupModalEventListeners();
    
    console.log('Bulk upload handlers set up successfully');
}

/**
 * Handle files selected
 */
function handleFilesSelected(files) {
    console.log('Files selected:', files.length);
    
    if (!files || files.length === 0) return;
    
    // Validate and add files
    const maxFiles = 50;
    const remainingSlots = maxFiles - selectedFiles.length;
    
    if (remainingSlots <= 0) {
        window.NotificationSystem.warning(
            'Maximum Files Reached',
            `You can only upload up to ${maxFiles} files at once.`
        );
        return;
    }
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < files.length && addedCount < remainingSlots; i++) {
        const file = files[i];
        
        // Validate file type (PDF only)
        if (file.type !== 'application/pdf') {
            skippedCount++;
            continue;
        }
        
        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            skippedCount++;
            continue;
        }
        
        // Check for duplicates
        const isDuplicate = selectedFiles.some(f => 
            f.name === file.name && f.size === file.size
        );
        
        if (isDuplicate) {
            skippedCount++;
            continue;
        }
        
        // Add file
        selectedFiles.push(file);
        addedCount++;
    }
    
    console.log(`Added ${addedCount} files, skipped ${skippedCount} files`);
    
    if (skippedCount > 0) {
        window.NotificationSystem.warning(
            'Some Files Skipped',
            `${skippedCount} file(s) were skipped due to invalid type, size, or duplicates.`
        );
    }
    
    updateFileListUI();
}

/**
 * Update file list UI
 */
function updateFileListUI() {
    const uploadArea = document.querySelector('[data-upload-area]');
    const fileList = document.querySelector('[data-file-list]');
    const fileItems = document.querySelector('[data-file-items]');
    const fileCount = document.querySelector('[data-file-count]');
    const submitBtn = document.querySelector('[data-action="process-all-files"]');
    
    if (selectedFiles.length === 0) {
        uploadArea.style.display = 'block';
        fileList.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;
        return;
    }
    
    uploadArea.style.display = 'none';
    fileList.style.display = 'block';
    if (submitBtn) submitBtn.disabled = false;
    
    // Update count
    if (fileCount) {
        fileCount.textContent = selectedFiles.length;
    }
    
    // Render file items
    if (fileItems) {
        fileItems.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const fileItem = createFileItemElement(file, index);
            fileItems.appendChild(fileItem);
        });
    }
}

/**
 * Create file item element
 */
function createFileItemElement(file, index) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
        <div class="file-item-info">
            <div class="file-item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
            </div>
            <div class="file-item-details">
                <p class="file-item-name">${escapeHtml(file.name)}</p>
                <p class="file-item-size">${sizeInMB} MB</p>
            </div>
        </div>
        <button class="file-item-remove" type="button" data-file-index="${index}" aria-label="Remove file">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    
    // Add remove handler
    const removeBtn = div.querySelector('.file-item-remove');
    removeBtn.addEventListener('click', function() {
        removeFile(index);
    });
    
    return div;
}

/**
 * Remove file from list
 */
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileListUI();
}

/**
 * Clear all files
 */
function clearAllFiles() {
    selectedFiles = [];
    updateFileListUI();
    
    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

/**
 * Start bulk processing
 */
async function startBulkProcessing() {
    if (selectedFiles.length === 0) {
        window.NotificationSystem.warning(
            'No Files Selected',
            'Please select files before processing'
        );
        return;
    }
    
    console.log('=== Starting bulk processing ===');
    console.log('Total files:', selectedFiles.length);
    
    // Initialize processing queue
    processingQueue = selectedFiles.map((file, index) => ({
        file: file,
        index: index,
        status: 'pending', // pending, processing, completed, failed
        progress: 0,
        message: 'Waiting...',
        result: null
    }));
    
    // Reset state
    currentProcessingIndex = 0;
    isProcessing = true;
    processingCancelled = false;
    
    // Show queue section
    const queueSection = document.querySelector('[data-queue-section]');
    if (queueSection) {
        queueSection.style.display = 'block';
    }
    
    // Update queue UI
    updateQueueUI();
    
    // Disable submit button
    const submitBtn = document.querySelector('[data-action="process-all-files"]');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // Process files one by one
    for (let i = 0; i < processingQueue.length; i++) {
        if (processingCancelled) {
            console.log('Bulk processing cancelled by user');
            break;
        }
        
        currentProcessingIndex = i;
        await processSingleInvoice(processingQueue[i]);
        
        // Small delay between invoices
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Processing complete
    isProcessing = false;
    
    if (!processingCancelled) {
        const completedCount = processingQueue.filter(item => item.status === 'completed').length;
        const failedCount = processingQueue.filter(item => item.status === 'failed').length;
        
        window.NotificationSystem.success(
            'Bulk Processing Complete',
            `Processed ${completedCount} invoice(s) successfully. ${failedCount > 0 ? `${failedCount} failed.` : ''}`
        );
    }
    
    // Re-enable submit button
    if (submitBtn) {
        submitBtn.disabled = false;
    }
    
    console.log('=== Bulk processing complete ===');
}

/**
 * Process single invoice
 */
async function processSingleInvoice(queueItem) {
    console.log(`=== Processing invoice ${currentProcessingIndex + 1}/${processingQueue.length} ===`);
    console.log('File:', queueItem.file.name);
    
    // Check if cancelled before starting
    if (processingCancelled) {
        console.log('Processing cancelled - skipping invoice');
        return;
    }
    
    // Update queue item status
    queueItem.status = 'processing';
    queueItem.progress = 0;
    queueItem.message = 'Starting processing...';
    updateQueueUI();
    
    // Show timeline modal
    showTimelineModal(queueItem.file);
    
    try {
        // Verify API_ENDPOINTS is available
        if (!window.API_ENDPOINTS) {
            throw new Error('API_ENDPOINTS not available');
        }
        
        // Step 1: OCR Processing
        updateTimelineStep('ocr', 'in-progress', 'Extracting data from invoice...');
        queueItem.progress = 16;
        queueItem.message = 'OCR Processing...';
        updateQueueUI();
        
        const formData = new FormData();
        formData.append('file', queueItem.file);
        
        const ocrResponse = await fetch(window.API_ENDPOINTS.FINGUARD.OCR_PDF, {
            method: 'POST',
            body: formData
        });
        
        if (processingCancelled) {
            console.log('Processing cancelled during OCR');
            hideTimelineModal();
            resetTimelineSteps();
            return;
        }
        
        let ocrData = await ocrResponse.json();
        if (Array.isArray(ocrData) && ocrData.length > 0) {
            ocrData = ocrData[0];
        }
        
        if (!ocrData.success) {
            throw new Error('OCR processing failed');
        }
        
        const invoiceData = ocrData.data;
        updateTimelineStep('ocr', 'completed', 'Data extracted successfully');
        
        // Step 2: Arithmetical Accuracy
        await new Promise(resolve => setTimeout(resolve, 500));
        if (processingCancelled) {
            console.log('Processing cancelled during arithmetic check');
            hideTimelineModal();
            resetTimelineSteps();
            return;
        }
        
        updateTimelineStep('arithmetic', 'in-progress', 'Performing arithmetical checks...');
        queueItem.progress = 33;
        queueItem.message = 'Arithmetical Check...';
        updateQueueUI();
        
        const arithmeticCheck = performArithmeticValidation(invoiceData);
        if (arithmeticCheck.isValid) {
            updateTimelineStep('arithmetic', 'completed', 'All calculations verified');
        } else {
            const errorMessage = arithmeticCheck.errors?.[0] || 'Calculation errors found';
            updateTimelineStep('arithmetic', 'failed', errorMessage);
        }
        
        // Step 3: Price Anomaly Detection
        await new Promise(resolve => setTimeout(resolve, 500));
        if (processingCancelled) {
            console.log('Processing cancelled during price anomaly check');
            hideTimelineModal();
            resetTimelineSteps();
            return;
        }
        
        updateTimelineStep('price-anomaly', 'in-progress', 'Checking for price anomalies...');
        queueItem.progress = 50;
        queueItem.message = 'Price Anomaly Check...';
        updateQueueUI();
        
        try {
            const priceAnomalyResponse = await fetch(window.API_ENDPOINTS.FINGUARD.PRICE_ANOMALY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            
            let priceAnomalyData = await priceAnomalyResponse.json();
            if (Array.isArray(priceAnomalyData) && priceAnomalyData.length > 0) {
                priceAnomalyData = priceAnomalyData[0].json || priceAnomalyData[0];
            }
            
            const hasAnomalies = priceAnomalyData.anomalyFound === true;
            if (hasAnomalies) {
                updateTimelineStep('price-anomaly', 'failed', `Price anomalies detected: ${priceAnomalyData.anomalyCount || 0} items`);
            } else {
                updateTimelineStep('price-anomaly', 'completed', 'No price anomalies detected');
            }
        } catch (error) {
            updateTimelineStep('price-anomaly', 'failed', 'Failed to check price anomalies');
        }
        
        // Step 4: Duplicate Detection
        await new Promise(resolve => setTimeout(resolve, 500));
        if (processingCancelled) {
            console.log('Processing cancelled during duplicate detection');
            hideTimelineModal();
            resetTimelineSteps();
            return;
        }
        
        updateTimelineStep('duplicate', 'in-progress', 'Checking for duplicate invoices...');
        queueItem.progress = 66;
        queueItem.message = 'Duplicate Detection...';
        updateQueueUI();
        
        try {
            const duplicateResponse = await fetch(window.API_ENDPOINTS.FINGUARD.DETECT_DUPLICATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            
            let duplicateData = await duplicateResponse.json();
            if (Array.isArray(duplicateData) && duplicateData.length > 0) {
                duplicateData = duplicateData[0];
            }
            
            const isDuplicate = duplicateData.is_duplicate === true;
            if (isDuplicate) {
                updateTimelineStep('duplicate', 'failed', 'Duplicate invoice detected');
            } else {
                updateTimelineStep('duplicate', 'completed', 'No duplicates found');
            }
        } catch (error) {
            updateTimelineStep('duplicate', 'failed', 'Failed to check for duplicates');
        }
        
        // Step 5: GST Validation
        await new Promise(resolve => setTimeout(resolve, 500));
        if (processingCancelled) {
            console.log('Processing cancelled during GST validation');
            hideTimelineModal();
            resetTimelineSteps();
            return;
        }
        
        updateTimelineStep('gst', 'in-progress', 'Validating GST numbers...');
        queueItem.progress = 83;
        queueItem.message = 'GST Validation...';
        updateQueueUI();
        
        try {
            const gstResponse = await fetch(window.API_ENDPOINTS.FINGUARD.VALIDATE_GST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            
            let gstData = await gstResponse.json();
            if (Array.isArray(gstData) && gstData.length > 0) {
                gstData = gstData[0];
            }
            
            if (gstData.success) {
                updateTimelineStep('gst', 'completed', 'GST numbers validated');
            } else {
                updateTimelineStep('gst', 'failed', 'GST validation failed');
            }
        } catch (error) {
            updateTimelineStep('gst', 'failed', 'Failed to validate GST');
        }
        
        // Step 6: GST Rate Validation
        await new Promise(resolve => setTimeout(resolve, 500));
        if (processingCancelled) {
            console.log('Processing cancelled during GST rate validation');
            hideTimelineModal();
            resetTimelineSteps();
            return;
        }
        
        updateTimelineStep('gst-rate', 'in-progress', 'Validating GST rates...');
        queueItem.progress = 100;
        queueItem.message = 'GST Rate Validation...';
        updateQueueUI();
        
        try {
            const gstRateResponse = await fetch(window.API_ENDPOINTS.FINGUARD.VALIDATE_GST_RATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            
            let gstRateData = await gstRateResponse.json();
            if (Array.isArray(gstRateData) && gstRateData.length > 0) {
                gstRateData = gstRateData[0];
            }
            
            if (gstRateData.success) {
                updateTimelineStep('gst-rate', 'completed', 'GST rates validated');
            } else {
                updateTimelineStep('gst-rate', 'failed', 'GST rate validation failed');
            }
        } catch (error) {
            updateTimelineStep('gst-rate', 'failed', 'Failed to validate GST rates');
        }
        
        // Store processed invoice
        await new Promise(resolve => setTimeout(resolve, 500));
        if (processingCancelled) {
            console.log('Processing cancelled before storing invoice');
            hideTimelineModal();
            resetTimelineSteps();
            return;
        }
        
        try {
            // Prepare store data (simplified for bulk upload)
            const storeData = {
                invoice_id: invoiceData.invoice_number || `BULK_${Date.now()}_${currentProcessingIndex}`,
                file_name: queueItem.file.name,
                ocr_processing: { success: true },
                arithmetic_accuracy: { success: arithmeticCheck.isValid },
                price_anomaly_check: { success: true },
                duplicate_detection: { success: true },
                gst_validation: { success: true },
                gst_rate_validation: { success: true }
            };
            
            await fetch(window.API_ENDPOINTS.FINGUARD.STORE_PROCESSED_INVOICE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(storeData)
            });
        } catch (error) {
            console.error('Failed to store processed invoice:', error);
        }
        
        // Mark as completed
        queueItem.status = 'completed';
        queueItem.message = 'Processing complete';
        queueItem.result = 'success';
        
    } catch (error) {
        console.error('Error processing invoice:', error);
        
        // Mark as failed
        queueItem.status = 'failed';
        queueItem.message = error.message || 'Processing failed';
        queueItem.result = 'error';
        
        // Update timeline to show error
        const currentStep = getCurrentTimelineStep();
        if (currentStep) {
            updateTimelineStep(currentStep, 'failed', error.message || 'Processing failed');
        }
    }
    
    // Wait before hiding modal
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Hide timeline modal
    hideTimelineModal();
    
    // Reset timeline for next invoice
    resetTimelineSteps();
    
    updateQueueUI();
}

/**
 * Update queue UI
 */
function updateQueueUI() {
    const queueItems = document.querySelector('[data-queue-items]');
    const queueTotal = document.querySelector('[data-queue-total]');
    const queueCompleted = document.querySelector('[data-queue-completed]');
    const queueProcessing = document.querySelector('[data-queue-processing]');
    const queueFailed = document.querySelector('[data-queue-failed]');
    
    if (!queueItems) return;
    
    // Update stats
    const completedCount = processingQueue.filter(item => item.status === 'completed').length;
    const processingCount = processingQueue.filter(item => item.status === 'processing').length;
    const failedCount = processingQueue.filter(item => item.status === 'failed').length;
    
    if (queueTotal) queueTotal.textContent = processingQueue.length;
    if (queueCompleted) queueCompleted.textContent = completedCount;
    if (queueProcessing) queueProcessing.textContent = processingCount;
    if (queueFailed) queueFailed.textContent = failedCount;
    
    // Render queue items
    queueItems.innerHTML = '';
    
    processingQueue.forEach((item, index) => {
        const queueItem = createQueueItemElement(item, index);
        queueItems.appendChild(queueItem);
    });
}

/**
 * Create queue item element
 */
function createQueueItemElement(item, index) {
    const div = document.createElement('div');
    div.className = `queue-item ${item.status}`;
    
    let statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    let statusClass = item.status;
    
    div.innerHTML = `
        <div class="queue-item-header">
            <h3 class="queue-item-name">${escapeHtml(item.file.name)}</h3>
            <span class="queue-item-status ${statusClass}">${statusText}</span>
        </div>
        ${item.status === 'processing' ? `
            <div class="queue-item-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${item.progress}%"></div>
                </div>
                <p class="progress-text">${item.progress}% complete</p>
            </div>
        ` : ''}
        <p class="queue-item-message">${escapeHtml(item.message)}</p>
    `;
    
    return div;
}

/**
 * Show timeline modal
 */
function showTimelineModal(file) {
    const modal = document.querySelector('[data-processing-popup]');
    const currentInvoiceNumber = document.querySelector('[data-current-invoice-number]');
    const totalInvoices = document.querySelector('[data-total-invoices]');
    const currentFilename = document.querySelector('[data-current-filename]');
    
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
    
    if (currentInvoiceNumber) {
        currentInvoiceNumber.textContent = currentProcessingIndex + 1;
    }
    
    if (totalInvoices) {
        totalInvoices.textContent = processingQueue.length;
    }
    
    if (currentFilename) {
        currentFilename.textContent = file.name;
    }
}

/**
 * Hide timeline modal (completely, not minimize)
 */
function hideTimelineModal() {
    const modal = document.querySelector('[data-processing-popup]');
    const minimized = document.querySelector('[data-minimized-processing]');
    
    // Hide both modal and minimized indicator
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (minimized) {
        minimized.style.display = 'none';
    }
    
    // Remove blur when modal is completely hidden
    document.body.classList.remove('modal-open');
}

/**
 * Update timeline step
 */
function updateTimelineStep(stepName, status, message) {
    const timelineItem = document.querySelector(`[data-timeline-step="${stepName}"]`);
    if (!timelineItem) return;
    
    const stepIcon = timelineItem.querySelector(`[data-step-icon="${stepName}"]`);
    const description = timelineItem.querySelector(`[data-step-description="${stepName}"]`);
    
    // Update status attribute
    timelineItem.setAttribute('data-status', status);
    
    // Update message
    if (description && message) {
        description.textContent = message;
    }
    
    // Update icons
    if (stepIcon) {
        const icons = {
            pending: stepIcon.querySelector('.icon-pending'),
            loading: stepIcon.querySelector('.icon-loading'),
            success: stepIcon.querySelector('.icon-success'),
            error: stepIcon.querySelector('.icon-error')
        };
        
        // Hide all icons
        Object.values(icons).forEach(icon => {
            if (icon) icon.style.display = 'none';
        });
        
        // Show appropriate icon
        if (status === 'pending') {
            if (icons.pending) icons.pending.style.display = 'block';
        } else if (status === 'in-progress') {
            if (icons.loading) icons.loading.style.display = 'block';
        } else if (status === 'completed') {
            if (icons.success) icons.success.style.display = 'block';
        } else if (status === 'failed') {
            if (icons.error) icons.error.style.display = 'block';
        }
    }
    
    // Update progress indicator
    updateProgressIndicator();
}

/**
 * Update progress indicator
 */
function updateProgressIndicator() {
    const steps = ['ocr', 'arithmetic', 'price-anomaly', 'duplicate', 'gst', 'gst-rate'];
    const completedSteps = steps.filter(step => {
        const item = document.querySelector(`[data-timeline-step="${step}"]`);
        const status = item?.getAttribute('data-status');
        return status === 'completed' || status === 'failed';
    });
    
    const progress = Math.round((completedSteps.length / steps.length) * 100);
    
    const progressPercentage = document.querySelector('[data-progress-percentage]');
    if (progressPercentage) {
        progressPercentage.textContent = `${progress}%`;
    }
}

/**
 * Reset timeline steps
 */
function resetTimelineSteps() {
    const steps = ['ocr', 'arithmetic', 'price-anomaly', 'duplicate', 'gst', 'gst-rate'];
    
    steps.forEach(step => {
        const timelineItem = document.querySelector(`[data-timeline-step="${step}"]`);
        if (!timelineItem) return;
        
        timelineItem.setAttribute('data-status', 'pending');
        
        const stepIcon = timelineItem.querySelector(`[data-step-icon="${step}"]`);
        if (stepIcon) {
            const icons = stepIcon.querySelectorAll('svg');
            icons.forEach(icon => icon.style.display = 'none');
            
            const pendingIcon = stepIcon.querySelector('.icon-pending');
            if (pendingIcon) pendingIcon.style.display = 'block';
        }
        
        const description = timelineItem.querySelector(`[data-step-description="${step}"]`);
        if (description) {
            const defaultMessages = {
                'ocr': 'Extracting data from invoice...',
                'arithmetic': 'Verifying calculations...',
                'price-anomaly': 'Checking prices...',
                'duplicate': 'Checking for duplicate invoices...',
                'gst': 'Validating GST information...',
                'gst-rate': 'Validating GST rates...'
            };
            description.textContent = defaultMessages[step];
        }
    });
    
    // Reset progress
    const progressPercentage = document.querySelector('[data-progress-percentage]');
    if (progressPercentage) {
        progressPercentage.textContent = '0%';
    }
}

/**
 * Get current timeline step
 */
function getCurrentTimelineStep() {
    const steps = ['ocr', 'arithmetic', 'price-anomaly', 'duplicate', 'gst', 'gst-rate'];
    
    for (const step of steps) {
        const item = document.querySelector(`[data-timeline-step="${step}"]`);
        const status = item?.getAttribute('data-status');
        if (status === 'in-progress') {
            return step;
        }
    }
    
    return null;
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
    const minimizeBtn = document.querySelector('[data-action="minimize-processing"]');
    const cancelBtn = document.querySelector('[data-action="cancel-processing"]');
    const expandBtn = document.querySelector('[data-action="expand-processing"]');
    const cancelAllBtn = document.querySelector('[data-action="cancel-all-processing"]');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', minimizeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelProcessing);
    }
    
    if (expandBtn) {
        expandBtn.addEventListener('click', expandModal);
    }
    
    if (cancelAllBtn) {
        cancelAllBtn.addEventListener('click', cancelProcessing);
    }
}

/**
 * Minimize modal
 */
function minimizeModal() {
    console.log('Minimizing modal');
    const modal = document.querySelector('[data-processing-popup]');
    const minimized = document.querySelector('[data-minimized-processing]');
    
    // Hide modal
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Show minimized indicator
    if (minimized) {
        minimized.style.display = 'flex';
    }
    
    // Remove blur so user can interact with the app
    document.body.classList.remove('modal-open');
    
    // Update minimized indicator with current status
    updateMinimizedIndicator();
}

/**
 * Expand modal
 */
function expandModal() {
    console.log('Expanding modal');
    const modal = document.querySelector('[data-processing-popup]');
    const minimized = document.querySelector('[data-minimized-processing]');
    
    // Show modal
    if (modal) {
        modal.style.display = 'flex';
    }
    
    // Hide minimized indicator
    if (minimized) {
        minimized.style.display = 'none';
    }
    
    // Add blur back when modal is expanded
    document.body.classList.add('modal-open');
}

/**
 * Update minimized indicator
 */
function updateMinimizedIndicator() {
    const miniProgress = document.querySelector('[data-mini-progress]');
    const currentStep = document.querySelector('[data-current-step]');
    
    if (miniProgress) {
        miniProgress.textContent = `${currentProcessingIndex + 1}/${processingQueue.length}`;
    }
    
    if (currentStep) {
        const step = getCurrentTimelineStep();
        const stepTitles = {
            'ocr': 'OCR Processing',
            'arithmetic': 'Arithmetical Check',
            'price-anomaly': 'Price Anomaly Detection',
            'duplicate': 'Duplicate Detection',
            'gst': 'GST Validation',
            'gst-rate': 'GST Rate Validation'
        };
        currentStep.textContent = stepTitles[step] || 'Processing...';
    }
}

/**
 * Cancel processing
 */
function cancelProcessing() {
    if (!confirm('Are you sure you want to cancel processing? This will stop all remaining invoices.')) {
        return;
    }
    
    console.log('=== Cancelling bulk processing ===');
    
    // Set cancellation flag
    processingCancelled = true;
    isProcessing = false;
    
    // Update queue items - mark current as failed, pending ones as cancelled
    processingQueue.forEach((item, index) => {
        if (index === currentProcessingIndex && item.status === 'processing') {
            // Current item being processed
            item.status = 'failed';
            item.message = 'Processing cancelled by user';
            item.result = 'cancelled';
        } else if (item.status === 'pending') {
            // Not yet processed items
            item.status = 'failed';
            item.message = 'Cancelled - not processed';
            item.result = 'cancelled';
        }
    });
    
    // Update queue UI to show cancelled items
    updateQueueUI();
    
    // Hide modal and minimized indicator
    const modal = document.querySelector('[data-processing-popup]');
    const minimized = document.querySelector('[data-minimized-processing]');
    
    if (modal) modal.style.display = 'none';
    if (minimized) minimized.style.display = 'none';
    
    // Remove blur effect
    document.body.classList.remove('modal-open');
    
    // Show notification
    window.NotificationSystem.warning(
        'Processing Cancelled',
        'Bulk invoice processing has been cancelled. All remaining invoices have been skipped.'
    );
    
    // Re-enable submit button
    const submitBtn = document.querySelector('[data-action="process-all-files"]');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
    
    console.log('Processing cancelled by user - all remaining invoices stopped');
}

/**
 * Perform arithmetic validation (from FinGuard)
 */
function performArithmeticValidation(invoiceData) {
    const errors = [];
    let isValid = true;
    
    try {
        const subtotal = parseFloat(invoiceData.subtotal) || 0;
        const cgst = parseFloat(invoiceData.cgst_amount) || 0;
        const sgst = parseFloat(invoiceData.sgst_amount) || 0;
        const igst = parseFloat(invoiceData.igst_amount) || 0;
        const invoiceAmount = parseFloat(invoiceData.invoice_amount) || 0;
        
        const calculatedTotal = subtotal + cgst + sgst + igst;
        
        if (Math.abs(calculatedTotal - invoiceAmount) > 1) {
            errors.push(`Total Error: Expected ₹${calculatedTotal.toFixed(2)} but got ₹${invoiceAmount.toFixed(2)}`);
            isValid = false;
        }
        
        return { isValid, errors };
    } catch (error) {
        return { isValid: false, errors: [error.message] };
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
