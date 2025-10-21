/**
 * Adani Fintell Suite - Invoices Database Page
 * Manages invoice listing, search, filtering, and details viewing
 */

'use strict';

// LocalStorage key for caching invoices
const STORAGE_KEY = 'adani_fintell_invoices';
const STORAGE_TIMESTAMP_KEY = 'adani_fintell_invoices_timestamp';

/**
 * Page state management
 */
const state = {
    invoices: [],
    filteredInvoices: [],
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
        search: '',
        period: '',
        minAmount: null,
        maxAmount: null
    }
};

/**
 * DOM elements
 */
const elements = {
    searchInput: null,
    filterSelects: null,
    filterInputs: null,
    applyFiltersBtn: null,
    resetFiltersBtn: null,
    loadingState: null,
    emptyState: null,
    tableWrapper: null,
    tbody: null,
    recordCount: null,
    pagination: null,
    paginationInfo: null,
    prevPageBtn: null,
    nextPageBtn: null,
    refreshBtn: null,
    exportBtn: null,
    modal: null,
    modalOverlay: null,
    modalBody: null,
    modalCloseBtn: null
};

/**
 * Initialize the invoices page
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    attachEventListeners();
    loadInvoices();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements.searchInput = document.querySelector('[data-search-input]');
    elements.filterSelects = document.querySelectorAll('select[data-filter]');
    elements.filterInputs = document.querySelectorAll('input[data-filter]');
    elements.applyFiltersBtn = document.querySelector('[data-action="apply-filters"]');
    elements.resetFiltersBtn = document.querySelector('[data-action="reset-filters"]');
    elements.loadingState = document.querySelector('[data-loading-state]');
    elements.emptyState = document.querySelector('[data-empty-state]');
    elements.tableWrapper = document.querySelector('[data-table-wrapper]');
    elements.tbody = document.querySelector('[data-invoices-tbody]');
    elements.recordCount = document.querySelector('[data-record-count]');
    elements.pagination = document.querySelector('[data-pagination]');
    elements.paginationInfo = document.querySelector('[data-pagination-info]');
    elements.prevPageBtn = document.querySelector('[data-action="prev-page"]');
    elements.nextPageBtn = document.querySelector('[data-action="next-page"]');
    elements.refreshBtn = document.querySelector('[data-action="refresh-data"]');
    elements.exportBtn = document.querySelector('[data-action="export-data"]');
    elements.modal = document.querySelector('[data-invoice-modal]');
    elements.modalOverlay = document.querySelector('[data-modal-overlay]');
    elements.modalBody = document.querySelector('[data-modal-body]');
    elements.modalCloseBtn = document.querySelector('[data-action="close-modal"]');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Search input - use both input and change events for real-time search
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(handleSearchInput, 150));
        elements.searchInput.addEventListener('change', handleSearchInput);
    }
    
    // Filter buttons
    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', handleApplyFilters);
    }
    
    if (elements.resetFiltersBtn) {
        elements.resetFiltersBtn.addEventListener('click', handleResetFilters);
    }
    
    // Pagination
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener('click', () => changePage(state.currentPage - 1));
    }
    
    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener('click', () => changePage(state.currentPage + 1));
    }
    
    // Refresh button
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', handleRefreshData);
    }
    
    // Export button
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', handleExportData);
    }
    
    // Modal close
    if (elements.modalCloseBtn) {
        elements.modalCloseBtn.addEventListener('click', closeModal);
    }
    
    if (elements.modalOverlay) {
        elements.modalOverlay.addEventListener('click', closeModal);
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal && elements.modal.style.display === 'flex') {
            closeModal();
        }
    });
}

/**
 * Load invoices data from API or localStorage
 */
async function loadInvoices(forceRefresh = false) {
    // Check if we have cached data and it's not a forced refresh
    if (!forceRefresh) {
        const cachedData = getFromLocalStorage();
        if (cachedData && cachedData.length > 0) {
            console.log('Loading invoices from localStorage');
            state.invoices = cachedData;
            state.filteredInvoices = [...state.invoices];
            renderInvoices();
            updateRecordCount();
            return;
        }
    }
    
    // If no cached data or forced refresh, fetch from API
    showLoading();
    
    try {
        // Fetch invoices from API
        const response = await fetch(window.API_ENDPOINTS.DATABASE.FETCH_INVOICES, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the response data
        if (data && Array.isArray(data)) {
            state.invoices = data;
        } else if (data && data.invoices && Array.isArray(data.invoices)) {
            state.invoices = data.invoices;
        } else {
            console.warn('Unexpected data format, using empty array');
            state.invoices = [];
        }
        
        // Only save to localStorage if we have data
        if (state.invoices.length > 0) {
            saveToLocalStorage(state.invoices);
        } else {
            // Clear cache if no invoices returned
            clearLocalStorage();
        }
        
        state.filteredInvoices = [...state.invoices];
        hideLoading();
        renderInvoices();
        updateRecordCount();
        
        console.log(`Loaded ${state.invoices.length} invoices from API`);
    } catch (error) {
        console.error('Error loading invoices:', error);
        hideLoading();
        
        // Clear invoices on error
        state.invoices = [];
        state.filteredInvoices = [];
        
        // Clear cache on error
        clearLocalStorage();
        
        // Show error message to user
        showErrorState(error.message);
        updateRecordCount();
    }
}

/**
 * Save invoices to localStorage
 */
function saveToLocalStorage(invoices) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        console.log('Invoices saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Get invoices from localStorage
 */
function getFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const invoices = JSON.parse(data);
            console.log(`Retrieved ${invoices.length} invoices from localStorage`);
            return invoices;
        }
    } catch (error) {
        console.error('Error reading from localStorage:', error);
    }
    return null;
}

/**
 * Clear localStorage cache
 */
function clearLocalStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        console.log('localStorage cache cleared');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

/**
 * Handle refresh data
 */
async function handleRefreshData() {
    if (elements.refreshBtn) {
        elements.refreshBtn.classList.add('refreshing');
        elements.refreshBtn.disabled = true;
    }
    
    // Clear cache and reload
    clearLocalStorage();
    await loadInvoices(true);
    
    if (elements.refreshBtn) {
        elements.refreshBtn.classList.remove('refreshing');
        elements.refreshBtn.disabled = false;
    }
    
    console.log('Data refreshed successfully');
}

/**
 * Handle search input
 */
function handleSearchInput(e) {
    state.filters.search = e.target.value.toLowerCase().trim();
    applyFilters();
}

/**
 * Handle apply filters
 */
function handleApplyFilters() {
    // Get values from select filters
    elements.filterSelects.forEach(select => {
        const filterType = select.getAttribute('data-filter');
        state.filters[filterType] = select.value;
    });
    
    // Get values from input filters
    elements.filterInputs.forEach(input => {
        const filterType = input.getAttribute('data-filter');
        const value = input.value.trim();
        state.filters[filterType] = value ? parseFloat(value) : null;
    });
    
    applyFilters();
}

/**
 * Handle reset filters
 */
function handleResetFilters() {
    // Reset search input
    if (elements.searchInput) {
        elements.searchInput.value = '';
    }
    
    // Reset select filters
    elements.filterSelects.forEach(select => {
        select.value = '';
    });
    
    // Reset input filters
    elements.filterInputs.forEach(input => {
        input.value = '';
    });
    
    // Reset state
    state.filters = {
        search: '',
        period: '',
        minAmount: null,
        maxAmount: null
    };
    
    // Reapply filters
    applyFilters();
}

/**
 * Apply all filters to invoice list
 */
function applyFilters() {
    state.filteredInvoices = state.invoices.filter(invoice => {
        // Search filter
        if (state.filters.search) {
            const searchTerm = state.filters.search;
            const matchesSearch = 
                (invoice.invoice_id && invoice.invoice_id.toLowerCase().includes(searchTerm)) ||
                (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTerm)) ||
                (invoice.invoice_date && formatDate(invoice.invoice_date).toLowerCase().includes(searchTerm)) ||
                (invoice.vendor_name && invoice.vendor_name.toLowerCase().includes(searchTerm)) ||
                (invoice.vendor_gstin && invoice.vendor_gstin.toLowerCase().includes(searchTerm)) ||
                (invoice.company_gstin && invoice.company_gstin.toLowerCase().includes(searchTerm)) ||
                (invoice.invoice_amount && invoice.invoice_amount.toString().includes(searchTerm));
            
            if (!matchesSearch) return false;
        }
        
        // Period filter
        if (state.filters.period) {
            const invoiceDate = new Date(invoice.invoice_date);
            const today = new Date();
            const periodMatch = checkPeriodMatch(invoiceDate, today, state.filters.period);
            if (!periodMatch) return false;
        }
        
        // Amount filters
        if (state.filters.minAmount !== null && invoice.invoice_amount < state.filters.minAmount) {
            return false;
        }
        
        if (state.filters.maxAmount !== null && invoice.invoice_amount > state.filters.maxAmount) {
            return false;
        }
        
        return true;
    });
    
    state.currentPage = 1;
    renderInvoices();
    updateRecordCount();
}

/**
 * Check if date matches period filter
 */
function checkPeriodMatch(date, today, period) {
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    
    switch (period) {
        case 'today':
            return daysDiff === 0;
        case 'week':
            return daysDiff <= 7;
        case 'month':
            return daysDiff <= 30;
        case 'quarter':
            return daysDiff <= 90;
        case 'year':
            return daysDiff <= 365;
        default:
            return true;
    }
}

/**
 * Render invoices table
 */
function renderInvoices() {
    if (!elements.tbody) return;
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const pageInvoices = state.filteredInvoices.slice(startIndex, endIndex);
    
    if (pageInvoices.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    elements.tbody.innerHTML = '';
    pageInvoices.forEach(invoice => {
        const row = createInvoiceRow(invoice);
        elements.tbody.appendChild(row);
    });
    
    updatePagination();
}

/**
 * Create invoice table row
 */
function createInvoiceRow(invoice) {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td><strong>${invoice.invoice_id || 'N/A'}</strong></td>
        <td>${invoice.invoice_number || 'N/A'}</td>
        <td>${formatDate(invoice.invoice_date)}</td>
        <td>${invoice.vendor_name || 'N/A'}</td>
        <td><code>${invoice.vendor_gstin || 'N/A'}</code></td>
        <td><code>${invoice.company_gstin || 'N/A'}</code></td>
        <td>₹${formatNumber(invoice.invoice_amount)}</td>
        <td>
            <button class="action-btn" data-action="view-details" data-invoice-id="${invoice.invoice_id}">
                View
            </button>
        </td>
    `;
    
    // Attach event listener to view button
    const viewBtn = tr.querySelector('[data-action="view-details"]');
    if (viewBtn) {
        viewBtn.addEventListener('click', () => showInvoiceDetails(invoice));
    }
    
    return tr;
}

/**
 * Show invoice details in modal
 */
function showInvoiceDetails(invoice) {
    if (!elements.modal || !elements.modalBody) return;
    
    // Format line items
    const lineItemsHTML = invoice.line_items && invoice.line_items.length > 0
        ? invoice.line_items.map(item => `
            <tr>
                <td>${item.description || 'N/A'}</td>
                <td>${item.hsn_sac || 'N/A'}</td>
                <td>${item.quantity || 0}</td>
                <td>₹${formatNumber(item.rate || 0)}</td>
                <td>₹${formatNumber(item.amount || 0)}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="5">No line items available</td></tr>';
    
    elements.modalBody.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Invoice Information</h4>
                <div style="display: grid; gap: 1rem;">
                    <div><strong>Invoice ID:</strong> ${invoice.invoice_id || 'N/A'}</div>
                    <div><strong>Invoice Number:</strong> ${invoice.invoice_number || 'N/A'}</div>
                    <div><strong>Invoice Date:</strong> ${formatDate(invoice.invoice_date)}</div>
                    <div><strong>Upload Timestamp:</strong> ${formatDate(invoice.upload_timestamp)}</div>
                </div>
            </div>
            
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Vendor Details</h4>
                <div style="display: grid; gap: 1rem;">
                    <div><strong>Vendor Name:</strong> ${invoice.vendor_name || 'N/A'}</div>
                    <div><strong>Vendor GSTIN:</strong> <code>${invoice.vendor_gstin || 'N/A'}</code></div>
                </div>
            </div>
            
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Company Details</h4>
                <div style="display: grid; gap: 1rem;">
                    <div><strong>Company GSTIN:</strong> <code>${invoice.company_gstin || 'N/A'}</code></div>
                    <div><strong>HSN/SAC Codes:</strong> ${invoice.hsn_sac_codes ? invoice.hsn_sac_codes.join(', ') : 'N/A'}</div>
                </div>
            </div>
            
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Financial Details</h4>
                <div style="display: grid; gap: 1rem;">
                    <div><strong>Subtotal:</strong> ₹${formatNumber(invoice.subtotal || 0)}</div>
                    <div><strong>CGST Amount:</strong> ₹${formatNumber(invoice.cgst_amount || 0)}</div>
                    <div><strong>SGST Amount:</strong> ₹${formatNumber(invoice.sgst_amount || 0)}</div>
                    ${invoice.igst_amount ? `<div><strong>IGST Amount:</strong> ₹${formatNumber(invoice.igst_amount)}</div>` : ''}
                    <div><strong>GST Rate:</strong> ${invoice.gst_rate ? invoice.gst_rate + '%' : 'N/A'}</div>
                    <div><strong>Total Amount:</strong> <strong style="color: var(--module-primary);">₹${formatNumber(invoice.invoice_amount)}</strong></div>
                </div>
            </div>
            
            ${invoice.line_items && invoice.line_items.length > 0 ? `
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">Line Items</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: var(--bg-lighter); border-bottom: 2px solid var(--border-color);">
                            <th style="padding: 0.5rem; text-align: left;">Description</th>
                            <th style="padding: 0.5rem; text-align: left;">HSN/SAC</th>
                            <th style="padding: 0.5rem; text-align: right;">Quantity</th>
                            <th style="padding: 0.5rem; text-align: right;">Rate</th>
                            <th style="padding: 0.5rem; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lineItemsHTML}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>
    `;
    
    elements.modal.style.display = 'flex';
}

/**
 * Close modal
 */
function closeModal() {
    if (elements.modal) {
        elements.modal.style.display = 'none';
    }
}

/**
 * Update record count display
 */
function updateRecordCount() {
    if (elements.recordCount) {
        const count = state.filteredInvoices.length;
        elements.recordCount.textContent = `${count} invoice${count !== 1 ? 's' : ''} found`;
    }
}

/**
 * Update pagination controls
 */
function updatePagination() {
    if (!elements.pagination) return;
    
    const totalPages = Math.ceil(state.filteredInvoices.length / state.itemsPerPage);
    
    if (totalPages <= 1) {
        elements.pagination.style.display = 'none';
        return;
    }
    
    elements.pagination.style.display = 'flex';
    
    if (elements.paginationInfo) {
        elements.paginationInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    }
    
    if (elements.prevPageBtn) {
        elements.prevPageBtn.disabled = state.currentPage === 1;
    }
    
    if (elements.nextPageBtn) {
        elements.nextPageBtn.disabled = state.currentPage === totalPages;
    }
}

/**
 * Change page
 */
function changePage(newPage) {
    const totalPages = Math.ceil(state.filteredInvoices.length / state.itemsPerPage);
    
    if (newPage < 1 || newPage > totalPages) return;
    
    state.currentPage = newPage;
    renderInvoices();
    
    // Scroll to top of table
    if (elements.tableWrapper) {
        elements.tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Handle export data
 */
function handleExportData() {
    // Convert filtered invoices to CSV
    const csv = convertToCSV(state.filteredInvoices);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
    const headers = ['Invoice ID', 'Invoice Number', 'Invoice Date', 'Vendor Name', 'Vendor GSTIN', 'Company GSTIN', 'Amount', 'Subtotal', 'CGST', 'SGST', 'IGST', 'GST Rate'];
    const rows = data.map(invoice => [
        invoice.invoice_id || '',
        invoice.invoice_number || '',
        invoice.invoice_date || '',
        invoice.vendor_name || '',
        invoice.vendor_gstin || '',
        invoice.company_gstin || '',
        invoice.invoice_amount || 0,
        invoice.subtotal || 0,
        invoice.cgst_amount || 0,
        invoice.sgst_amount || 0,
        invoice.igst_amount || 0,
        invoice.gst_rate || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
}

/**
 * Show loading state
 */
function showLoading() {
    if (elements.loadingState) elements.loadingState.style.display = 'flex';
    if (elements.tableWrapper) elements.tableWrapper.style.display = 'none';
    if (elements.emptyState) elements.emptyState.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
    if (elements.loadingState) elements.loadingState.style.display = 'none';
    if (elements.tableWrapper) elements.tableWrapper.style.display = 'block';
}

/**
 * Show empty state
 */
function showEmptyState() {
    if (elements.emptyState) elements.emptyState.style.display = 'flex';
    if (elements.tableWrapper) elements.tableWrapper.style.display = 'none';
    if (elements.pagination) elements.pagination.style.display = 'none';
}

/**
 * Hide empty state
 */
function hideEmptyState() {
    if (elements.emptyState) elements.emptyState.style.display = 'none';
    if (elements.tableWrapper) elements.tableWrapper.style.display = 'block';
}

/**
 * Show error state
 */
function showErrorState(errorMessage) {
    if (elements.emptyState) {
        elements.emptyState.innerHTML = `
            <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p class="empty-text">Error loading invoices</p>
            <p class="empty-subtext">${errorMessage || 'Please try again later'}</p>
        `;
        elements.emptyState.style.display = 'flex';
    }
    if (elements.tableWrapper) elements.tableWrapper.style.display = 'none';
    if (elements.pagination) elements.pagination.style.display = 'none';
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

/**
 * Format number with commas
 */
function formatNumber(number) {
    return parseFloat(number).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Debounce function
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

// Log page initialization
console.log('Invoices page initialized');
