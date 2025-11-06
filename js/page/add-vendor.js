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
        const response = await fetch(API_ENDPOINTS.VENDOR_MASTER.ADD_VENDOR, {
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
        
        if (result.success) {
            // Show success notification
            showNotification('success', {
                title: 'Vendor Added Successfully!',
                message: 'The vendor has been added to the database.',
                vendorCode: result.data && result.data.vendor_code ? result.data.vendor_code : null,
                onConfirm: () => {
                    window.location.href = 'vendor-database.html';
                }
            });
        } else {
            throw new Error(result.message || 'Failed to add vendor');
        }
    } catch (error) {
        console.error('Error adding vendor:', error);
        
        // More detailed error message
        let errorMessage = '';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your network connection or try again later.';
        } else if (error.message.includes('HTTP error')) {
            errorMessage = 'Server error occurred. Please contact support if the issue persists.';
        } else {
            errorMessage = error.message;
        }
        
        // Show error notification
        showNotification('error', {
            title: 'Failed to Add Vendor',
            message: errorMessage,
            onConfirm: () => {
                // Just close the notification
            }
        });
        
        // Re-enable submit button
        const submitBtn = event.target.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.textContent = 'Add Vendor';
            submitBtn.disabled = false;
        }
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
 * Show notification popup
 */
function showNotification(type, options) {
    const { title, message, vendorCode, onConfirm } = options;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    
    // Success or error icon SVG
    const successIcon = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    `;
    
    const errorIcon = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
    `;
    
    const icon = type === 'success' ? successIcon : errorIcon;
    
    // Create notification HTML
    overlay.innerHTML = `
        <div class="notification-popup ${type}">
            <div class="notification-icon ${type}">
                ${icon}
            </div>
            <h3 class="notification-title">${title}</h3>
            <p class="notification-message">${message}</p>
            ${vendorCode ? `<div class="notification-vendor-code">Vendor Code: ${vendorCode}</div>` : ''}
            <div class="notification-actions">
                <button class="notification-btn primary" data-action="confirm">
                    ${type === 'success' ? 'Go to Vendor Database' : 'Close'}
                </button>
                ${type === 'success' ? '<button class="notification-btn secondary" data-action="add-another">Add Another Vendor</button>' : ''}
            </div>
        </div>
    `;
    
    // Add event listeners
    const confirmBtn = overlay.querySelector('[data-action="confirm"]');
    const addAnotherBtn = overlay.querySelector('[data-action="add-another"]');
    
    confirmBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
    });
    
    if (addAnotherBtn) {
        addAnotherBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            // Reset form
            const form = document.getElementById('addVendorForm');
            if (form) form.reset();
        });
    }
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            if (type === 'error' && onConfirm) onConfirm();
        }
    });
    
    // Add to page
    document.body.appendChild(overlay);
}
