/**
 * Adani Fintell Suite - Add Vendor Page
 * Handles vendor registration form
 */

'use strict';

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body
    document.body.classList.add('templates-loaded');
    
    // Get form element
    const form = document.getElementById('addVendorForm');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }
    
    // Add real-time validation for GST and PAN
    setupValidation();
});

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

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const vendorData = {};
    
    formData.forEach((value, key) => {
        vendorData[key] = value;
    });
    
    // Add timestamp
    vendorData.created_at = new Date().toISOString();
    vendorData.created_by = 'Current User'; // Get from session
    
    // Log the data (for testing)
    console.log('Vendor Data:', vendorData);
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Adding Vendor...';
        submitBtn.disabled = true;
        
        // Submit to API
        const response = await fetch(API_ENDPOINTS.VENDOR.ADD_VENDOR, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendorData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            showSuccessMessage();
            
            // Reset form after delay
            setTimeout(() => {
                window.location.href = 'vendor-database.html';
            }, 2000);
        } else {
            throw new Error(result.message || 'Failed to add vendor');
        }
    } catch (error) {
        console.error('Error adding vendor:', error);
        alert('Error adding vendor: ' + error.message);
        
        // Re-enable submit button
        const submitBtn = event.target.querySelector('.btn-submit');
        submitBtn.textContent = 'Add Vendor';
        submitBtn.disabled = false;
    }
}

/**
 * Handle cancel button
 */
function handleCancel() {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        window.location.href = 'vendor-database.html';
    }
}

/**
 * Show success message
 */
function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>Vendor Added Successfully!</h3>
            <p>Redirecting to vendor database...</p>
        </div>
    `;
    
    document.body.appendChild(successDiv);
}
