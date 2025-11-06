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
async function loadPurchaseOrderData() {
    // Get PO ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const poId = urlParams.get('po_id') || urlParams.get('id');
    
    if (!poId) {
        showNotification('No purchase order ID provided', 'error');
        setTimeout(() => {
            window.location.href = 'purchase-order-database.html';
        }, 2000);
        return;
    }
    
    try {
        // Show loading state
        showNotification('Loading purchase order...', 'info');
        
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
            populateForm(result.data);
            showNotification('Purchase order loaded successfully', 'success');
        } else {
            showNotification('Failed to load purchase order', 'error');
            setTimeout(() => {
                window.location.href = 'purchase-order-database.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading purchase order:', error);
        showNotification('Error loading purchase order', 'error');
        setTimeout(() => {
            window.location.href = 'purchase-order-database.html';
        }, 2000);
    }
}

/**
 * Populate form with PO data
 */
function populateForm(poData) {
    // Basic PO Information
    if (document.getElementById('poId')) {
        document.getElementById('poId').value = poData.po_id || '';
    }
    if (document.getElementById('poNumber')) {
        document.getElementById('poNumber').value = poData.po_number || '';
    }
    if (document.getElementById('poDate')) {
        document.getElementById('poDate').value = poData.po_date || '';
    }
    if (document.getElementById('poStatus')) {
        document.getElementById('poStatus').value = poData.po_status || '';
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
    
    // Notes
    if (document.getElementById('notes')) {
        document.getElementById('notes').value = poData.metadata?.notes || '';
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
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        // Build update data object
        const updateData = {
            po_id: document.getElementById('poId')?.value,
            po_number: document.getElementById('poNumber')?.value,
            po_date: document.getElementById('poDate')?.value,
            po_status: document.getElementById('poStatus')?.value,
            
            vendor_reference: {
                vendor_code: document.getElementById('vendorCode')?.value,
                vendor_name: document.getElementById('vendorName')?.value,
                vendor_gst_number: document.getElementById('vendorGstin')?.value
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
            setTimeout(() => {
                window.location.href = 'purchase-order-database.html';
            }, 1500);
        } else {
            showNotification(`Error: ${result.error || 'Failed to update purchase order'}`, 'error');
        }
    } catch (error) {
        console.error('Error updating purchase order:', error);
        showNotification('Failed to update purchase order. Please try again.', 'error');
    }
}
