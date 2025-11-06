/**
 * Invoice Feedback Page JavaScript
 * Handles feedback submission for processed invoices
 */

// State Management
const state = {
    invoices: [],
    selectedInvoice: null,
    isSubmitting: false
};

// DOM Elements
const elements = {
    invoiceSelect: document.getElementById('invoiceSelect'),
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
    await loadInvoices();
    attachEventListeners();
}

/**
 * Load processed invoices from the database
 */
async function loadInvoices() {
    try {
        const response = await fetch('https://n8n-n8n.j8euv3.easypanel.host/webhook/fetch-invoices');
        
        if (!response.ok) {
            throw new Error('Failed to fetch invoices');
        }
        
        const data = await response.json();
        state.invoices = data;
        
        populateInvoiceSelect();
    } catch (error) {
        console.error('Error loading invoices:', error);
        // Silently fail - user can still try to refresh
    }
}

/**
 * Populate the invoice select dropdown
 */
function populateInvoiceSelect() {
    const select = elements.invoiceSelect;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- Select an Invoice --</option>';
    
    // Add invoice options
    state.invoices.forEach(invoice => {
        const option = document.createElement('option');
        option.value = invoice.invoice_id;
        option.textContent = `${invoice.invoice_number} - ${invoice.vendor_name} - ₹${formatAmount(invoice.invoice_amount)}`;
        option.dataset.invoice = JSON.stringify(invoice);
        select.appendChild(option);
    });
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
    // Invoice selection change
    elements.invoiceSelect.addEventListener('change', handleInvoiceSelect);
    
    // Form submission
    elements.feedbackForm.addEventListener('submit', handleFormSubmit);
    
    // Reset button
    elements.resetBtn.addEventListener('click', handleReset);
}

/**
 * Handle invoice selection
 */
function handleInvoiceSelect(event) {
    const selectedOption = event.target.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.dataset.invoice) {
        state.selectedInvoice = null;
        displayInvoiceDetails(null);
        return;
    }
    
    state.selectedInvoice = JSON.parse(selectedOption.dataset.invoice);
    displayInvoiceDetails(state.selectedInvoice);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (state.isSubmitting) {
        return;
    }
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Collect form data
    const formData = collectFormData();
    
    // Submit feedback
    await submitFeedback(formData);
}

/**
 * Validate form data
 */
function validateForm() {
    const form = elements.feedbackForm;
    
    // Check if invoice is selected
    if (!state.selectedInvoice) {
        showNotification('Please select an invoice', 'error');
        elements.invoiceSelect.focus();
        return false;
    }
    
    // Use HTML5 validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    
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
    try {
        state.isSubmitting = true;
        showLoading('Submitting feedback...');
        
        // TODO: Replace with actual API endpoint when available
        const response = await fetch('https://n8n-n8n.j8euv3.easypanel.host/webhook/submit-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit feedback');
        }
        
        const result = await response.json();
        
        hideLoading();
        showNotification('Feedback submitted successfully!', 'success');
        
        // Reset form
        setTimeout(() => {
            handleReset();
        }, 1500);
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
        hideLoading();
        showNotification('Failed to submit feedback. Please try again.', 'error');
    } finally {
        state.isSubmitting = false;
    }
}

/**
 * Handle form reset
 */
function handleReset() {
    elements.feedbackForm.reset();
    state.selectedInvoice = null;
    displayInvoiceDetails(null);
    elements.invoiceSelect.focus();
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
 * Show notification (placeholder - implement based on your notification system)
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implement actual notification system instead of alert
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
