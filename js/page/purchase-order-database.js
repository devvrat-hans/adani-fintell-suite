/**
 * Adani Fintell Suite - Purchase Orders Database Page
 * Manages purchase order listing, search, and viewing
 */

'use strict';

// LocalStorage key for caching purchase orders
const STORAGE_KEY = 'adani_fintell_purchase_orders';
const STORAGE_TIMESTAMP_KEY = 'adani_fintell_purchase_orders_timestamp';

/**
 * Page state management
 */
const state = {
    purchaseOrders: [],
    filteredPurchaseOrders: [],
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
        search: ''
    }
};

/**
 * DOM elements
 */
const elements = {
    searchInput: null,
    loadingState: null,
    emptyState: null,
    tableWrapper: null,
    tbody: null,
    recordCount: null,
    pagination: null,
    paginationInfo: null,
    prevPageBtn: null,
    nextPageBtn: null,
    refreshBtn: null
};

/**
 * Initialize the purchase orders page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body to show content
    document.body.classList.add('templates-loaded');
    
    initializeElements();
    attachEventListeners();
    loadPurchaseOrders();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements.searchInput = document.querySelector('[data-search-input]');
    elements.loadingState = document.querySelector('[data-loading-state]');
    elements.emptyState = document.querySelector('[data-empty-state]');
    elements.tableWrapper = document.querySelector('[data-table-wrapper]');
    elements.tbody = document.querySelector('[data-po-tbody]');
    elements.recordCount = document.querySelector('[data-record-count]');
    elements.pagination = document.querySelector('[data-pagination]');
    elements.paginationInfo = document.querySelector('[data-pagination-info]');
    elements.prevPageBtn = document.querySelector('[data-action="prev-page"]');
    elements.nextPageBtn = document.querySelector('[data-action="next-page"]');
    elements.refreshBtn = document.querySelector('[data-action="refresh-data"]');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Search input - real-time search
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(handleSearchInput, 150));
        elements.searchInput.addEventListener('change', handleSearchInput);
    }
    
    // Refresh button
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', handleRefresh);
    }
    
    // Pagination buttons
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener('click', handlePrevPage);
    }
    
    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener('click', handleNextPage);
    }
}

/**
 * Load purchase orders from cache or API
 */
async function loadPurchaseOrders() {
    try {
        // Check if we have cached data
        const cachedData = getCachedPurchaseOrders();
        
        if (cachedData) {
            state.purchaseOrders = cachedData;
            state.filteredPurchaseOrders = [...cachedData];
            renderPurchaseOrders();
            return;
        }
        
        // Fetch from API
        await fetchPurchaseOrders();
    } catch (error) {
        console.error('Error loading purchase orders:', error);
        showError('Failed to load purchase orders. Please try again.');
    }
}

/**
 * Fetch purchase orders from API
 */
async function fetchPurchaseOrders() {
    try {
        showLoading();
        
        console.log('Fetching purchase orders from:', API_ENDPOINTS.PURCHASE_ORDER.FETCH_PURCHASE_ORDERS);
        
        const response = await fetch(API_ENDPOINTS.PURCHASE_ORDER.FETCH_PURCHASE_ORDERS, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            // For now, show empty state instead of error
            state.purchaseOrders = [];
            state.filteredPurchaseOrders = [];
            renderPurchaseOrders();
            return;
        }
        
        let data = await response.json();
        console.log('API Response:', data);
        
        // Normalize the data from camelCase to snake_case for consistency with frontend
        if (Array.isArray(data) && data.length > 0) {
            const normalizedData = data.map(po => ({
                _id: po._id,
                po_id: po._id, // Use _id as po_id for consistency
                po_number: po.po_number || 'PO-' + po._id.substring(po._id.length - 8),
                po_date: po.poDate,
                po_status: po.poStatus,
                status: po.poStatus, // Also keep as 'status' for compatibility
                
                // Flatten vendor information for easy access
                vendor_name: po.vendorReference?.vendorName,
                vendor_code: po.vendorReference?.vendorCode,
                vendor_gstin: po.vendorReference?.vendorGstNumber,
                vendor_gst_number: po.vendorReference?.vendorGstNumber, // Alternative field name
                
                // Flatten financial information
                total_amount: po.financialSummary?.grandTotal,
                grand_total: po.financialSummary?.grandTotal,
                subtotal: po.financialSummary?.subtotal,
                
                // Flatten delivery information
                delivery_date: po.deliveryDetails?.expectedDeliveryDate || po.deliveryDetails?.requestedDeliveryDate,
                expected_delivery_date: po.deliveryDetails?.expectedDeliveryDate || po.deliveryDetails?.requestedDeliveryDate,
                
                // Line items count
                items_count: po.lineItems?.length || 0,
                
                // Keep full nested structures for details view
                vendor_reference: {
                    vendor_code: po.vendorReference?.vendorCode,
                    vendor_name: po.vendorReference?.vendorName,
                    vendor_gst_number: po.vendorReference?.vendorGstNumber
                },
                delivery_details: po.deliveryDetails,
                line_items: po.lineItems,
                financial_summary: {
                    subtotal: po.financialSummary?.subtotal,
                    total_tax_amount: po.financialSummary?.totalTaxAmount,
                    other_charges: po.financialSummary?.otherCharges,
                    total_other_charges: po.financialSummary?.totalOtherCharges,
                    grand_total: po.financialSummary?.grandTotal,
                    currency: po.financialSummary?.currency
                },
                payment_terms: po.paymentTerms,
                approval_workflow: po.approvalWorkflow,
                budget_allocation: po.budgetAllocation,
                contract_reference: po.contractReference,
                metadata: po.metadata
            }));
            
            state.purchaseOrders = normalizedData;
            state.filteredPurchaseOrders = [...normalizedData];
            
            // Cache the data
            cachePurchaseOrders(normalizedData);
            
            renderPurchaseOrders();
        } else {
            // Empty array or no data
            state.purchaseOrders = [];
            state.filteredPurchaseOrders = [];
            renderPurchaseOrders();
        }
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        // Show empty state instead of alert
        hideLoading();
        state.purchaseOrders = [];
        state.filteredPurchaseOrders = [];
        showEmptyState();
    }
}

/**
 * Handle search input
 */
function handleSearchInput(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    state.filters.search = searchTerm;
    state.currentPage = 1; // Reset to first page
    
    applyFilters();
}

/**
 * Apply filters to purchase orders
 */
function applyFilters() {
    let filtered = [...state.purchaseOrders];
    
    // Apply search filter
    if (state.filters.search) {
        filtered = filtered.filter(po => {
            const searchFields = [
                po.po_id,
                po.po_number,
                po.vendor_name,
                po.vendor_gstin,
                po.company_gstin,
                po.status,
                po.created_by
            ];
            
            return searchFields.some(field => 
                field && field.toString().toLowerCase().includes(state.filters.search)
            );
        });
    }
    
    state.filteredPurchaseOrders = filtered;
    renderPurchaseOrders();
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
    // Clear cache
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    
    // Fetch fresh data
    await fetchPurchaseOrders();
}

/**
 * Handle previous page button click
 */
function handlePrevPage() {
    if (state.currentPage > 1) {
        state.currentPage--;
        renderPurchaseOrders();
        scrollToTop();
    }
}

/**
 * Handle next page button click
 */
function handleNextPage() {
    const totalPages = Math.ceil(state.filteredPurchaseOrders.length / state.itemsPerPage);
    
    if (state.currentPage < totalPages) {
        state.currentPage++;
        renderPurchaseOrders();
        scrollToTop();
    }
}

/**
 * Render purchase orders table
 */
function renderPurchaseOrders() {
    hideLoading();
    
    if (state.filteredPurchaseOrders.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    showTable();
    
    // Update record count
    updateRecordCount();
    
    // Get paginated data
    const paginatedData = getPaginatedData();
    
    // Render table rows
    renderTableRows(paginatedData);
    
    // Update pagination
    updatePagination();
}

/**
 * Get paginated data
 */
function getPaginatedData() {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.filteredPurchaseOrders.slice(startIndex, endIndex);
}

/**
 * Render table rows
 */
function renderTableRows(purchaseOrders) {
    if (!elements.tbody) return;
    
    elements.tbody.innerHTML = purchaseOrders.map(po => `
        <tr>
            <td><strong>${escapeHtml(po.po_number)}</strong></td>
            <td>${formatDate(po.po_date)}</td>
            <td>${escapeHtml(po.vendor_name)}</td>
            <td><code>${escapeHtml(po.vendor_gstin || po.vendor_gst_number || '')}</code></td>
            <td><code>${escapeHtml(po.company_gstin || '')}</code></td>
            <td><span class="amount">₹${formatAmount(po.total_amount || po.grand_total || 0)}</span></td>
            <td>${getStatusBadge(po.status || po.po_status || 'Pending')}</td>
            <td>${formatDate(po.delivery_date || po.expected_delivery_date)}</td>
            <td>${po.items_count || (po.line_items ? po.line_items.length : 0)}</td>
            <td>
                <button class="btn-action btn-view" data-action="view-details" data-po-id="${escapeHtml(po.po_id)}">
                    View Details
                </button>
                <button class="btn-action btn-edit" data-action="edit-po" data-po-id="${escapeHtml(po.po_id)}">
                    Edit
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to action buttons
    attachActionButtonListeners();
}

/**
 * Attach event listeners to action buttons
 */
function attachActionButtonListeners() {
    const viewButtons = document.querySelectorAll('[data-action="view-details"]');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', handleViewDetails);
    });
    
    const editButtons = document.querySelectorAll('[data-action="edit-po"]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', handleEditPO);
    });
}

/**
 * Handle view details button click
 */
async function handleViewDetails(event) {
    const poId = event.target.dataset.poId;
    if (!poId) {
        console.error('No PO ID found');
        return;
    }
    
    try {
        // Show loading state
        showNotification('Loading purchase order details...', 'info');
        
        console.log('Fetching PO details for:', poId);
        console.log('API Endpoint:', API_ENDPOINTS.PURCHASE_ORDER.GET_PO_DETAILS);
        
        // Fetch PO details from API
        const response = await fetch(API_ENDPOINTS.PURCHASE_ORDER.GET_PO_DETAILS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ po_id: poId })
        }).catch(fetchError => {
            console.error('Fetch error:', fetchError);
            throw new Error(`Network error: ${fetchError.message}`);
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success && result.data) {
            showPODetailsModal(result.data);
        } else {
            const errorMessage = result.error || 'Failed to load purchase order details';
            showNotification(errorMessage, 'error');
            console.error('API Error:', result);
        }
    } catch (error) {
        console.error('Error fetching PO details:', error);
        console.error('Error stack:', error.stack);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

/**
 * Handle edit PO button click
 */
async function handleEditPO(event) {
    const poId = event.target.dataset.poId;
    if (!poId) return;
    
    try {
        // Show loading state
        showNotification('Loading purchase order details...', 'info');
        
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
            // Store PO details in localStorage for the edit page to use
            localStorage.setItem('current_po_for_edit', JSON.stringify(result.data));
            
            // Also store all POs data for search functionality
            const allPOsData = state.purchaseOrders.map(po => ({
                po_id: po.po_id,
                po_number: po.po_number,
                vendor_name: po.vendor_name,
                vendor_code: po.vendor_code,
                po_date: po.po_date,
                po_status: po.po_status || po.status,
                grand_total: po.grand_total || po.total_amount
            }));
            localStorage.setItem('all_pos_for_search', JSON.stringify(allPOsData));
            
            // Redirect to edit page
            window.location.href = `edit-purchase-order.html?po_id=${encodeURIComponent(poId)}`;
        } else {
            showNotification('Failed to load purchase order details', 'error');
        }
    } catch (error) {
        console.error('Error fetching PO details for edit:', error);
        showNotification('Error loading purchase order. Please try again.', 'error');
    }
}

/**
 * Show PO details in a modal
 */
function showPODetailsModal(poData) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="poDetailsModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">Purchase Order Details</h2>
                    <button class="modal-close" data-action="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="details-section">
                        <h3>Basic Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">PO Number:</span>
                                <span class="detail-value">${escapeHtml(poData.po_number)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">PO Date:</span>
                                <span class="detail-value">${formatDate(poData.po_date)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value">${getStatusBadge(poData.po_status)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>Vendor Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Vendor Code:</span>
                                <span class="detail-value">${escapeHtml(poData.vendor_reference?.vendor_code || '')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Vendor Name:</span>
                                <span class="detail-value">${escapeHtml(poData.vendor_reference?.vendor_name || '')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">GST Number:</span>
                                <span class="detail-value"><code>${escapeHtml(poData.vendor_reference?.vendor_gst_number || '')}</code></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>Delivery Details</h3>
                        <div class="details-grid">
                            <div class="detail-item full-width">
                                <span class="detail-label">Ship To:</span>
                                <span class="detail-value">${formatAddress(poData.delivery_details?.ship_to_address)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Expected Delivery:</span>
                                <span class="detail-value">${formatDate(poData.delivery_details?.expected_delivery_date)}</span>
                            </div>
                            ${poData.delivery_details?.actual_delivery_date ? `
                            <div class="detail-item">
                                <span class="detail-label">Actual Delivery:</span>
                                <span class="detail-value">${formatDate(poData.delivery_details.actual_delivery_date)}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>Line Items</h3>
                        <div class="line-items-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Description</th>
                                        <th>HSN</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Price</th>
                                        <th>Tax %</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${poData.line_items?.map(item => `
                                        <tr>
                                            <td>${item.line_number}</td>
                                            <td>${escapeHtml(item.item_description)}</td>
                                            <td><code>${escapeHtml(item.hsn_code)}</code></td>
                                            <td>${item.quantity}</td>
                                            <td>${escapeHtml(item.unit_of_measurement)}</td>
                                            <td>₹${formatAmount(item.unit_price)}</td>
                                            <td>${item.tax_rate}%</td>
                                            <td>₹${formatAmount(item.line_total_with_tax)}</td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="8">No line items</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>Financial Summary</h3>
                        <div class="financial-summary">
                            <div class="summary-row">
                                <span>Subtotal:</span>
                                <span>₹${formatAmount(poData.financial_summary?.subtotal || 0)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Total Tax:</span>
                                <span>₹${formatAmount(poData.financial_summary?.total_tax_amount || 0)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Other Charges:</span>
                                <span>₹${formatAmount(poData.financial_summary?.total_other_charges || 0)}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Grand Total:</span>
                                <span>₹${formatAmount(poData.financial_summary?.grand_total || 0)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${poData.metadata?.notes ? `
                    <div class="details-section">
                        <h3>Notes</h3>
                        <p>${escapeHtml(poData.metadata.notes)}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" data-action="close-modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    const modal = document.getElementById('poDetailsModal');
    const closeButtons = modal.querySelectorAll('[data-action="close-modal"]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Format address object
 */
function formatAddress(address) {
    if (!address) return 'N/A';
    
    const parts = [
        address.address_line1,
        address.city,
        address.state,
        address.pin_code
    ].filter(Boolean);
    
    return escapeHtml(parts.join(', '));
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
        background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#0B74B0'};
        color: white;
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
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
    return `<span class="status-badge status-${statusClass}">${escapeHtml(status)}</span>`;
}

/**
 * Update record count
 */
function updateRecordCount() {
    if (!elements.recordCount) return;
    
    const count = state.filteredPurchaseOrders.length;
    const text = count === 1 ? 'purchase order' : 'purchase orders';
    elements.recordCount.textContent = `${count} ${text} found`;
}

/**
 * Update pagination controls
 */
function updatePagination() {
    if (!elements.pagination) return;
    
    const totalItems = state.filteredPurchaseOrders.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    
    // Show/hide pagination
    if (totalPages <= 1) {
        elements.pagination.style.display = 'none';
        return;
    }
    
    elements.pagination.style.display = 'flex';
    
    // Update pagination info
    const startIndex = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endIndex = Math.min(state.currentPage * state.itemsPerPage, totalItems);
    
    if (elements.paginationInfo) {
        elements.paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems}`;
    }
    
    // Update button states
    if (elements.prevPageBtn) {
        elements.prevPageBtn.disabled = state.currentPage === 1;
    }
    
    if (elements.nextPageBtn) {
        elements.nextPageBtn.disabled = state.currentPage === totalPages;
    }
}

/**
 * Cache purchase orders in localStorage
 */
function cachePurchaseOrders(purchaseOrders) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(purchaseOrders));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error caching purchase orders:', error);
    }
}

/**
 * Get cached purchase orders from localStorage
 */
function getCachedPurchaseOrders() {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
        
        if (!cached || !timestamp) {
            return null;
        }
        
        // Return cached data (no expiry for manual refresh model)
        return JSON.parse(cached);
    } catch (error) {
        console.error('Error reading cached purchase orders:', error);
        return null;
    }
}

/**
 * Show loading state
 */
function showLoading() {
    if (elements.loadingState) {
        elements.loadingState.style.display = 'flex';
    }
    
    hideEmptyState();
    hideTable();
}

/**
 * Hide loading state
 */
function hideLoading() {
    if (elements.loadingState) {
        elements.loadingState.style.display = 'none';
    }
}

/**
 * Show empty state
 */
function showEmptyState() {
    if (elements.emptyState) {
        elements.emptyState.style.display = 'flex';
    }
    
    hideTable();
    updateRecordCount();
}

/**
 * Hide empty state
 */
function hideEmptyState() {
    if (elements.emptyState) {
        elements.emptyState.style.display = 'none';
    }
}

/**
 * Show table
 */
function showTable() {
    if (elements.tableWrapper) {
        elements.tableWrapper.style.display = 'block';
    }
}

/**
 * Hide table
 */
function hideTable() {
    if (elements.tableWrapper) {
        elements.tableWrapper.style.display = 'none';
    }
    
    if (elements.pagination) {
        elements.pagination.style.display = 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    console.error('Error:', message);
    // Don't show alert, just log the error
    // The empty state will be shown instead
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
 * Format amount with Indian number system
 */
function formatAmount(amount) {
    if (amount === null || amount === undefined) return '0.00';
    
    return parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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

/**
 * Debounce function for search input
 */
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Scroll to top of results
 */
function scrollToTop() {
    if (elements.tableWrapper) {
        elements.tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
