/**
 * Adani Fintell Suite - Edit Purchase Order Page
 * Handles purchase order editing form
 */

'use strict';

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body
    document.body.classList.add('templates-loaded');
    
    // Load PO data from URL parameter or session storage
    loadPurchaseOrderData();
    
    // Get form element
    const form = document.getElementById('editPurchaseOrderForm');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

/**
 * Load purchase order data
 */
function loadPurchaseOrderData() {
    // Get PO ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const poId = urlParams.get('id');
    
    // For demo purposes, use mock data even without ID parameter
    // In production, fetch from API using the poId
    const mockPO = {
        po_id: poId || "PO-2024-001",
        po_number: "PO/24/001",
        po_date: "2024-01-15",
        vendor_name: "ABC Suppliers Ltd",
        vendor_gstin: "27AABCU9603R1ZX",
        vendor_contact: "9876543210",
        status: "Pending"
    };
    
    // Fill form with data
    document.getElementById('poId').value = mockPO.po_id;
    document.getElementById('poNumber').value = mockPO.po_number;
    document.getElementById('poDate').value = mockPO.po_date;
    document.getElementById('vendorName').value = mockPO.vendor_name;
    document.getElementById('vendorGstin').value = mockPO.vendor_gstin;
    document.getElementById('vendorContact').value = mockPO.vendor_contact;
    document.getElementById('status').value = mockPO.status;
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const poData = {};
    
    formData.forEach((value, key) => {
        poData[key] = value;
    });
    
    // Add user info
    poData.updated_by = 'Current User'; // Get from session
    
    console.log('Updating Purchase Order:', poData);
    
    try {
        // Submit to API
        const response = await fetch(API_ENDPOINTS.PURCHASE_ORDER.UPDATE_PURCHASE_ORDER, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(poData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Purchase Order updated successfully!');
            window.location.href = 'purchase-order-database.html';
        } else {
            alert(`Error: ${result.error || 'Failed to update purchase order'}`);
        }
    } catch (error) {
        console.error('Error updating purchase order:', error);
        alert('Failed to update purchase order. Please try again.');
    }
}
