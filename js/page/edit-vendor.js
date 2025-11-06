/**
 * Adani Fintell Suite - Edit Vendor Page
 * Handles vendor search and update functionality
 */

'use strict';

// ==========================================================================
// State Management
// ==========================================================================

let currentVendorData = null;
let searchTimeout = null;

// ==========================================================================
// DOM Elements
// ==========================================================================

const searchInput = document.querySelector('[data-vendor-search]');
const searchBtn = document.querySelector('[data-search-trigger]');
const searchResults = document.querySelector('[data-search-results]');
const formSection = document.getElementById('formSection');
const editForm = document.getElementById('editVendorForm');
const cancelBtn = document.getElementById('cancelBtn');

// ==========================================================================
// Initialize
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body
    document.body.classList.add('templates-loaded');
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup validation
    setupValidation();
    
    // Check if vendorCode is provided in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const vendorCode = urlParams.get('vendorCode');
    
    if (vendorCode) {
        // Automatically load vendor details if vendorCode is in URL
        loadVendorDetails(vendorCode);
    }
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input - real-time search
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        
        // Keep search results open when clicking on search input
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 1 && searchResults.innerHTML !== '') {
                searchResults.hidden = false;
            }
        });
    }
    
    // Search button
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Form submission
    if (editForm) {
        editForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }
    
    // Same as registered address checkbox
    const sameAsRegistered = document.getElementById('sameAsRegistered');
    if (sameAsRegistered) {
        sameAsRegistered.addEventListener('change', handleSameAsRegistered);
    }
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && 
            !searchResults.contains(e.target) && 
            !searchBtn.contains(e.target)) {
            hideSearchResults();
        }
    });
}

/**
 * Handle search input with debounce
 */
function handleSearchInput(event) {
    const query = event.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Hide results if query is too short
    if (query.length < 1) {
        hideSearchResults();
        return;
    }
    
    // Debounce search - show suggestions after 300ms
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

/**
 * Perform vendor search
 */
async function performSearch(query) {
    const searchQuery = query || searchInput.value.trim();
    
    if (!searchQuery || searchQuery.length < 1) {
        hideSearchResults();
        return;
    }
    
    try {
        // Show loading state
        showSearchLoading();
        
        // Fetch all vendors
        const response = await fetch(API_ENDPOINTS.VENDOR_MASTER.FETCH_VENDORS, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const vendors = await response.json();
        
        // Filter vendors based on search query
        const filteredVendors = filterVendors(vendors, searchQuery);
        
        // Display results
        displaySearchResults(filteredVendors);
        
        // Reset search button
        resetSearchButton();
        
    } catch (error) {
        console.error('Error searching vendors:', error);
        showSearchError();
    }
}

/**
 * Reset search button to original state
 */
function resetSearchButton() {
    if (searchBtn) {
        searchBtn.disabled = false;
        if (searchBtn.dataset.originalHtml) {
            searchBtn.innerHTML = searchBtn.dataset.originalHtml;
        } else {
            searchBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                Search
            `;
        }
    }
}

/**
 * Filter vendors based on search query
 */
function filterVendors(vendors, query) {
    const lowerQuery = query.toLowerCase();
    
    return vendors.filter(vendor => {
        // Basic Information
        const legalName = (vendor.legal_name || '').toLowerCase();
        const tradeName = (vendor.trade_name || '').toLowerCase();
        const vendorCode = (vendor.vendor_code || '').toLowerCase();
        const vendorType = (vendor.vendor_type || '').toLowerCase();
        const vendorCategory = (vendor.vendor_category || '').toLowerCase();
        
        // Contact Information
        const contactPerson = (vendor.contact_person || '').toLowerCase();
        const phone = (vendor.phone || '').toLowerCase();
        const email = (vendor.email || '').toLowerCase();
        
        // Address Information
        const city = (vendor.registered_city || '').toLowerCase();
        const state = (vendor.registered_state || '').toLowerCase();
        const pincode = (vendor.registered_pincode || '').toLowerCase();
        
        // Tax Information
        const gstNumber = (vendor.gst_number || '').toLowerCase();
        const panNumber = (vendor.pan_number || '').toLowerCase();
        
        // Banking Information
        const bankName = (vendor.bank_name || '').toLowerCase();
        const accountNumber = (vendor.account_number || '').toLowerCase();
        const ifscCode = (vendor.ifsc_code || '').toLowerCase();
        
        // Status
        const vendorStatus = (vendor.vendor_status || '').toLowerCase();
        
        return legalName.includes(lowerQuery) || 
               tradeName.includes(lowerQuery) || 
               vendorCode.includes(lowerQuery) ||
               vendorType.includes(lowerQuery) ||
               vendorCategory.includes(lowerQuery) ||
               contactPerson.includes(lowerQuery) ||
               phone.includes(lowerQuery) ||
               email.includes(lowerQuery) ||
               city.includes(lowerQuery) ||
               state.includes(lowerQuery) ||
               pincode.includes(lowerQuery) ||
               gstNumber.includes(lowerQuery) ||
               panNumber.includes(lowerQuery) ||
               bankName.includes(lowerQuery) ||
               accountNumber.includes(lowerQuery) ||
               ifscCode.includes(lowerQuery) ||
               vendorStatus.includes(lowerQuery);
    });
}

/**
 * Display search results
 */
function displaySearchResults(vendors) {
    if (!searchResults) {
        console.error('Search results element not found');
        return;
    }
    
    // Limit results to top 10 for better UX
    const limitedVendors = vendors.slice(0, 10);
    
    if (limitedVendors.length === 0) {
        searchResults.innerHTML = `
            <div class="no-results">
                <p>No vendors found matching your search.</p>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                    Search by: Name, GST Number, PAN, Email, Phone, City, State, Bank Name, or IFSC Code
                </p>
            </div>
        `;
        searchResults.removeAttribute('hidden');
        return;
    }
    
    const resultsHTML = limitedVendors.map(vendor => `
        <div class="search-result-item" data-vendor-id="${vendor._id || ''}" data-vendor-code="${vendor.vendor_code || ''}">
            <div class="search-result-header">
                <span class="vendor-name">${vendor.legal_name || 'N/A'}</span>
            </div>
            <div class="vendor-details">
                ${vendor.gst_number ? `
                    <span class="vendor-detail-item">
                        <strong>GST:</strong> ${vendor.gst_number}
                    </span>
                ` : ''}
                ${vendor.pan_number ? `
                    <span class="vendor-detail-item">
                        <strong>PAN:</strong> ${vendor.pan_number}
                    </span>
                ` : ''}
                ${vendor.phone ? `
                    <span class="vendor-detail-item">
                        <strong>Phone:</strong> ${vendor.phone}
                    </span>
                ` : ''}
                ${vendor.email ? `
                    <span class="vendor-detail-item">
                        <strong>Email:</strong> ${vendor.email}
                    </span>
                ` : ''}
                ${vendor.registered_city || vendor.registered_state ? `
                    <span class="vendor-detail-item">
                        <strong>Location:</strong> ${vendor.registered_city || ''}${vendor.registered_city && vendor.registered_state ? ', ' : ''}${vendor.registered_state || ''}
                    </span>
                ` : ''}
                <span class="vendor-detail-item">
                    <strong>Status:</strong> ${formatVendorStatus(vendor.vendor_status)}
                </span>
            </div>
        </div>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
    searchResults.removeAttribute('hidden');
    
    console.log('Search results displayed:', limitedVendors.length, 'vendors');
    
    // Add click handlers to results
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('click', () => {
            const vendorId = item.dataset.vendorId;
            const vendorCode = item.dataset.vendorCode;
            
            console.log('Search result clicked:', { vendorId, vendorCode });
            
            // Use vendorCode if available, otherwise use vendorId
            const codeToUse = vendorCode || vendorId;
            
            if (codeToUse) {
                loadVendorDetails(codeToUse);
            } else {
                console.error('No vendor code or ID found');
                showNotification('error', {
                    title: 'Error',
                    message: 'Unable to load vendor details. Vendor code not found.',
                    onConfirm: () => {}
                });
            }
        });
    });
}

/**
 * Show search loading state
 */
function showSearchLoading() {
    if (!searchResults) return;
    
    searchResults.innerHTML = `
        <div class="search-loading">
            <p>Searching vendors...</p>
        </div>
    `;
    searchResults.removeAttribute('hidden');
    
    if (searchBtn) {
        searchBtn.disabled = true;
        const originalHTML = searchBtn.innerHTML;
        searchBtn.innerHTML = 'Searching...';
        searchBtn.dataset.originalHtml = originalHTML;
    }
}

/**
 * Show search error
 */
function showSearchError() {
    if (!searchResults) return;
    
    searchResults.innerHTML = `
        <div class="no-results">
            <p>Error loading vendors. Please try again.</p>
        </div>
    `;
    searchResults.removeAttribute('hidden');
    
    if (searchBtn) {
        searchBtn.disabled = false;
        if (searchBtn.dataset.originalHtml) {
            searchBtn.innerHTML = searchBtn.dataset.originalHtml;
        } else {
            searchBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                Search
            `;
        }
    }
}

/**
 * Hide search results
 */
function hideSearchResults() {
    if (searchResults) {
        searchResults.setAttribute('hidden', 'true');
        searchResults.innerHTML = '';
    }
}

/**
 * Load vendor details
 */
async function loadVendorDetails(vendorCode) {
    if (!vendorCode) {
        console.error('No vendor code provided');
        return;
    }
    
    console.log('Loading vendor details for:', vendorCode);
    
    try {
        // Fetch vendor details
        const response = await fetch(`${API_ENDPOINTS.VENDOR_MASTER.GET_VENDOR_DETAILS}?vendorCode=${vendorCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const vendorData = await response.json();
        console.log('Vendor data received:', vendorData);
        
        // Check if vendor data is an array and get first item
        const vendor = Array.isArray(vendorData) ? vendorData[0] : vendorData;
        
        if (!vendor) {
            throw new Error('Vendor not found');
        }
        
        // Store current vendor data
        currentVendorData = vendor;
        
        // Update search input with vendor name
        if (searchInput) {
            searchInput.value = vendor.legal_name || '';
        }
        
        // Populate form
        populateForm(vendor);
        
        // Hide search results and show form
        hideSearchResults();
        
        // Show the form section
        if (formSection) {
            formSection.removeAttribute('hidden');
            
            // Scroll to form
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        console.log('Vendor details loaded successfully');
        
    } catch (error) {
        console.error('Error loading vendor details:', error);
        showNotification('error', {
            title: 'Error Loading Vendor',
            message: 'Failed to load vendor details. Please try again.',
            onConfirm: () => {}
        });
    }
}

/**
 * Populate form with vendor data
 */
function populateForm(vendor) {
    // Hidden vendor code - use vendor_code if available, otherwise use _id
    const vendorCodeValue = vendor.vendor_code || vendor._id || '';
    document.getElementById('vendorCode').value = vendorCodeValue;
    
    console.log('Setting vendor code:', vendorCodeValue);
    
    // Vendor Information
    document.getElementById('legalName').value = vendor.legal_name || '';
    document.getElementById('tradeName').value = vendor.trade_name || '';
    document.getElementById('vendorType').value = vendor.vendor_type || '';
    document.getElementById('vendorCategory').value = vendor.vendor_category || '';
    
    // Contact Details
    document.getElementById('contactPerson').value = vendor.contact_person || '';
    document.getElementById('designation').value = vendor.designation || '';
    document.getElementById('phone').value = vendor.phone || '';
    document.getElementById('alternatePhone').value = vendor.alternate_phone || '';
    document.getElementById('email').value = vendor.email || '';
    document.getElementById('website').value = vendor.website || '';
    
    // Registered Address
    document.getElementById('registeredAddress1').value = vendor.registered_address_line1 || '';
    document.getElementById('registeredAddress2').value = vendor.registered_address_line2 || '';
    document.getElementById('registeredCity').value = vendor.registered_city || '';
    document.getElementById('registeredState').value = vendor.registered_state || '';
    document.getElementById('registeredPincode').value = vendor.registered_pincode || '';
    document.getElementById('registeredCountry').value = vendor.registered_country || 'India';
    
    // Billing Address
    document.getElementById('billingAddress1').value = vendor.billing_address_line1 || '';
    document.getElementById('billingAddress2').value = vendor.billing_address_line2 || '';
    document.getElementById('billingCity').value = vendor.billing_city || '';
    document.getElementById('billingState').value = vendor.billing_state || '';
    document.getElementById('billingPincode').value = vendor.billing_pincode || '';
    document.getElementById('billingCountry').value = vendor.billing_country || 'India';
    
    // GST & Tax Details
    document.getElementById('gstNumber').value = vendor.gst_number || '';
    document.getElementById('gstStatus').value = vendor.gst_status || '';
    document.getElementById('panNumber').value = vendor.pan_number || '';
    document.getElementById('tanNumber').value = vendor.tan_number || '';
    document.getElementById('msmeRegistration').value = vendor.msme_registration || '';
    document.getElementById('msmeNumber').value = vendor.msme_number || '';
    
    // Business Classification
    document.getElementById('hsnSacCodes').value = vendor.hsn_sac_codes || '';
    
    // Banking Details
    document.getElementById('bankName').value = vendor.bank_name || '';
    document.getElementById('accountNumber').value = vendor.account_number || '';
    document.getElementById('ifscCode').value = vendor.ifsc_code || '';
    document.getElementById('branchName').value = vendor.branch_name || '';
    document.getElementById('accountType').value = vendor.account_type || '';
    document.getElementById('beneficiaryName').value = vendor.beneficiary_name || '';
    
    // Payment Terms
    document.getElementById('paymentTerms').value = vendor.payment_terms || '';
    document.getElementById('preferredPaymentMethod').value = vendor.preferred_payment_method || '';
    document.getElementById('creditLimit').value = vendor.credit_limit || '';
    document.getElementById('currency').value = vendor.currency || 'INR';
    document.getElementById('vendorStatus').value = vendor.vendor_status || '';
    
    // Additional Information
    document.getElementById('marketPricing').value = vendor.market_pricing || '';
    document.getElementById('remarks').value = vendor.remarks || '';
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!currentVendorData) {
        showNotification('error', {
            title: 'Error',
            message: 'No vendor selected for update.',
            onConfirm: () => {}
        });
        return;
    }
    
    // Get form data
    const formData = new FormData(event.target);
    const vendorData = {};
    
    formData.forEach((value, key) => {
        vendorData[key] = value;
    });
    
    // Add vendor code
    vendorData.vendor_code = document.getElementById('vendorCode').value;
    
    // Log the data (for testing)
    console.log('Updated Vendor Data:', vendorData);
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Updating Vendor...';
        submitBtn.disabled = true;
        
        // Submit to API
        const response = await fetch(API_ENDPOINTS.VENDOR_MASTER.UPDATE_VENDOR, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendorData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('Update API Response:', result);
        
        // Handle different response formats
        let isSuccess = false;
        let message = '';
        let vendorCode = vendorData.vendor_code;
        
        // Check for success in different formats
        if (result.success === true || result.success === 'true') {
            isSuccess = true;
            message = result.message || 'Vendor updated successfully';
        } else if (result.status === 'success' || result.updated === true) {
            isSuccess = true;
            message = result.message || 'Vendor updated successfully';
        } else if (!result.error && !result.success) {
            // If no explicit success or error field, assume success if no error
            isSuccess = true;
            message = 'Vendor updated successfully';
        }
        
        if (isSuccess) {
            // Show success notification
            showNotification('success', {
                title: 'Vendor Updated Successfully!',
                message: message,
                vendorCode: vendorCode,
                onConfirm: () => {
                    window.location.href = 'vendor-database.html';
                }
            });
        } else {
            throw new Error(result.message || result.error || 'Failed to update vendor');
        }
    } catch (error) {
        console.error('Error updating vendor:', error);
        
        // Reset submit button
        const submitBtn = event.target.querySelector('.btn-submit');
        submitBtn.textContent = 'Update Vendor';
        submitBtn.disabled = false;
        
        // Show error notification
        showNotification('error', {
            title: 'Update Failed',
            message: error.message || 'Failed to update vendor. Please try again.',
            onConfirm: () => {}
        });
    }
}

/**
 * Handle cancel button
 */
function handleCancel() {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        window.location.href = 'vendor-database.html';
    }
}

/**
 * Handle same as registered address checkbox
 */
function handleSameAsRegistered(event) {
    const billingFields = document.getElementById('billingAddressFields');
    
    if (event.target.checked) {
        // Copy registered address to billing address
        document.getElementById('billingAddress1').value = document.getElementById('registeredAddress1').value;
        document.getElementById('billingAddress2').value = document.getElementById('registeredAddress2').value;
        document.getElementById('billingCity').value = document.getElementById('registeredCity').value;
        document.getElementById('billingState').value = document.getElementById('registeredState').value;
        document.getElementById('billingPincode').value = document.getElementById('registeredPincode').value;
        document.getElementById('billingCountry').value = document.getElementById('registeredCountry').value;
        
        // Disable billing fields
        billingFields.querySelectorAll('input').forEach(input => {
            input.disabled = true;
        });
    } else {
        // Enable billing fields
        billingFields.querySelectorAll('input').forEach(input => {
            input.disabled = false;
        });
    }
}

/**
 * Setup real-time validation
 */
function setupValidation() {
    const gstInput = document.getElementById('gstNumber');
    const panInput = document.getElementById('panNumber');
    const ifscInput = document.getElementById('ifscCode');
    
    // GST validation
    if (gstInput) {
        gstInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        gstInput.addEventListener('blur', validateGST);
    }
    
    // PAN validation
    if (panInput) {
        panInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        panInput.addEventListener('blur', validatePAN);
    }
    
    // IFSC validation
    if (ifscInput) {
        ifscInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

/**
 * Validate GST number format
 */
function validateGST(event) {
    const gstNumber = event.target.value;
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (gstNumber && !gstPattern.test(gstNumber)) {
        event.target.setCustomValidity('Invalid GST format. Format: 22AAAAA0000A1Z5');
    } else {
        event.target.setCustomValidity('');
    }
}

/**
 * Validate PAN number format
 */
function validatePAN(event) {
    const panNumber = event.target.value;
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    
    if (panNumber && !panPattern.test(panNumber)) {
        event.target.setCustomValidity('Invalid PAN format. Format: AAAAA9999A');
    } else {
        event.target.setCustomValidity('');
    }
}

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Format vendor type for display
 */
function formatVendorType(type) {
    const types = {
        'goods_supplier': 'Goods Supplier',
        'service_provider': 'Service Provider',
        'contractor': 'Contractor',
        'manufacturer': 'Manufacturer',
        'distributor': 'Distributor',
        'utilities': 'Utilities'
    };
    return types[type] || type || 'N/A';
}

/**
 * Format vendor category for display
 */
function formatVendorCategory(category) {
    const categories = {
        'raw_materials': 'Raw Materials',
        'equipment': 'Equipment',
        'services': 'Services',
        'utilities': 'Utilities',
        'logistics': 'Logistics',
        'it_services': 'IT Services',
        'consulting': 'Consulting',
        'construction': 'Construction',
        'maintenance': 'Maintenance'
    };
    return categories[category] || category || 'N/A';
}

/**
 * Format vendor status for display
 */
function formatVendorStatus(status) {
    const statuses = {
        'active': 'Active',
        'pending': 'Pending Approval',
        'inactive': 'Inactive',
        'blocked': 'Blocked'
    };
    return statuses[status] || status || 'N/A';
}

/**
 * Show notification popup
 */
function showNotification(type, options) {
    const { title, message, vendorCode, onConfirm } = options;
    
    // Remove existing notification
    closeNotification();
    
    // Create notification HTML
    const notificationHTML = `
        <div class="notification-overlay" id="notificationOverlay">
            <div class="notification-popup ${type}">
                <div class="notification-icon ${type}">
                    ${type === 'success' ? `
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    ` : type === 'error' ? `
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    ` : `
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    `}
                </div>
                <h3 class="notification-title">${title}</h3>
                <p class="notification-message">${message}</p>
                ${vendorCode ? `<div class="notification-vendor-code">Vendor Code: ${vendorCode}</div>` : ''}
                <div class="notification-actions">
                    <button class="notification-btn primary" id="notificationConfirm">OK</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', notificationHTML);
    
    // Add event listener
    const confirmBtn = document.getElementById('notificationConfirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            closeNotification();
            if (onConfirm) onConfirm();
        });
    }
}

/**
 * Close notification popup
 */
function closeNotification() {
    const overlay = document.getElementById('notificationOverlay');
    if (overlay) {
        overlay.remove();
    }
}
