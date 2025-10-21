/**
 * Adani Fintell Suite - Add Invoice Page
 * Handles manual invoice entry form
 */

'use strict';

/**
 * DOM Elements
 */
const elements = {
    form: null,
    lineItemsContainer: null,
    addLineItemBtn: null,
    cancelBtn: null,
    submitBtn: null,
    successMessage: null,
    viewInvoicesBtn: null
};

/**
 * State
 */
const state = {
    lineItemCount: 0,
    isSubmitting: false
};

/**
 * Initialize page
 */
function init() {
    cacheElements();
    attachEventListeners();
    addInitialLineItem();
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    elements.form = document.getElementById('addInvoiceForm');
    elements.lineItemsContainer = document.getElementById('lineItemsContainer');
    elements.addLineItemBtn = document.querySelector('[data-action="add-line-item"]');
    elements.cancelBtn = document.querySelector('[data-action="cancel"]');
    elements.submitBtn = document.querySelector('[data-action="submit"]');
    elements.successMessage = document.getElementById('successMessage');
    elements.viewInvoicesBtn = document.querySelector('[data-action="view-invoices"]');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmit);
    }
    
    if (elements.addLineItemBtn) {
        elements.addLineItemBtn.addEventListener('click', addLineItem);
    }
    
    if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', handleCancel);
    }
    
    if (elements.viewInvoicesBtn) {
        elements.viewInvoicesBtn.addEventListener('click', () => {
            window.location.href = 'invoices.html';
        });
    }
    
    // Auto-calculate CGST/SGST when GST rate changes
    const gstRateSelect = document.getElementById('gstRate');
    const subtotalInput = document.getElementById('subtotal');
    
    if (gstRateSelect && subtotalInput) {
        gstRateSelect.addEventListener('change', calculateGST);
        subtotalInput.addEventListener('input', calculateGST);
    }
}

/**
 * Add initial line item
 */
function addInitialLineItem() {
    addLineItem();
}

/**
 * Add a new line item
 */
function addLineItem() {
    state.lineItemCount++;
    const lineItemId = `lineItem${state.lineItemCount}`;
    
    const lineItemHTML = `
        <div class="line-item" data-line-item="${lineItemId}">
            <div class="line-item-header">
                <span class="line-item-title">Line Item ${state.lineItemCount}</span>
                ${state.lineItemCount > 1 ? `
                    <button type="button" class="remove-line-item-btn" data-action="remove-line-item" data-item-id="${lineItemId}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        Remove
                    </button>
                ` : ''}
            </div>
            <div class="line-item-fields">
                <div class="form-group">
                    <label class="form-label required">Description</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        placeholder="Item description"
                        name="${lineItemId}_description"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label required">HSN/SAC</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        placeholder="Code"
                        name="${lineItemId}_hsn_sac"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label required">Quantity</label>
                    <input 
                        type="number" 
                        class="form-input" 
                        placeholder="0"
                        name="${lineItemId}_quantity"
                        min="0"
                        step="1"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label required">Rate (₹)</label>
                    <input 
                        type="number" 
                        class="form-input" 
                        placeholder="0.00"
                        name="${lineItemId}_rate"
                        min="0"
                        step="0.01"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Amount (₹)</label>
                    <input 
                        type="number" 
                        class="form-input" 
                        placeholder="0.00"
                        name="${lineItemId}_amount"
                        min="0"
                        step="0.01"
                        readonly
                        style="background: #f5f5f5;"
                    >
                </div>
            </div>
        </div>
    `;
    
    elements.lineItemsContainer.insertAdjacentHTML('beforeend', lineItemHTML);
    
    // Attach event listeners to the new line item
    const lineItem = document.querySelector(`[data-line-item="${lineItemId}"]`);
    
    // Remove button
    const removeBtn = lineItem.querySelector('[data-action="remove-line-item"]');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeLineItem(lineItemId));
    }
    
    // Auto-calculate amount when quantity or rate changes
    const quantityInput = lineItem.querySelector(`[name="${lineItemId}_quantity"]`);
    const rateInput = lineItem.querySelector(`[name="${lineItemId}_rate"]`);
    const amountInput = lineItem.querySelector(`[name="${lineItemId}_amount"]`);
    
    if (quantityInput && rateInput && amountInput) {
        const calculateAmount = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            amountInput.value = (quantity * rate).toFixed(2);
        };
        
        quantityInput.addEventListener('input', calculateAmount);
        rateInput.addEventListener('input', calculateAmount);
    }
}

/**
 * Remove a line item
 */
function removeLineItem(lineItemId) {
    const lineItem = document.querySelector(`[data-line-item="${lineItemId}"]`);
    if (lineItem) {
        lineItem.remove();
    }
    
    // Renumber remaining line items
    const remainingItems = elements.lineItemsContainer.querySelectorAll('.line-item');
    remainingItems.forEach((item, index) => {
        const title = item.querySelector('.line-item-title');
        if (title) {
            title.textContent = `Line Item ${index + 1}`;
        }
    });
}

/**
 * Calculate GST amounts
 */
function calculateGST() {
    const subtotalInput = document.getElementById('subtotal');
    const gstRateSelect = document.getElementById('gstRate');
    const cgstInput = document.getElementById('cgstAmount');
    const sgstInput = document.getElementById('sgstAmount');
    const invoiceAmountInput = document.getElementById('invoiceAmount');
    
    if (!subtotalInput || !gstRateSelect || !cgstInput || !sgstInput || !invoiceAmountInput) {
        return;
    }
    
    const subtotal = parseFloat(subtotalInput.value) || 0;
    const gstRate = parseFloat(gstRateSelect.value) || 0;
    
    // Calculate CGST and SGST (half of GST rate each)
    const totalGST = (subtotal * gstRate) / 100;
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    
    cgstInput.value = cgst.toFixed(2);
    sgstInput.value = sgst.toFixed(2);
    
    // Calculate total invoice amount
    const invoiceAmount = subtotal + totalGST;
    invoiceAmountInput.value = invoiceAmount.toFixed(2);
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (state.isSubmitting) return;
    
    try {
        state.isSubmitting = true;
        elements.submitBtn.disabled = true;
        elements.submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="animation: spin 1s linear infinite;">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
            Submitting...
        `;
        
        const formData = collectFormData();
        
        // Validate form data
        if (!validateFormData(formData)) {
            throw new Error('Please fill in all required fields correctly');
        }
        
        // Submit to API
        await submitInvoice(formData);
        
        // Show success message
        showSuccessMessage();
        
        // Reset form
        elements.form.reset();
        elements.lineItemsContainer.innerHTML = '';
        state.lineItemCount = 0;
        addInitialLineItem();
        
    } catch (error) {
        console.error('Error submitting invoice:', error);
        alert(`Error: ${error.message}`);
    } finally {
        state.isSubmitting = false;
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Add Invoice
        `;
    }
}

/**
 * Collect form data
 */
function collectFormData() {
    const formData = {};
    
    // Collect basic fields
    const fields = elements.form.querySelectorAll('[data-field]');
    fields.forEach(field => {
        const fieldName = field.getAttribute('data-field');
        let value = field.value;
        
        // Convert numbers
        if (field.type === 'number') {
            value = parseFloat(value) || 0;
        }
        
        // Convert date to ISO format
        if (field.type === 'date' && value) {
            value = new Date(value).toISOString();
        }
        
        formData[fieldName] = value;
    });
    
    // Collect line items
    const lineItems = [];
    const lineItemElements = elements.lineItemsContainer.querySelectorAll('.line-item');
    
    lineItemElements.forEach((item) => {
        const itemData = item.getAttribute('data-line-item');
        const lineItem = {
            description: item.querySelector(`[name="${itemData}_description"]`)?.value || '',
            hsn_sac: item.querySelector(`[name="${itemData}_hsn_sac"]`)?.value || '',
            quantity: parseFloat(item.querySelector(`[name="${itemData}_quantity"]`)?.value) || 0,
            rate: parseFloat(item.querySelector(`[name="${itemData}_rate"]`)?.value) || 0,
            amount: parseFloat(item.querySelector(`[name="${itemData}_amount"]`)?.value) || 0
        };
        lineItems.push(lineItem);
    });
    
    formData.line_items = lineItems;
    
    // Process HSN/SAC codes
    if (formData.hsn_sac_codes) {
        formData.hsn_sac_codes = formData.hsn_sac_codes.split(',').map(code => code.trim()).filter(code => code);
    } else {
        formData.hsn_sac_codes = [];
    }
    
    // Handle IGST - set to null if not provided or 0
    if (!formData.igst_amount || formData.igst_amount === 0) {
        formData.igst_amount = null;
    }
    
    // Add upload timestamp
    formData.upload_timestamp = new Date().toISOString();
    
    return formData;
}

/**
 * Validate form data
 */
function validateFormData(formData) {
    // Check required fields
    const requiredFields = [
        'invoice_number',
        'invoice_date',
        'invoice_amount',
        'vendor_name',
        'vendor_gstin',
        'company_gstin',
        'subtotal',
        'gst_rate'
    ];
    
    for (const field of requiredFields) {
        if (!formData[field]) {
            console.error(`Missing required field: ${field}`);
            return false;
        }
    }
    
    // Validate GSTIN format
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinPattern.test(formData.vendor_gstin)) {
        alert('Invalid Vendor GSTIN format');
        return false;
    }
    
    if (!gstinPattern.test(formData.company_gstin)) {
        alert('Invalid Company GSTIN format');
        return false;
    }
    
    // Validate line items
    if (!formData.line_items || formData.line_items.length === 0) {
        alert('Please add at least one line item');
        return false;
    }
    
    return true;
}

/**
 * Submit invoice to API
 */
async function submitInvoice(formData) {
    const endpoint = window.API_ENDPOINTS?.DATABASE?.ADD_INVOICE || 
                    'https://n8n-n8n.j8euv3.easypanel.host/webhook/f/database/add-invoice';
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to add invoice');
    }
    
    const result = await response.json();
    console.log('Invoice added successfully:', result);
    
    // Clear localStorage cache to force refresh on invoices page
    localStorage.removeItem('adani_fintell_invoices');
    localStorage.removeItem('adani_fintell_invoices_timestamp');
    
    return result;
}

/**
 * Show success message
 */
function showSuccessMessage() {
    if (elements.successMessage) {
        elements.successMessage.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideSuccessMessage();
        }, 5000);
    }
}

/**
 * Hide success message
 */
function hideSuccessMessage() {
    if (elements.successMessage) {
        elements.successMessage.style.display = 'none';
    }
}

/**
 * Handle cancel button
 */
function handleCancel() {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        window.location.href = 'invoices.html';
    }
}

/**
 * Add spin animation for loading
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
