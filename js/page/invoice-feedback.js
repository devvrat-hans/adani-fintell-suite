/**
 * Invoice Feedback Page JavaScript
 * Handles feedback submission for processed invoices
 */

// State Management
const state = {
    invoices: [],
    filteredInvoices: [],
    selectedInvoice: null,
    isSubmitting: false
};

// DOM Elements
const elements = {
    invoiceSearch: document.getElementById('invoiceSearch'),
    invoiceDropdown: document.getElementById('invoiceDropdown'),
    selectedInvoiceDisplay: document.getElementById('selectedInvoiceDisplay'),
    invoicePreview: document.getElementById('invoicePreview'),
    feedbackForm: document.getElementById('feedbackForm'),
    resetBtn: document.getElementById('resetBtn'),
    submitBtn: document.getElementById('submitBtn'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

/**
 * Initialize the page
 */
async function init() {
    console.log('[Init] Starting initialization...');
    console.log('[Init] Elements found:', {
        invoiceSearch: !!elements.invoiceSearch,
        invoiceDropdown: !!elements.invoiceDropdown,
        feedbackForm: !!elements.feedbackForm
    });
    
    await loadInvoices();
    attachEventListeners();
    console.log('[Init] Initialization complete');
}

/**
 * Load processed invoices from the database
 */
async function loadInvoices() {
    try {
        // Check if invoices are already in localStorage
        const cachedInvoices = localStorage.getItem('processedInvoices');
        
        if (cachedInvoices) {
            console.log('[Feedback] Loading invoices from localStorage');
            state.invoices = JSON.parse(cachedInvoices);
            state.filteredInvoices = state.invoices;
            console.log(`[Feedback] Loaded ${state.invoices.length} invoices from cache`);
            return;
        }
        
        console.log('[Feedback] Fetching invoices from API...');
        // Fetch from API if not in localStorage
        const response = await fetch(API_ENDPOINTS.DATABASE.FETCH_INVOICES);
        
        if (!response.ok) {
            throw new Error('Failed to fetch invoices');
        }
        
        const data = await response.json();
        console.log(`[Feedback] Fetched ${data.length} invoices from API`);
        
        state.invoices = data;
        state.filteredInvoices = data;
        
        // Store in localStorage
        localStorage.setItem('processedInvoices', JSON.stringify(data));
        console.log('[Feedback] Invoices stored in localStorage');
    } catch (error) {
        console.error('[Feedback] Error loading invoices:', error);
        // Silently fail - user can still try to refresh
    }
}


/**
 * Filter invoices based on search query
 */
function filterInvoices(searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
        state.filteredInvoices = state.invoices;
    } else {
        const query = searchQuery.toLowerCase().trim();
        state.filteredInvoices = state.invoices.filter(invoice => {
            // Get formatted date for comparison
            let invoiceDate = '';
            if (invoice.invoice_date) {
                try {
                    const date = new Date(invoice.invoice_date);
                    invoiceDate = date.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }).toLowerCase();
                } catch (e) {
                    invoiceDate = '';
                }
            }
            
            return (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(query)) ||
                   (invoice.vendor_name && invoice.vendor_name.toLowerCase().includes(query)) ||
                   invoiceDate.includes(query);
        });
    }
    
    updateDropdown();
}

/**
 * Update the dropdown with filtered invoices
 */
function updateDropdown() {
    const dropdown = elements.invoiceDropdown;
    
    if (!dropdown) {
        console.error('Dropdown element not found!');
        return;
    }
    
    dropdown.innerHTML = '';
    
    if (state.filteredInvoices.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'dropdown-item empty';
        emptyItem.textContent = 'No invoices found';
        dropdown.appendChild(emptyItem);
        dropdown.style.display = 'block';
        return;
    }
    
    state.filteredInvoices.forEach(invoice => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
            <div class="dropdown-item-main">${invoice.invoice_number} - ${invoice.vendor_name}</div>
            <div class="dropdown-item-sub">Invoice ID: ${invoice.invoice_id} | Amount: ₹${formatAmount(invoice.invoice_amount)}</div>
        `;
        item.addEventListener('click', () => selectInvoice(invoice));
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

/**
 * Select an invoice from dropdown
 */
function selectInvoice(invoice) {
    state.selectedInvoice = invoice;
    elements.invoiceSearch.value = `${invoice.invoice_number} - ${invoice.vendor_name}`;
    elements.invoiceDropdown.style.display = 'none';
    displayInvoiceDetails(invoice);
}

/**
 * Display selected invoice details
 */
function displayInvoiceDetails(invoice) {
    const preview = elements.invoicePreview;
    
    if (!invoice) {
        preview.style.display = 'none';
        return;
    }
    
    // Update preview fields
    preview.querySelector('[data-field="invoice-number"]').textContent = invoice.invoice_number || '-';
    preview.querySelector('[data-field="invoice-date"]').textContent = formatDate(invoice.invoice_date) || '-';
    preview.querySelector('[data-field="vendor-name"]').textContent = invoice.vendor_name || '-';
    preview.querySelector('[data-field="invoice-amount"]').textContent = `₹${formatAmount(invoice.invoice_amount)}` || '-';
    
    preview.style.display = 'block';
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Invoice search input
    elements.invoiceSearch.addEventListener('input', (event) => {
        filterInvoices(event.target.value);
    });
    
    // Invoice search focus
    elements.invoiceSearch.addEventListener('focus', () => {
        if (elements.invoiceSearch.value.trim() === '') {
            state.filteredInvoices = state.invoices;
            updateDropdown();
        } else {
            filterInvoices(elements.invoiceSearch.value);
        }
    });
    
    // Click outside to close dropdown
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.invoice-search-container')) {
            elements.invoiceDropdown.style.display = 'none';
        }
    });
    
    // Form submission
    elements.feedbackForm.addEventListener('submit', handleFormSubmit);
    
    // Reset button
    elements.resetBtn.addEventListener('click', handleReset);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    console.log('[Form Submit] Form submitted');
    
    if (state.isSubmitting) {
        console.log('[Form Submit] Already submitting, ignoring');
        return;
    }
    
    // Validate form
    if (!validateForm()) {
        console.log('[Form Submit] Validation failed');
        return;
    }
    
    console.log('[Form Submit] Validation passed');
    
    // Collect form data
    const formData = collectFormData();
    console.log('[Form Submit] Form data collected:', formData);
    
    // Submit feedback
    await submitFeedback(formData);
}

/**
 * Validate form data
 */
function validateForm() {
    console.log('[Validate] Validating form...');
    const form = elements.feedbackForm;
    
    // Check if invoice is selected
    if (!state.selectedInvoice) {
        console.log('[Validate] No invoice selected');
        showNotification('Please select an invoice', 'error');
        elements.invoiceSearch.focus();
        return false;
    }
    
    console.log('[Validate] Invoice selected:', state.selectedInvoice.invoice_number);
    
    // Use HTML5 validation
    if (!form.checkValidity()) {
        console.log('[Validate] HTML5 validation failed');
        form.reportValidity();
        return false;
    }
    
    console.log('[Validate] Validation passed');
    return true;
}

/**
 * Collect form data
 */
function collectFormData() {
    const form = elements.feedbackForm;
    const formData = new FormData(form);
    
    const data = {
        invoice_id: state.selectedInvoice.invoice_id,
        invoice_number: state.selectedInvoice.invoice_number,
        vendor_name: state.selectedInvoice.vendor_name,
        feedback_type: formData.get('feedback_type'),
        severity: formData.get('severity'),
        title: formData.get('title'),
        description: formData.get('description'),
        expected_result: formData.get('expected_result'),
        actual_result: formData.get('actual_result'),
        affected_fields: formData.get('affected_fields'),
        suggested_fix: formData.get('suggested_fix'),
        submitted_at: new Date().toISOString(),
        submitted_by: getUserInfo()
    };
    
    return data;
}

/**
 * Submit feedback to the backend
 */
async function submitFeedback(data) {
    console.log('[Submit] Starting feedback submission...', data);
    
    try {
        state.isSubmitting = true;
        showLoading('Submitting feedback...');
        
        console.log('[Submit] Sending request to:', API_ENDPOINTS.DATABASE.ADD_FEEDBACK);
        const response = await fetch(API_ENDPOINTS.DATABASE.ADD_FEEDBACK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('[Submit] Response received:', response.status, response.ok);
        
        if (!response.ok) {
            throw new Error('Failed to submit feedback');
        }
        
        let result = await response.json();
        console.log('[Submit] Success response:', result);
        
        // Handle array response format
        if (Array.isArray(result) && result.length > 0) {
            result = result[0];
            console.log('[Submit] Extracted object from array:', result);
        }
        
        // Hide loading first
        hideLoading();
        console.log('[Submit] Loading hidden');
        
        // Check if submission was successful
        if (result.success) {
            // Show success notification
            showFeedbackPopup('success', 'Feedback Submitted Successfully', 'Your feedback has been recorded and will help improve our system.');
            
            // Reset form after successful submission
            setTimeout(() => {
                handleReset();
            }, 1500);
        } else {
            // Show error notification
            showFeedbackPopup('error', 'Submission Failed', result.error || 'Failed to submit feedback. Please try again.');
        }
        
    } catch (error) {
        console.error('[Submit] Error submitting feedback:', error);
        hideLoading();
        
        // Show error notification
        showFeedbackPopup('error', 'Submission Failed', 'Failed to submit feedback. Please check your connection and try again.');
    } finally {
        state.isSubmitting = false;
        console.log('[Submit] Submission complete');
    }
}

/**
 * Handle form reset
 */
function handleReset() {
    elements.feedbackForm.reset();
    state.selectedInvoice = null;
    elements.invoiceSearch.value = '';
    elements.invoiceDropdown.style.display = 'none';
    displayInvoiceDetails(null);
    elements.invoiceSearch.focus();
}

/**
 * Get user info from localStorage
 */
function getUserInfo() {
    try {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            return {
                name: userData.name || 'Unknown',
                email: userData.email || 'unknown@email.com'
            };
        }
    } catch (error) {
        console.error('Error getting user info:', error);
    }
    
    return {
        name: 'Unknown',
        email: 'unknown@email.com'
    };
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
    elements.loadingOverlay.querySelector('.loading-text').textContent = message;
    elements.loadingOverlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Use the global notification system if available
    if (window.NotificationSystem) {
        const typeMap = {
            'info': 'info',
            'success': 'success',
            'error': 'error',
            'warning': 'warning'
        };
        
        const notificationType = typeMap[type] || 'info';
        window.NotificationSystem.show({
            type: notificationType,
            message: message,
            duration: 5000
        });
    } else {
        // Fallback to alert
        alert(message);
    }
}

/**
 * Format amount with Indian numbering system
 */
function formatAmount(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

/**
 * Show feedback popup with proper styling
 * @param {string} type - Type of popup: 'success' or 'error'
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 */
function showFeedbackPopup(type, title, message) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.feedback-popup-overlay');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.className = 'feedback-popup-overlay';
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = `feedback-popup ${type}`;
    
    // Get icon based on type
    const icon = type === 'success' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
             <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
           </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
           </svg>`;
    
    popup.innerHTML = `
        <div class="feedback-popup-icon ${type}">
            ${icon}
        </div>
        <h3 class="feedback-popup-title">${title}</h3>
        <p class="feedback-popup-message">${message}</p>
        <button class="feedback-popup-close" type="button">Close</button>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Add animation class after a small delay
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // Close button handler
    const closeBtn = popup.querySelector('.feedback-popup-close');
    closeBtn.addEventListener('click', () => {
        closeFeedbackPopup(overlay);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeFeedbackPopup(overlay);
        }
    });
    
    // Auto-close after 5 seconds for success, 7 seconds for error
    const autoCloseDelay = type === 'success' ? 5000 : 7000;
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            closeFeedbackPopup(overlay);
        }
    }, autoCloseDelay);
}

/**
 * Close feedback popup
 * @param {HTMLElement} overlay - Popup overlay element
 */
function closeFeedbackPopup(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.remove();
        }
    }, 300);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
