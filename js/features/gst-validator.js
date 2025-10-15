/**
 * GST Validator
 * Real-time GST number validation
 */

import { FinGuardAPI } from '../core/api.js';
import { validateGSTNumber } from '../utils/validation.js';
import { debounce } from '../utils/helpers.js';

/**
 * GST Validator class
 */
export class GSTValidator {
    constructor() {
        this.cache = new Map();
        this.validating = false;
    }

    /**
     * Validate GST number format
     * @param {string} gstNumber - GST number
     * @returns {Object} Validation result
     */
    validateFormat(gstNumber) {
        const isValid = validateGSTNumber(gstNumber);
        return {
            valid: isValid,
            error: isValid ? null : 'Invalid GST number format',
        };
    }

    /**
     * Validate GST number with government API
     * @param {string} gstNumber - GST number
     * @returns {Promise<Object>} Validation result
     */
    async validateWithAPI(gstNumber) {
        // Check format first
        const formatCheck = this.validateFormat(gstNumber);
        if (!formatCheck.valid) {
            return formatCheck;
        }

        // Check cache
        if (this.cache.has(gstNumber)) {
            return this.cache.get(gstNumber);
        }

        this.validating = true;

        try {
            const result = await FinGuardAPI.validateGST(gstNumber);
            
            const validation = {
                valid: result.valid,
                businessName: result.business_name || '',
                registrationDate: result.registration_date || '',
                status: result.status || '',
                error: result.valid ? null : 'GST number not found or inactive',
            };

            // Cache result
            this.cache.set(gstNumber, validation);
            
            this.validating = false;
            return validation;
        } catch (error) {
            this.validating = false;
            return {
                valid: false,
                error: 'Failed to validate GST number: ' + error.message,
            };
        }
    }

    /**
     * Create debounced validator
     * @param {number} delay - Debounce delay
     * @returns {Function} Debounced validator
     */
    createDebouncedValidator(delay = 500) {
        return debounce((gstNumber, callback) => {
            this.validateWithAPI(gstNumber).then(callback);
        }, delay);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get validation status
     * @returns {boolean} Validation status
     */
    isValidating() {
        return this.validating;
    }
}

export default new GSTValidator();
