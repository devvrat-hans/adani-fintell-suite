/**
 * Adani Fintell Suite - Add Purchase Order Page
 * Handles purchase order creation form
 */

'use strict';

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body
    document.body.classList.add('templates-loaded');
    
    // Get form element
    const form = document.getElementById('addPurchaseOrderForm');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

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
    poData.created_by = 'Current User'; // Get from session
    
    // Log the data (for testing)
    console.log('Purchase Order Data:', poData);
    
    try {
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
            alert('Purchase Order created successfully!');
            // Redirect to PO database page
            window.location.href = 'purchase-order-database.html';
        } else {
            alert(`Error: ${result.error || 'Failed to create purchase order'}`);
        }
    } catch (error) {
        console.error('Error submitting purchase order:', error);
        alert('Failed to submit purchase order. Please try again.');
    }
}
