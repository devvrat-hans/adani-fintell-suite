/**
 * Vendor Database Page Script
 * Manages vendor listing, search, and pagination
 */

// LocalStorage keys
const STORAGE_KEYS = {
    VENDORS: 'fintell_vendors_data',
    LAST_UPDATED: 'fintell_vendors_last_updated'
};

// State management
const state = {
    vendors: [],
    filteredVendors: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchQuery: "",
    isLoading: false
};

// DOM Elements
let searchInput;
let refreshBtn;
let tableBody;
let prevPageBtn;
let nextPageBtn;
let pageNumbersContainer;
let showingStart;
let showingEnd;
let totalVendors;

/**
 * Initialize the vendor database page
 */
async function init() {
    // Get DOM elements
    searchInput = document.getElementById('search-input');
    refreshBtn = document.getElementById('refresh-btn');
    tableBody = document.getElementById('vendor-table-body');
    prevPageBtn = document.getElementById('prev-page');
    nextPageBtn = document.getElementById('next-page');
    pageNumbersContainer = document.getElementById('page-numbers');
    showingStart = document.getElementById('showing-start');
    showingEnd = document.getElementById('showing-end');
    totalVendors = document.getElementById('total-vendors');

    // Add event listeners
    attachEventListeners();

    // Load vendors from localStorage or fetch from API
    await loadVendors();
}

/**
 * Load vendors from localStorage or fetch from API
 */
async function loadVendors() {
    try {
        // Check if we have cached data
        const cachedVendors = localStorage.getItem(STORAGE_KEYS.VENDORS);
        const lastUpdated = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
        
        // If we have cached data that's less than 5 minutes old, use it
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        const isCacheValid = lastUpdated && (Date.now() - parseInt(lastUpdated)) < CACHE_DURATION;
        
        if (cachedVendors && isCacheValid) {
            console.log('Loading vendors from cache...');
            state.vendors = JSON.parse(cachedVendors);
            state.filteredVendors = [...state.vendors];
            renderTable();
            updatePagination();
        } else {
            // Fetch from API
            await fetchVendorsFromAPI();
        }
    } catch (error) {
        console.error('Error loading vendors:', error);
        showErrorMessage('Failed to load vendors. Please try again.');
    }
}

/**
 * Fetch vendors from API
 */
async function fetchVendorsFromAPI() {
    try {
        state.isLoading = true;
        showLoadingState();
        
        console.log('Fetching vendors from API...');
        const response = await fetch(API_ENDPOINTS.VENDOR_MASTER.FETCH_VENDORS, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        // Handle different response formats
        let vendors = [];
        if (result.success && result.data) {
            vendors = result.data.vendors || result.data || [];
        } else if (Array.isArray(result)) {
            vendors = result;
        } else {
            throw new Error(result.message || 'Invalid response format');
        }
        
        // Update state with fetched data
        state.vendors = vendors;
        state.filteredVendors = [...state.vendors];
        
        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(state.vendors));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, Date.now().toString());
        
        console.log(`Loaded ${state.vendors.length} vendors from API`);
        
        // Render table
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error fetching vendors:', error);
        showErrorMessage('Failed to fetch vendors from server. Please try refreshing.');
    } finally {
        state.isLoading = false;
    }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Search input
    searchInput.addEventListener('input', handleSearch);

    // Refresh button
    refreshBtn.addEventListener('click', handleRefresh);

    // Pagination buttons
    prevPageBtn.addEventListener('click', () => changePage(state.currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(state.currentPage + 1));
}

/**
 * Handle search functionality
 * @param {Event} event - Input event
 */
function handleSearch(event) {
    state.searchQuery = event.target.value.toLowerCase().trim();
    
    if (state.searchQuery === "") {
        state.filteredVendors = [...state.vendors];
    } else {
        state.filteredVendors = state.vendors.filter(vendor => {
            // Handle both old and new field formats
            const vendorCode = (vendor.vendorCode || vendor._id || '').toLowerCase();
            const vendorName = (vendor.vendorName || vendor.legal_name || '').toLowerCase();
            const gstNumber = (vendor.gstNumber || vendor.gst_number || '').toLowerCase();
            const contactPerson = (vendor.contactPerson || vendor.contact_person || '').toLowerCase();
            const email = (vendor.email || '').toLowerCase();
            const phone = (vendor.phone || '');
            const address = (vendor.address || vendor.registered_city || vendor.registered_state || '').toLowerCase();
            
            return (
                vendorCode.includes(state.searchQuery) ||
                vendorName.includes(state.searchQuery) ||
                gstNumber.includes(state.searchQuery) ||
                contactPerson.includes(state.searchQuery) ||
                email.includes(state.searchQuery) ||
                phone.includes(state.searchQuery) ||
                address.includes(state.searchQuery)
            );
        });
    }

    state.currentPage = 1;
    renderTable();
    updatePagination();
}

/**
 * Handle refresh functionality
 */
async function handleRefresh() {
    // Clear cache and fetch fresh data from API
    localStorage.removeItem(STORAGE_KEYS.VENDORS);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
    
    // Reset search
    state.currentPage = 1;
    state.searchQuery = "";
    searchInput.value = "";

    // Fetch fresh data
    await fetchVendorsFromAPI();

    // Show success notification
    if (window.showNotification) {
        window.showNotification('Vendor list refreshed successfully', 'success');
    }
}

/**
 * Render the vendor table
 */
function renderTable() {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const vendorsToDisplay = state.filteredVendors.slice(startIndex, endIndex);

    if (vendorsToDisplay.length === 0) {
        renderEmptyState();
        return;
    }

    tableBody.innerHTML = vendorsToDisplay.map(vendor => {
        // Handle both old and new field formats
        const vendorCode = vendor.vendorCode || vendor._id || 'N/A';
        const vendorName = vendor.vendorName || vendor.legal_name || 'N/A';
        const gstNumber = vendor.gstNumber || vendor.gst_number || 'N/A';
        const contactPerson = vendor.contactPerson || vendor.contact_person || 'N/A';
        const email = vendor.email || 'N/A';
        const phone = vendor.phone || 'N/A';
        
        // Build address from available fields
        let address = vendor.address;
        if (!address && vendor.registered_city && vendor.registered_state) {
            address = `${vendor.registered_city}, ${vendor.registered_state}`;
        } else if (!address) {
            address = 'N/A';
        }
        
        const status = vendor.status || vendor.vendor_status || 'active';
        
        return `
        <tr>
            <td>${vendorName}</td>
            <td>${gstNumber}</td>
            <td>${contactPerson}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td>${address}</td>
            <td>
                <span class="status-badge ${status}">
                    ${status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewVendor('${vendorCode}')">View</button>
                    <button class="btn-action edit" onclick="editVendor('${vendorCode}')">Edit</button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

/**
 * Render empty state when no vendors found
 */
function renderEmptyState() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="8">
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-text">No vendors found</div>
                    <div class="empty-state-subtext">
                        ${state.searchQuery ? 'Try adjusting your search criteria' : 'Add vendors to get started'}
                    </div>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(state.filteredVendors.length / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endIndex = Math.min(state.currentPage * state.itemsPerPage, state.filteredVendors.length);

    // Update info text
    showingStart.textContent = state.filteredVendors.length > 0 ? startIndex : 0;
    showingEnd.textContent = endIndex;
    totalVendors.textContent = state.filteredVendors.length;

    // Update button states
    prevPageBtn.disabled = state.currentPage === 1;
    nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;

    // Render page numbers
    renderPageNumbers(totalPages);
}

/**
 * Render page number buttons
 * @param {number} totalPages - Total number of pages
 */
function renderPageNumbers(totalPages) {
    if (totalPages <= 1) {
        pageNumbersContainer.innerHTML = '';
        return;
    }

    let pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
        pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
        if (state.currentPage <= 3) {
            pageNumbers = [1, 2, 3, 4, '...', totalPages];
        } else if (state.currentPage >= totalPages - 2) {
            pageNumbers = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pageNumbers = [1, '...', state.currentPage - 1, state.currentPage, state.currentPage + 1, '...', totalPages];
        }
    }

    pageNumbersContainer.innerHTML = pageNumbers.map(page => {
        if (page === '...') {
            return '<span class="page-ellipsis">...</span>';
        }
        return `
            <button 
                class="page-number ${page === state.currentPage ? 'active' : ''}" 
                onclick="changePage(${page})"
            >
                ${page}
            </button>
        `;
    }).join('');
}

/**
 * Change to a specific page
 * @param {number} pageNumber - Page number to navigate to
 */
function changePage(pageNumber) {
    const totalPages = Math.ceil(state.filteredVendors.length / state.itemsPerPage);
    
    if (pageNumber < 1 || pageNumber > totalPages) {
        return;
    }

    state.currentPage = pageNumber;
    renderTable();
    updatePagination();

    // Scroll to top of table
    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * View vendor details
 * @param {string} vendorCode - Vendor code to view
 */
async function viewVendor(vendorCode) {
    console.log('Viewing vendor:', vendorCode);
    
    try {
        // Show loading modal
        showVendorDetailsModal({ loading: true });
        
        // Fetch vendor details from API
        const response = await fetch(`${API_ENDPOINTS.VENDOR_MASTER.GET_VENDOR_DETAILS}?vendorCode=${vendorCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Vendor Details Response:', result);
        
        // The response is an array with vendor details
        if (Array.isArray(result) && result.length > 0) {
            // Show vendor details in modal
            showVendorDetailsModal(result[0]);
        } else {
            throw new Error('Failed to fetch vendor details');
        }
    } catch (error) {
        console.error('Error fetching vendor details:', error);
        showVendorDetailsModal({
            error: true,
            message: 'Failed to load vendor details. Please try again.'
        });
    }
}

/**
 * Show vendor details in modal
 * @param {Object} data - Vendor data or loading/error state
 */
function showVendorDetailsModal(data) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.vendor-details-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'vendor-details-modal-overlay';
    
    let modalContent = '';
    
    if (data.loading) {
        modalContent = `
            <div class="vendor-details-modal">
                <div class="modal-loading">
                    <div class="spinner"></div>
                    <p>Loading vendor details...</p>
                </div>
            </div>
        `;
    } else if (data.error) {
        modalContent = `
            <div class="vendor-details-modal">
                <div class="modal-header">
                    <h2>Error</h2>
                    <button class="modal-close-btn" onclick="closeVendorDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="error-message">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#DC3545" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <p>${data.message}</p>
                        <button class="btn-primary" onclick="closeVendorDetailsModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Display vendor details
        const vendor = data;
        
        // Helper function to safely get value
        const getValue = (value) => value || 'N/A';
        
        // Build address string
        const buildAddress = () => {
            const parts = [
                vendor.registered_address_line1,
                vendor.registered_address_line2,
                vendor.registered_city,
                vendor.registered_state,
                vendor.registered_pincode,
                vendor.registered_country
            ].filter(part => part && part.trim());
            return parts.length > 0 ? parts.join(', ') : 'N/A';
        };
        
        // Build billing address string
        const buildBillingAddress = () => {
            const parts = [
                vendor.billing_address_line1,
                vendor.billing_address_line2,
                vendor.billing_city,
                vendor.billing_state,
                vendor.billing_pincode,
                vendor.billing_country
            ].filter(part => part && part.trim());
            return parts.length > 0 ? parts.join(', ') : 'N/A';
        };
        
        modalContent = `
            <div class="vendor-details-modal">
                <div class="modal-header">
                    <h2>Vendor Details</h2>
                    <button class="modal-close-btn" onclick="closeVendorDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Basic Information -->
                    <div class="details-section">
                        <h3>Basic Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Legal Name:</span>
                                <span class="detail-value">${getValue(vendor.legal_name)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Trade Name:</span>
                                <span class="detail-value">${getValue(vendor.trade_name)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Vendor Type:</span>
                                <span class="detail-value">${getValue(vendor.vendor_type)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Category:</span>
                                <span class="detail-value">${getValue(vendor.vendor_category)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value status-badge ${vendor.vendor_status || 'active'}">${getValue(vendor.vendor_status)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Created At:</span>
                                <span class="detail-value">${vendor.created_at ? new Date(vendor.created_at).toLocaleString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contact Information -->
                    <div class="details-section">
                        <h3>Contact Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Contact Person:</span>
                                <span class="detail-value">${getValue(vendor.contact_person)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Designation:</span>
                                <span class="detail-value">${getValue(vendor.designation)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">${getValue(vendor.phone)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Alternate Phone:</span>
                                <span class="detail-value">${getValue(vendor.alternate_phone)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${getValue(vendor.email)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Website:</span>
                                <span class="detail-value">${getValue(vendor.website)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Registered Address -->
                    <div class="details-section">
                        <h3>Registered Address</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Address Line 1:</span>
                                <span class="detail-value">${getValue(vendor.registered_address_line1)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Address Line 2:</span>
                                <span class="detail-value">${getValue(vendor.registered_address_line2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">City:</span>
                                <span class="detail-value">${getValue(vendor.registered_city)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">State:</span>
                                <span class="detail-value">${getValue(vendor.registered_state)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Pincode:</span>
                                <span class="detail-value">${getValue(vendor.registered_pincode)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Country:</span>
                                <span class="detail-value">${getValue(vendor.registered_country)}</span>
                            </div>
                            <div class="detail-item full-width">
                                <span class="detail-label">Full Address:</span>
                                <span class="detail-value">${buildAddress()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Billing Address -->
                    ${(vendor.billing_address_line1 || vendor.billing_city || vendor.billing_state) ? `
                    <div class="details-section">
                        <h3>Billing Address</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Address Line 1:</span>
                                <span class="detail-value">${getValue(vendor.billing_address_line1)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Address Line 2:</span>
                                <span class="detail-value">${getValue(vendor.billing_address_line2)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">City:</span>
                                <span class="detail-value">${getValue(vendor.billing_city)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">State:</span>
                                <span class="detail-value">${getValue(vendor.billing_state)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Pincode:</span>
                                <span class="detail-value">${getValue(vendor.billing_pincode)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Country:</span>
                                <span class="detail-value">${getValue(vendor.billing_country)}</span>
                            </div>
                            <div class="detail-item full-width">
                                <span class="detail-label">Full Address:</span>
                                <span class="detail-value">${buildBillingAddress()}</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Tax Information -->
                    <div class="details-section">
                        <h3>Tax Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">GST Number:</span>
                                <span class="detail-value">${getValue(vendor.gst_number)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">GST Status:</span>
                                <span class="detail-value">${getValue(vendor.gst_status)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">PAN Number:</span>
                                <span class="detail-value">${getValue(vendor.pan_number)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">TAN Number:</span>
                                <span class="detail-value">${getValue(vendor.tan_number)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">MSME Registration:</span>
                                <span class="detail-value">${getValue(vendor.msme_registration)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">MSME Number:</span>
                                <span class="detail-value">${getValue(vendor.msme_number)}</span>
                            </div>
                            <div class="detail-item full-width">
                                <span class="detail-label">HSN/SAC Codes:</span>
                                <span class="detail-value">${getValue(vendor.hsn_sac_codes)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Banking Details -->
                    <div class="details-section">
                        <h3>Banking Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Bank Name:</span>
                                <span class="detail-value">${getValue(vendor.bank_name)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Account Number:</span>
                                <span class="detail-value">${getValue(vendor.account_number)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">IFSC Code:</span>
                                <span class="detail-value">${getValue(vendor.ifsc_code)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Branch Name:</span>
                                <span class="detail-value">${getValue(vendor.branch_name)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Account Type:</span>
                                <span class="detail-value">${getValue(vendor.account_type)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Beneficiary Name:</span>
                                <span class="detail-value">${getValue(vendor.beneficiary_name)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Terms -->
                    <div class="details-section">
                        <h3>Payment Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Payment Terms:</span>
                                <span class="detail-value">${getValue(vendor.payment_terms)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Payment Method:</span>
                                <span class="detail-value">${getValue(vendor.preferred_payment_method)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Credit Limit:</span>
                                <span class="detail-value">${vendor.credit_limit ? '₹' + vendor.credit_limit : 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Currency:</span>
                                <span class="detail-value">${getValue(vendor.currency)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Information -->
                    ${vendor.remarks || vendor.market_pricing ? `
                    <div class="details-section">
                        <h3>Additional Information</h3>
                        <div class="details-grid">
                            ${vendor.market_pricing ? `
                            <div class="detail-item full-width">
                                <span class="detail-label">Market Pricing:</span>
                                <span class="detail-value">${getValue(vendor.market_pricing)}</span>
                            </div>
                            ` : ''}
                            ${vendor.remarks ? `
                            <div class="detail-item full-width">
                                <span class="detail-label">Remarks:</span>
                                <span class="detail-value">${getValue(vendor.remarks)}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Created By Information -->
                    ${vendor.created_by ? `
                    <div class="details-section">
                        <h3>Record Information</h3>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Created By:</span>
                                <span class="detail-value">${getValue(vendor.created_by)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Created At:</span>
                                <span class="detail-value">${vendor.created_at ? new Date(vendor.created_at).toLocaleString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeVendorDetailsModal()">Close</button>
                    <button class="btn-primary" onclick="editVendor('${vendor._id}'); closeVendorDetailsModal();">Edit Vendor</button>
                </div>
            </div>
        `;
    }
    
    modalOverlay.innerHTML = modalContent;
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeVendorDetailsModal();
        }
    });
    
    document.body.appendChild(modalOverlay);
    
    // Add modal-open class to body for blur effect
    document.body.classList.add('modal-open');
}

/**
 * Close vendor details modal
 */
function closeVendorDetailsModal() {
    const modal = document.querySelector('.vendor-details-modal-overlay');
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // Remove modal-open class from body to remove blur effect
    document.body.classList.remove('modal-open');
}

/**
 * Edit vendor details
 * @param {string} vendorCode - Vendor code to edit
 */
function editVendor(vendorCode) {
    console.log('Editing vendor:', vendorCode);
    // Redirect to edit vendor page with vendor code as URL parameter
    window.location.href = `edit-vendor.html?vendorCode=${encodeURIComponent(vendorCode)}`;
}

/**
 * Show loading state in table
 */
function showLoadingState() {
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0B74B0; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: #6C757D;">Loading vendors...</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#DC3545" stroke-width="2" style="margin-bottom: 1rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    <p style="color: #DC3545; font-weight: 600; margin-bottom: 0.5rem;">${message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0B74B0; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                </td>
            </tr>
        `;
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);

// Export functions for global access
window.changePage = changePage;
window.viewVendor = viewVendor;
window.editVendor = editVendor;
window.closeVendorDetailsModal = closeVendorDetailsModal;

