/**
 * Adani Fintell Suite - Add Purchase Order Page
 * Handles purchase order creation form with line items
 */

'use strict';

// State management
const state = {
    lineItems: [],
    lineItemCounter: 0,
    vendors: [],
    selectedVendor: null,
    vendorsLoaded: false,
    vendorsLoading: false
};

// LocalStorage keys
const VENDORS_STORAGE_KEY = 'adani_fintell_vendors_cache';
const VENDORS_TIMESTAMP_KEY = 'adani_fintell_vendors_timestamp';

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body
    document.body.classList.add('templates-loaded');
    
    // Load vendors
    loadVendors();
    
    // Get form element
    const form = document.getElementById('addPurchaseOrderForm');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Vendor search
    const vendorSearch = document.getElementById('vendorSearch');
    if (vendorSearch) {
        vendorSearch.addEventListener('input', handleVendorSearch);
        vendorSearch.addEventListener('focus', () => {
            if (vendorSearch.value.trim()) {
                handleVendorSearch({ target: vendorSearch });
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const dropdownList = document.getElementById('vendorDropdownList');
        const searchInput = document.getElementById('vendorSearch');
        
        if (dropdownList && searchInput && !searchInput.contains(event.target) && !dropdownList.contains(event.target)) {
            dropdownList.style.display = 'none';
        }
    });
    
    // Add line item button
    const addLineItemBtn = document.querySelector('[data-action="add-line-item"]');
    if (addLineItemBtn) {
        addLineItemBtn.addEventListener('click', addLineItem);
    }
    
    // Add first line item by default
    addLineItem();
    
    // Listen for changes in financial fields
    const financialInputs = ['freightCharges', 'packagingCharges', 'handlingCharges'];
    financialInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateTotals);
        }
    });
    
    // Set default PO date to today
    const poDateInput = document.getElementById('poDate');
    if (poDateInput) {
        poDateInput.valueAsDate = new Date();
    }
});

/**
 * Load vendors from API or cache
 */
async function loadVendors() {
    // Prevent multiple simultaneous loads
    if (state.vendorsLoaded || state.vendorsLoading) {
        console.log('Vendors already loaded or loading, skipping...');
        return;
    }

    console.log('Starting vendor load...');
    state.vendorsLoading = true;

    try {
        // Check if we have cached vendors
        const cachedVendors = getCachedVendors();
        
        if (cachedVendors && cachedVendors.length > 0) {
            state.vendors = cachedVendors;
            console.log('Loaded vendors from cache:', cachedVendors.length);
            state.vendorsLoaded = true;
            return;
        }
        
        // Fetch from API
        console.log('No cache found, fetching vendors from API...');
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
        console.log('API response:', result);
        
        // Handle direct array response or wrapped response
        let vendors = [];
        if (Array.isArray(result)) {
            vendors = result;
        } else if (result.success && result.data && Array.isArray(result.data)) {
            vendors = result.data;
        } else if (result.vendors && Array.isArray(result.vendors)) {
            vendors = result.vendors;
        }
        
        if (vendors.length > 0) {
            state.vendors = vendors;
            cacheVendors(vendors);
            console.log('Loaded vendors from API and cached:', vendors.length);
            state.vendorsLoaded = true;
        } else {
            console.error('No vendors found in API response');
            throw new Error('No vendors found');
        }
    } catch (error) {
        console.error('Error loading vendors:', error);
        state.vendors = [];
        // Don't mark as loaded if there was an error
        state.vendorsLoaded = false;
    } finally {
        state.vendorsLoading = false;
    }
}

/**
 * Cache vendors in localStorage
 */
function cacheVendors(vendors) {
    try {
        localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(vendors));
        localStorage.setItem(VENDORS_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error caching vendors:', error);
    }
}

/**
 * Get cached vendors from localStorage
 */
function getCachedVendors() {
    try {
        const cached = localStorage.getItem(VENDORS_STORAGE_KEY);
        
        if (!cached) {
            return null;
        }
        
        // Return cached data (no expiry for now, can be refreshed manually)
        return JSON.parse(cached);
    } catch (error) {
        console.error('Error reading cached vendors:', error);
        return null;
    }
}

/**
 * Populate vendor dropdown
 */
function populateVendorDropdown(vendorsToShow = null) {
    const dropdownList = document.getElementById('vendorDropdownList');
    if (!dropdownList) return;
    
    const vendors = vendorsToShow || state.vendors;
    
    // Clear existing items
    dropdownList.innerHTML = '';
    
    if (vendors.length === 0) {
        // Show "No vendors found" message
        dropdownList.innerHTML = '<div class="vendor-dropdown-empty">No vendors found</div>';
        dropdownList.style.display = 'block';
    } else {
        // Add vendor items
        vendors.forEach(vendor => {
            const item = document.createElement('div');
            item.className = 'vendor-dropdown-item';
            item.dataset.vendorData = JSON.stringify(vendor);
            
            const displayName = vendor.legal_name || vendor.trade_name || 'Unknown Vendor';
            const gstNumber = vendor.gst_number || 'N/A';
            const city = vendor.registered_city || '';
            const state = vendor.registered_state || '';
            const location = [city, state].filter(Boolean).join(', ') || 'N/A';
            
            item.innerHTML = `
                <div class="vendor-name">${displayName}</div>
                <div class="vendor-details">GST: ${gstNumber} | Location: ${location}</div>
            `;
            
            // Add click handler
            item.addEventListener('click', () => {
                selectVendor(vendor);
            });
            
            dropdownList.appendChild(item);
        });
        
        dropdownList.style.display = 'block';
    }
}

/**
 * Select a vendor from the dropdown
 */
function selectVendor(vendor) {
    state.selectedVendor = vendor;
    
    // Update search input with vendor name
    const searchInput = document.getElementById('vendorSearch');
    if (searchInput) {
        searchInput.value = vendor.legal_name || vendor.trade_name || '';
    }
    
    // Hide dropdown
    const dropdownList = document.getElementById('vendorDropdownList');
    if (dropdownList) {
        dropdownList.style.display = 'none';
    }
    
    // Show and populate vendor details
    document.getElementById('vendorCode').value = vendor._id || '';
    document.getElementById('vendorName').value = vendor.legal_name || vendor.trade_name || '';
    document.getElementById('vendorGstin').value = vendor.gst_number || '';
    
    document.getElementById('vendorCodeDisplay').style.display = 'block';
    document.getElementById('vendorNameDisplay').style.display = 'block';
    document.getElementById('vendorGstDisplay').style.display = 'block';
}

/**
 * Handle vendor search
 */
function handleVendorSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    console.log('=== Vendor Search ===');
    console.log('Search term:', searchTerm);
    console.log('Total vendors available:', state.vendors.length);
    console.log('Vendors loaded:', state.vendorsLoaded);
    console.log('Vendors loading:', state.vendorsLoading);
    
    const dropdownList = document.getElementById('vendorDropdownList');
    
    if (!searchTerm) {
        // Hide dropdown if search is empty
        if (dropdownList) {
            console.log('No search term, hiding dropdown');
            dropdownList.style.display = 'none';
        }
        clearVendorSelection();
        return;
    }
    
    // If vendors aren't loaded yet, try to load them
    if (state.vendors.length === 0 && !state.vendorsLoading) {
        console.log('Vendors not loaded, triggering load...');
        loadVendors();
        // Show a loading message
        if (dropdownList) {
            dropdownList.style.display = 'block';
            dropdownList.innerHTML = '<div class="vendor-dropdown-empty">Loading vendors...</div>';
        }
        return;
    }
    
    // Check if vendors are still loading
    if (state.vendorsLoading) {
        console.log('Vendors are currently loading...');
        if (dropdownList) {
            dropdownList.style.display = 'block';
            dropdownList.innerHTML = '<div class="vendor-dropdown-empty">Loading vendors...</div>';
        }
        return;
    }
    
    // Check if vendors are loaded but empty
    if (state.vendors.length === 0) {
        console.warn('No vendors available in database');
        if (dropdownList) {
            dropdownList.style.display = 'block';
            dropdownList.innerHTML = '<div class="vendor-dropdown-empty">No vendors found in database</div>';
        }
        return;
    }
    
    // Filter vendors based on search term
    const filteredVendors = state.vendors.filter(vendor => {
        const legalName = (vendor.legal_name || '').toLowerCase();
        const tradeName = (vendor.trade_name || '').toLowerCase();
        const vendorId = (vendor._id || '').toLowerCase();
        const gstNumber = (vendor.gst_number || '').toLowerCase();
        const city = (vendor.registered_city || '').toLowerCase();
        const vendorState = (vendor.registered_state || '').toLowerCase();
        
        const matches = legalName.includes(searchTerm) ||
               tradeName.includes(searchTerm) ||
               vendorId.includes(searchTerm) ||
               gstNumber.includes(searchTerm) ||
               city.includes(searchTerm) ||
               vendorState.includes(searchTerm);
               
        return matches;
    });
    
    console.log('Filtered vendors:', filteredVendors.length);
    
    // Update dropdown with filtered results
    populateVendorDropdown(filteredVendors);
    
    // Auto-select if only one result
    if (filteredVendors.length === 1) {
        selectVendor(filteredVendors[0]);
    }
}

/**
 * Clear vendor selection
 */
function clearVendorSelection() {
    document.getElementById('vendorCodeDisplay').style.display = 'none';
    document.getElementById('vendorNameDisplay').style.display = 'none';
    document.getElementById('vendorGstDisplay').style.display = 'none';
    state.selectedVendor = null;
    
    const vendorSelect = document.getElementById('vendorSelect');
    if (vendorSelect) {
        vendorSelect.value = '';
    }
}

/**
 * Handle vendor selection
 */
/**
 * Add a new line item
 */
function addLineItem() {
    state.lineItemCounter++;
    const lineNumber = state.lineItemCounter;
    
    const container = document.getElementById('lineItemsContainer');
    if (!container) return;
    
    const lineItemHTML = `
        <div class="line-item" data-line-number="${lineNumber}">
            <div class="line-item-header">
                <h3 class="line-item-title">Item #${lineNumber}</h3>
                <button type="button" class="btn-remove-item" data-action="remove-line-item" data-line-number="${lineNumber}">
                    Remove
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label for="itemDescription${lineNumber}" class="form-label required">Item Description</label>
                    <input type="text" id="itemDescription${lineNumber}" name="item_description_${lineNumber}" class="form-input" placeholder="Enter item description" required data-line-field="itemDescription">
                </div>
                
                <div class="form-group">
                    <label for="hsnCode${lineNumber}" class="form-label required">HSN Code</label>
                    <input type="text" id="hsnCode${lineNumber}" name="hsn_code_${lineNumber}" class="form-input" placeholder="Enter HSN code" required data-line-field="hsnCode">
                </div>
                
                <div class="form-group">
                    <label for="quantity${lineNumber}" class="form-label required">Quantity</label>
                    <input type="number" id="quantity${lineNumber}" name="quantity_${lineNumber}" class="form-input line-calc" placeholder="0" required min="1" step="1" data-line-field="quantity" data-line-number="${lineNumber}">
                </div>
                
                <div class="form-group">
                    <label for="unitOfMeasurement${lineNumber}" class="form-label required">Unit</label>
                    <input type="text" id="unitOfMeasurement${lineNumber}" name="unit_of_measurement_${lineNumber}" class="form-input" placeholder="e.g., KG, Bags" required data-line-field="unitOfMeasurement">
                </div>
                
                <div class="form-group">
                    <label for="unitPrice${lineNumber}" class="form-label required">Unit Price</label>
                    <input type="number" id="unitPrice${lineNumber}" name="unit_price_${lineNumber}" class="form-input line-calc" placeholder="0.00" required min="0" step="0.01" data-line-field="unitPrice" data-line-number="${lineNumber}">
                </div>
                
                <div class="form-group">
                    <label for="taxRate${lineNumber}" class="form-label required">Tax Rate (%)</label>
                    <select id="taxRate${lineNumber}" name="tax_rate_${lineNumber}" class="form-input line-calc" required data-line-field="taxRate" data-line-number="${lineNumber}">
                        <option value="">Select Rate</option>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18" selected>18%</option>
                        <option value="28">28%</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Line Total</label>
                    <div class="calculated-field" id="lineTotal${lineNumber}">₹0.00</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tax Amount</label>
                    <div class="calculated-field" id="taxAmount${lineNumber}">₹0.00</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Total with Tax</label>
                    <div class="calculated-field total" id="lineTotalWithTax${lineNumber}">₹0.00</div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', lineItemHTML);
    
    // Add event listeners to new line item
    const lineItem = container.querySelector(`[data-line-number="${lineNumber}"]`);
    const removeBtn = lineItem.querySelector('[data-action="remove-line-item"]');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeLineItem(lineNumber));
    }
    
    // Add calculation event listeners
    const calcInputs = lineItem.querySelectorAll('.line-calc');
    calcInputs.forEach(input => {
        input.addEventListener('input', () => calculateLineTotal(lineNumber));
    });
    
    // Add to state
    state.lineItems.push(lineNumber);
}

/**
 * Remove a line item
 */
function removeLineItem(lineNumber) {
    if (state.lineItems.length <= 1) {
        showNotification('At least one line item is required', 'error');
        return;
    }
    
    const lineItem = document.querySelector(`[data-line-number="${lineNumber}"]`);
    if (lineItem) {
        lineItem.remove();
        state.lineItems = state.lineItems.filter(num => num !== lineNumber);
        calculateTotals();
    }
}

/**
 * Calculate line item total
 */
function calculateLineTotal(lineNumber) {
    const quantity = parseFloat(document.getElementById(`quantity${lineNumber}`)?.value || 0);
    const unitPrice = parseFloat(document.getElementById(`unitPrice${lineNumber}`)?.value || 0);
    const taxRate = parseFloat(document.getElementById(`taxRate${lineNumber}`)?.value || 0);
    
    const lineTotal = quantity * unitPrice;
    const taxAmount = (lineTotal * taxRate) / 100;
    const lineTotalWithTax = lineTotal + taxAmount;
    
    // Update display
    const lineTotalEl = document.getElementById(`lineTotal${lineNumber}`);
    const taxAmountEl = document.getElementById(`taxAmount${lineNumber}`);
    const lineTotalWithTaxEl = document.getElementById(`lineTotalWithTax${lineNumber}`);
    
    if (lineTotalEl) lineTotalEl.textContent = `₹${lineTotal.toFixed(2)}`;
    if (taxAmountEl) taxAmountEl.textContent = `₹${taxAmount.toFixed(2)}`;
    if (lineTotalWithTaxEl) lineTotalWithTaxEl.textContent = `₹${lineTotalWithTax.toFixed(2)}`;
    
    // Recalculate grand total
    calculateTotals();
}

/**
 * Calculate overall totals
 */
function calculateTotals() {
    let subtotal = 0;
    let totalTax = 0;
    
    // Sum all line items
    state.lineItems.forEach(lineNumber => {
        const quantity = parseFloat(document.getElementById(`quantity${lineNumber}`)?.value || 0);
        const unitPrice = parseFloat(document.getElementById(`unitPrice${lineNumber}`)?.value || 0);
        const taxRate = parseFloat(document.getElementById(`taxRate${lineNumber}`)?.value || 0);
        
        const lineTotal = quantity * unitPrice;
        const taxAmount = (lineTotal * taxRate) / 100;
        
        subtotal += lineTotal;
        totalTax += taxAmount;
    });
    
    // Get other charges
    const freight = parseFloat(document.getElementById('freightCharges')?.value || 0);
    const packaging = parseFloat(document.getElementById('packagingCharges')?.value || 0);
    const handling = parseFloat(document.getElementById('handlingCharges')?.value || 0);
    const otherCharges = freight + packaging + handling;
    
    // Calculate grand total
    const grandTotal = subtotal + totalTax + otherCharges;
    
    // Update display
    const displaySubtotal = document.getElementById('displaySubtotal');
    const displayTotalTax = document.getElementById('displayTotalTax');
    const displayOtherCharges = document.getElementById('displayOtherCharges');
    const displayGrandTotal = document.getElementById('displayGrandTotal');
    
    if (displaySubtotal) displaySubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    if (displayTotalTax) displayTotalTax.textContent = `₹${totalTax.toFixed(2)}`;
    if (displayOtherCharges) displayOtherCharges.textContent = `₹${otherCharges.toFixed(2)}`;
    if (displayGrandTotal) displayGrandTotal.textContent = `₹${grandTotal.toFixed(2)}`;
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (state.lineItems.length === 0) {
        showNotification('Please add at least one line item', 'error');
        return;
    }
    
    if (!state.selectedVendor) {
        showNotification('Please select a vendor', 'error');
        return;
    }
    
    try {
        // Collect line items data
        const lineItems = state.lineItems.map((lineNumber, index) => {
            const quantity = parseFloat(document.getElementById(`quantity${lineNumber}`)?.value || 0);
            const unitPrice = parseFloat(document.getElementById(`unitPrice${lineNumber}`)?.value || 0);
            const taxRate = parseFloat(document.getElementById(`taxRate${lineNumber}`)?.value || 0);
            const lineTotal = quantity * unitPrice;
            const taxAmount = (lineTotal * taxRate) / 100;
            
            return {
                line_number: index + 1,
                item_description: document.getElementById(`itemDescription${lineNumber}`)?.value || '',
                hsn_code: document.getElementById(`hsnCode${lineNumber}`)?.value || '',
                quantity: quantity,
                unit_of_measurement: document.getElementById(`unitOfMeasurement${lineNumber}`)?.value || '',
                unit_price: unitPrice,
                line_total: lineTotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                line_total_with_tax: lineTotal + taxAmount
            };
        });
        
        // Calculate totals
        const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
        const totalTaxAmount = lineItems.reduce((sum, item) => sum + item.tax_amount, 0);
        const freight = parseFloat(document.getElementById('freightCharges')?.value || 0);
        const packaging = parseFloat(document.getElementById('packagingCharges')?.value || 0);
        const handling = parseFloat(document.getElementById('handlingCharges')?.value || 0);
        const totalOtherCharges = freight + packaging + handling;
        const grandTotal = subtotal + totalTaxAmount + totalOtherCharges;
        
        // Build PO data object (without po_number - it will be auto-generated)
        const poData = {
            po_date: document.getElementById('poDate')?.value,
            po_status: document.getElementById('poStatus')?.value,
            
            vendor_reference: {
                vendor_code: state.selectedVendor._id,
                vendor_name: state.selectedVendor.legal_name || state.selectedVendor.trade_name,
                vendor_gst_number: state.selectedVendor.gst_number
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
            
            line_items: lineItems,
            
            financial_summary: {
                subtotal: subtotal,
                total_tax_amount: totalTaxAmount,
                other_charges: {
                    freight: freight,
                    packaging_charges: packaging,
                    handling_charges: handling
                },
                total_other_charges: totalOtherCharges,
                grand_total: grandTotal,
                currency: 'INR'
            },
            
            payment_terms: {
                payment_cycle: document.getElementById('paymentCycle')?.value,
                advance_payment: parseFloat(document.getElementById('advancePayment')?.value || 0),
                retention_percentage: parseFloat(document.getElementById('retentionPercentage')?.value || 0)
            },
            
            approval_workflow: {
                requester: {
                    name: document.getElementById('requesterName')?.value,
                    department: document.getElementById('requesterDepartment')?.value,
                    employee_id: document.getElementById('requesterEmployeeId')?.value
                },
                approver: {
                    name: document.getElementById('approverName')?.value || '',
                    designation: document.getElementById('approverDesignation')?.value || '',
                    employee_id: document.getElementById('approverEmployeeId')?.value || ''
                }
            },
            
            budget_allocation: {
                cost_center: document.getElementById('costCenter')?.value || '',
                project_code: document.getElementById('projectCode')?.value || '',
                budget_code: document.getElementById('budgetCode')?.value || ''
            },
            
            contract_reference: {
                has_contract: document.getElementById('hasContract')?.value === 'true',
                contract_number: document.getElementById('contractNumber')?.value || '',
                contract_valid_until: document.getElementById('contractValidUntil')?.value || ''
            },
            
            metadata: {
                notes: document.getElementById('notes')?.value || ''
            }
        };
        
        console.log('Submitting Purchase Order:', poData);
        
        // Submit to API
        const response = await fetch(API_ENDPOINTS.PURCHASE_ORDER.ADD_PURCHASE_ORDER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(poData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Purchase Order created successfully! PO Number: ${result.po_number || result.po_id || ''}`, 'success');
            setTimeout(() => {
                window.location.href = 'purchase-order-database.html';
            }, 2000);
        } else {
            showNotification(`Error: ${result.error || 'Failed to create purchase order'}`, 'error');
        }
    } catch (error) {
        console.error('Error submitting purchase order:', error);
        showNotification('Failed to submit purchase order. Please try again.', 'error');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
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
