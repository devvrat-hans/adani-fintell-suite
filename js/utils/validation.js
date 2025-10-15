/**
 * Validation Utilities
 * Form and data validation functions for Adani-Fintell-Suite
 */

import { GST_PATTERN, PAN_PATTERN, FILE_UPLOAD } from './constants.js';

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
export const validateEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
};

/**
 * Validate GST number format
 * @param {string} gstNumber - GST number to validate
 * @returns {boolean} Validation result
 */
export const validateGSTNumber = (gstNumber) => {
    if (!gstNumber) return false;
    return GST_PATTERN.test(gstNumber.trim().toUpperCase());
};

/**
 * Validate PAN number format
 * @param {string} panNumber - PAN number to validate
 * @returns {boolean} Validation result
 */
export const validatePANNumber = (panNumber) => {
    if (!panNumber) return false;
    return PAN_PATTERN.test(panNumber.trim().toUpperCase());
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Validation result
 */
export const validatePhone = (phone) => {
    const pattern = /^[6-9]\d{9}$/;
    return pattern.test(phone.replace(/\s+/g, ''));
};

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @returns {boolean} Validation result
 */
export const validateRequired = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Validation result
 */
export const validateRange = (value, min, max) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate date format and range
 * @param {string} dateString - Date string to validate
 * @param {string} format - Expected format
 * @returns {boolean} Validation result
 */
export const validateDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {Object} Validation result with error message
 */
export const validateFileType = (file, allowedTypes) => {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
        };
    }
    
    return { valid: true, error: null };
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum size in bytes
 * @returns {Object} Validation result with error message
 */
export const validateFileSize = (file, maxSize = FILE_UPLOAD.MAX_SIZE) => {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }
    
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
        return { 
            valid: false, 
            error: `File size exceeds ${maxSizeMB}MB limit` 
        };
    }
    
    return { valid: true, error: null };
};

/**
 * Validate invoice file
 * @param {File} file - File to validate
 * @returns {Object} Validation result with error message
 */
export const validateInvoiceFile = (file) => {
    const typeValidation = validateFileType(file, FILE_UPLOAD.ALLOWED_TYPES.INVOICE);
    if (!typeValidation.valid) return typeValidation;
    
    return validateFileSize(file);
};

/**
 * Validate spreadsheet file
 * @param {File} file - File to validate
 * @returns {Object} Validation result with error message
 */
export const validateSpreadsheetFile = (file) => {
    const typeValidation = validateFileType(file, FILE_UPLOAD.ALLOWED_TYPES.SPREADSHEET);
    if (!typeValidation.valid) return typeValidation;
    
    return validateFileSize(file);
};

/**
 * Validate amount
 * @param {string|number} amount - Amount to validate
 * @returns {Object} Validation result with error message
 */
export const validateAmount = (amount) => {
    const num = parseFloat(amount);
    
    if (isNaN(num)) {
        return { valid: false, error: 'Invalid amount format' };
    }
    
    if (num < 0) {
        return { valid: false, error: 'Amount cannot be negative' };
    }
    
    if (num === 0) {
        return { valid: false, error: 'Amount cannot be zero' };
    }
    
    // Check decimal places (max 2)
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
        return { valid: false, error: 'Amount can have maximum 2 decimal places' };
    }
    
    return { valid: true, error: null };
};

/**
 * Validate HSN/SAC code
 * @param {string} code - HSN/SAC code to validate
 * @returns {Object} Validation result with error message
 */
export const validateHSNSAC = (code) => {
    if (!code || code.trim().length === 0) {
        return { valid: false, error: 'HSN/SAC code is required' };
    }
    
    const trimmedCode = code.trim();
    
    // HSN: 4, 6, or 8 digits
    // SAC: 6 digits
    const pattern = /^\d{4}$|^\d{6}$|^\d{8}$/;
    
    if (!pattern.test(trimmedCode)) {
        return { 
            valid: false, 
            error: 'HSN/SAC code must be 4, 6, or 8 digits' 
        };
    }
    
    return { valid: true, error: null };
};

/**
 * Validate invoice number
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {Object} Validation result with error message
 */
export const validateInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber || invoiceNumber.trim().length === 0) {
        return { valid: false, error: 'Invoice number is required' };
    }
    
    const trimmed = invoiceNumber.trim();
    
    if (trimmed.length < 3 || trimmed.length > 50) {
        return { 
            valid: false, 
            error: 'Invoice number must be between 3 and 50 characters' 
        };
    }
    
    return { valid: true, error: null };
};

/**
 * Validate form data
 * @param {Object} formData - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result with errors
 */
export const validateForm = (formData, rules) => {
    const errors = {};
    let isValid = true;
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        
        if (rule.required && !validateRequired(value)) {
            errors[field] = rule.requiredMessage || `${field} is required`;
            isValid = false;
            continue;
        }
        
        if (rule.validator && value) {
            const result = rule.validator(value);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
            }
        }
    }
    
    return { isValid, errors };
};

/**
 * Show validation error on input field
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
export const showInputError = (input, message) => {
    input.classList.add('input--error');
    input.setAttribute('aria-invalid', 'true');
    
    // Remove existing error message
    const existingError = input.parentElement.querySelector('.input__error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('span');
    errorElement.className = 'input__error';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    input.parentElement.appendChild(errorElement);
};

/**
 * Clear validation error from input field
 * @param {HTMLElement} input - Input element
 */
export const clearInputError = (input) => {
    input.classList.remove('input--error');
    input.removeAttribute('aria-invalid');
    
    const errorElement = input.parentElement.querySelector('.input__error');
    if (errorElement) {
        errorElement.remove();
    }
};
