/**
 * Adani Fintell Suite - Edit Purchase Order Page
 * Handles purchase order editing form with search functionality
 */

'use strict';

// LocalStorage keys
const PO_DETAILS_KEY = 'current_po_for_edit';
const ALL_POS_KEY = 'all_pos_for_search';

/**
 * Page state
 */
const state = {
    currentPO: null,
    allPOs: [],
    searchResults: []
};

/**
 * DOM elements
 */
const elements = {
    searchContainer: null,
    searchInput: null,
    searchButton: null,
    searchResults: null,
    form: null,
    submitButton: null
};

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body
    document.body.classList.add('templates-loaded');
    
    // Initialize elements
    initializeElements();
    
    // Load PO data from localStorage
    loadPODataFromStorage();
    
    // Attach event listeners
    attachEventListeners();
    
    // Check if there's a PO ID in URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const poId = urlParams.get('po_id') || urlParams.get('id');
    
    if (poId) {
        // If coming from database page, load the stored PO
        loadStoredPO();
    }
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements.searchContainer = document.querySelector('[data-search-container]');
    elements.searchInput = document.querySelector('[data-search-input]');
    elements.searchButton = document.querySelector('[data-search-button]');
    elements.searchResults = document.querySelector('[data-search-results]');
    elements.form = document.getElementById('editPurchaseOrderForm');
    elements.submitButton = document.querySelector('[data-submit-button]');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Search input
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('focus', handleSearchFocus);
    }
    
    // Search button
    if (elements.searchButton) {
        elements.searchButton.addEventListener('click', handleSearchClick);
    }
    
    // Form submit
    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmit);
    }
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (elements.searchResults && !elements.searchContainer?.contains(e.target)) {
            hideSearchResults();
        }
    });
}

/**
 * Load PO data from localStorage
 */
function loadPODataFromStorage() {
    try {
        // Load all POs for search
        const allPOsData = localStorage.getItem(ALL_POS_KEY);
        if (allPOsData) {
            state.allPOs = JSON.parse(allPOsData);
        }
    } catch (error) {
        console.error('Error loading PO data from storage:', error);
    }
}

/**
 * Load stored PO (when coming from database page)
 */
function loadStoredPO() {
    try {
        const storedPO = localStorage.getItem(PO_DETAILS_KEY);
        if (storedPO) {
            const poData = JSON.parse(storedPO);
            state.currentPO = poData;
            populateForm(poData);
            showNotification('Purchase order loaded successfully', 'success');
        }
    } catch (error) {
        console.error('Error loading stored PO:', error);
        showNotification('Error loading purchase order', 'error');
    }
}

/**
 * Handle search input
 */
function handleSearchInput(event) {
    const query = event.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        hideSearchResults();
        return;
    }
    
    // Search through all POs
    const results = state.allPOs.filter(po => {
        const searchFields = [
            po.po_number,
            po.po_id,
            po.vendor_name,
            po.vendor_code
        ];
        
        return searchFields.some(field => 
            field && field.toString().toLowerCase().includes(query)
        );
    });
    
    state.searchResults = results;
    displaySearchResults(results);
}

/**
 * Handle search focus
 */
function handleSearchFocus() {
    if (state.searchResults.length > 0) {
        showSearchResults();
    }
}

/**
 * Handle search button click
 */
async function handleSearchClick() {
    const query = elements.searchInput?.value.trim();
    
    if (!query) {
        showNotification('Please enter a PO number or vendor name', 'warning');
        return;
    }
    
    // If we have a match in search results, use the first one
    if (state.searchResults.length > 0) {
        await fetchAndLoadPO(state.searchResults[0].po_id);
    } else {
        showNotification('No purchase order found', 'error');
    }
}

/**
 * Display search results
 */
function displaySearchResults(results) {
    if (!elements.searchResults) return;
    
    if (results.length === 0) {
        elements.searchResults.innerHTML = `
            <div class="search-result-item no-results">
                <p>No purchase orders found</p>
            </div>
        `;
        showSearchResults();
        return;
    }
    
    elements.searchResults.innerHTML = results.slice(0, 10).map(po => `
        <div class="search-result-item" data-po-id="${escapeHtml(po.po_id)}">
            <div class="result-main">
                <strong>${escapeHtml(po.po_number)}</strong>
                <span class="result-vendor">${escapeHtml(po.vendor_name || 'N/A')}</span>
            </div>
            <div class="result-meta">
                <span class="result-date">${formatDate(po.po_date)}</span>
                <span class="result-status status-${(po.po_status || 'Pending').toLowerCase()}">${escapeHtml(po.po_status || 'Pending')}</span>
            </div>
        </div>
    `).join('');
    
    // Add click listeners to result items
    elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', async () => {
            const poId = item.dataset.poId;
            if (poId) {
                hideSearchResults();
                await fetchAndLoadPO(poId);
            }
        });
    });
    
    showSearchResults();
}

/**
 * Show search results dropdown
 */
function showSearchResults() {
    if (elements.searchResults) {
        elements.searchResults.style.display = 'block';
    }
}

/**
 * Hide search results dropdown
 */
function hideSearchResults() {
    if (elements.searchResults) {
        elements.searchResults.style.display = 'none';
    }
}

/**
 * Fetch and load PO details
 */
async function fetchAndLoadPO(poId) {
    try {
        // Show loading state
        showNotification('Loading purchase order...', 'info');
        if (elements.searchButton) {
            elements.searchButton.textContent = 'Loading...';
            elements.searchButton.disabled = true;
        }
        
        // Fetch PO details from API
        const response = await fetch(API_ENDPOINTS.PURCHASE_ORDER.GET_PO_DETAILS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ po_id: poId })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            state.currentPO = result.data;
            
            // Store in localStorage
            localStorage.setItem(PO_DETAILS_KEY, JSON.stringify(result.data));
            
            // Populate form
            populateForm(result.data);
            
            showNotification('Purchase order loaded successfully', 'success');
        } else {
            showNotification('Failed to load purchase order', 'error');
        }
    } catch (error) {
        console.error('Error fetching PO details:', error);
        showNotification('Error loading purchase order', 'error');
    } finally {
        if (elements.searchButton) {
            elements.searchButton.textContent = 'Search';
            elements.searchButton.disabled = false;
        }
    }
}

/**
 * Populate form with PO data
 */
function populateForm(poData) {
    // Basic PO Information
    if (document.getElementById('poId')) {
        document.getElementById('poId').value = poData.po_id || poData._id || '';
    }
    if (document.getElementById('poNumber')) {
        document.getElementById('poNumber').value = poData.po_number || '';
    }
    if (document.getElementById('poDate')) {
        document.getElementById('poDate').value = poData.po_date || '';
    }
    if (document.getElementById('status')) {
        document.getElementById('status').value = poData.po_status || poData.status || '';
    }
    
    // Vendor Information
    if (document.getElementById('vendorCode')) {
        document.getElementById('vendorCode').value = poData.vendor_reference?.vendor_code || '';
    }
    if (document.getElementById('vendorName')) {
        document.getElementById('vendorName').value = poData.vendor_reference?.vendor_name || '';
    }
    if (document.getElementById('vendorGstin')) {
        document.getElementById('vendorGstin').value = poData.vendor_reference?.vendor_gst_number || '';
    }
    if (document.getElementById('vendorContact')) {
        document.getElementById('vendorContact').value = poData.vendor_reference?.vendor_contact || '';
    }
    
    // Company Details
    if (document.getElementById('companyGstin')) {
        document.getElementById('companyGstin').value = poData.company_details?.company_gstin || '';
    }
    if (document.getElementById('companyName')) {
        document.getElementById('companyName').value = poData.company_details?.company_name || '';
    }
    
    // Delivery Details
    if (document.getElementById('shipToAddress')) {
        document.getElementById('shipToAddress').value = poData.delivery_details?.ship_to_address?.address_line1 || '';
    }
    if (document.getElementById('shipToCity')) {
        document.getElementById('shipToCity').value = poData.delivery_details?.ship_to_address?.city || '';
    }
    if (document.getElementById('shipToState')) {
        document.getElementById('shipToState').value = poData.delivery_details?.ship_to_address?.state || '';
    }
    if (document.getElementById('shipToPinCode')) {
        document.getElementById('shipToPinCode').value = poData.delivery_details?.ship_to_address?.pin_code || '';
    }
    if (document.getElementById('expectedDeliveryDate')) {
        document.getElementById('expectedDeliveryDate').value = poData.delivery_details?.expected_delivery_date || '';
    }
    
    // Payment Terms
    if (document.getElementById('paymentCycle')) {
        document.getElementById('paymentCycle').value = poData.payment_terms?.payment_cycle || '';
    }
    if (document.getElementById('advancePayment')) {
        document.getElementById('advancePayment').value = poData.payment_terms?.advance_payment || 0;
    }
    if (document.getElementById('retentionPercentage')) {
        document.getElementById('retentionPercentage').value = poData.payment_terms?.retention_percentage || 0;
    }
    
    // Financial Summary
    if (document.getElementById('subtotal')) {
        document.getElementById('subtotal').value = poData.financial_summary?.subtotal || 0;
    }
    if (document.getElementById('totalTax')) {
        document.getElementById('totalTax').value = poData.financial_summary?.total_tax_amount || 0;
    }
    if (document.getElementById('grandTotal')) {
        document.getElementById('grandTotal').value = poData.financial_summary?.grand_total || 0;
    }
    
    // Notes
    if (document.getElementById('notes')) {
        document.getElementById('notes').value = poData.metadata?.notes || '';
    }
    
    // Update search input to show current PO
    if (elements.searchInput) {
        elements.searchInput.value = poData.po_number || '';
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!state.currentPO) {
        showNotification('Please select a purchase order first', 'error');
        return;
    }
    
    try {
        // Show loading state
        showNotification('Updating purchase order...', 'info');
        if (elements.submitButton) {
            elements.submitButton.textContent = 'Updating...';
            elements.submitButton.disabled = true;
        }
        
        // Build update data object
        const updateData = {
            po_id: document.getElementById('poId')?.value,
            po_number: document.getElementById('poNumber')?.value,
            po_date: document.getElementById('poDate')?.value,
            po_status: document.getElementById('status')?.value,
            
            vendor_reference: {
                vendor_code: document.getElementById('vendorCode')?.value,
                vendor_name: document.getElementById('vendorName')?.value,
                vendor_gst_number: document.getElementById('vendorGstin')?.value,
                vendor_contact: document.getElementById('vendorContact')?.value
            },
            
            delivery_details: {
                ship_to_address: {
                    address_line1: document.getElementById('shipToAddress')?.value,
                    city: document.getElementById('shipToCity')?.value,
                    state: document.getElementById('shipToState')?.value,
                    pin_code: document.getElementById('shipToPinCode')?.value
                },
                expected_delivery_date: document.getElementById('expectedDeliveryDate')?.value
            },
            
            payment_terms: {
                payment_cycle: document.getElementById('paymentCycle')?.value,
                advance_payment: parseFloat(document.getElementById('advancePayment')?.value || 0),
                retention_percentage: parseFloat(document.getElementById('retentionPercentage')?.value || 0)
            },
            
            metadata: {
                notes: document.getElementById('notes')?.value || ''
            }
        };
        
        console.log('Updating Purchase Order:', updateData);
        
        // Submit to API
        const response = await fetch(API_ENDPOINTS.PURCHASE_ORDER.UPDATE_PURCHASE_ORDER, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Purchase Order updated successfully!', 'success');
            
            // Clear localStorage
            localStorage.removeItem(PO_DETAILS_KEY);
            localStorage.removeItem('adani_fintell_purchase_orders'); // Clear PO cache to force refresh
            
            setTimeout(() => {
                window.location.href = 'purchase-order-database.html';
            }, 1500);
        } else {
            showNotification(`Error: ${result.error || 'Failed to update purchase order'}`, 'error');
        }
    } catch (error) {
        console.error('Error updating purchase order:', error);
        showNotification('Failed to update purchase order. Please try again.', 'error');
    } finally {
        if (elements.submitButton) {
            elements.submitButton.textContent = 'Update Purchase Order';
            elements.submitButton.disabled = false;
        }
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : type === 'warning' ? '#FFC107' : '#0B74B0'};
        color: ${type === 'warning' ? '#1A1A1A' : 'white'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
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
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
