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
        // Use mock data for now (until API is ready)
        const mockData = [
            {
                "po_id": "PO-2024-001",
                "po_number": "PO/24/001",
                "po_date": "2024-01-15",
                "vendor_name": "ABC Suppliers Ltd",
                "vendor_gstin": "27AABCU9603R1ZX",
                "company_gstin": "27AADCA5659F1ZV",
                "total_amount": 150000.00,
                "status": "Approved",
                "delivery_date": "2024-02-15",
                "items_count": 5,
                "created_by": "John Doe",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            },
            {
                "po_id": "PO-2024-002",
                "po_number": "PO/24/002",
                "po_date": "2024-01-20",
                "vendor_name": "XYZ Trading Co",
                "vendor_gstin": "29AABCU9603R1ZY",
                "company_gstin": "27AADCA5659F1ZV",
                "total_amount": 250000.00,
                "status": "Pending",
                "delivery_date": "2024-02-20",
                "items_count": 8,
                "created_by": "Jane Smith",
                "created_at": "2024-01-20T14:45:00Z",
                "updated_at": "2024-01-20T14:45:00Z"
            },
            {
                "po_id": "PO-2024-003",
                "po_number": "PO/24/003",
                "po_date": "2024-01-25",
                "vendor_name": "Tech Solutions Inc",
                "vendor_gstin": "24AABCU9603R1ZW",
                "company_gstin": "27AADCA5659F1ZV",
                "total_amount": 350000.00,
                "status": "Completed",
                "delivery_date": "2024-02-25",
                "items_count": 12,
                "created_by": "Mike Johnson",
                "created_at": "2024-01-25T09:15:00Z",
                "updated_at": "2024-01-25T09:15:00Z"
            },
            {
                "po_id": "PO-2024-004",
                "po_number": "PO/24/004",
                "po_date": "2024-02-01",
                "vendor_name": "Global Enterprises",
                "vendor_gstin": "27AABCU9603R1ZZ",
                "company_gstin": "27AADCA5659F1ZV",
                "total_amount": 180000.00,
                "status": "Rejected",
                "delivery_date": "2024-03-01",
                "items_count": 6,
                "created_by": "Sarah Davis",
                "created_at": "2024-02-01T11:30:00Z",
                "updated_at": "2024-02-01T11:30:00Z"
            },
            {
                "po_id": "PO-2024-005",
                "po_number": "PO/24/005",
                "po_date": "2024-02-05",
                "vendor_name": "Industrial Supplies Co",
                "vendor_gstin": "29AABCU9603R1ZQ",
                "company_gstin": "27AADCA5659F1ZV",
                "total_amount": 220000.00,
                "status": "Cancelled",
                "delivery_date": "2024-03-05",
                "items_count": 9,
                "created_by": "David Wilson",
                "created_at": "2024-02-05T14:20:00Z",
                "updated_at": "2024-02-05T14:20:00Z"
            }
        ];
        
        state.purchaseOrders = mockData;
        state.filteredPurchaseOrders = [...mockData];
        renderPurchaseOrders();
        
        // Uncomment below to use API instead of mock data
        /*
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
        */
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
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Handle successful response with data
        if (data.success && data.data && Array.isArray(data.data)) {
            state.purchaseOrders = data.data;
            state.filteredPurchaseOrders = [...data.data];
            
            // Cache the data
            cachePurchaseOrders(data.data);
            
            renderPurchaseOrders();
        } 
        // Handle successful response but empty data
        else if (data.success && (!data.data || data.data.length === 0)) {
            state.purchaseOrders = [];
            state.filteredPurchaseOrders = [];
            renderPurchaseOrders();
        }
        // Handle error response
        else {
            console.error('Invalid response format:', data);
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
            <td><code>${escapeHtml(po.vendor_gstin)}</code></td>
            <td><code>${escapeHtml(po.company_gstin)}</code></td>
            <td><span class="amount">₹${formatAmount(po.total_amount)}</span></td>
            <td>${getStatusBadge(po.status)}</td>
            <td>${formatDate(po.delivery_date)}</td>
            <td>${po.items_count}</td>
            <td>${escapeHtml(po.created_by)}</td>
        </tr>
    `).join('');
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
