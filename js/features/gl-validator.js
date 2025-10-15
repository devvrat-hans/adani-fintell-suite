/**
 * GL Validator
 * Validates GL accounts for SheetSense module
 */

import { SheetSenseAPI } from '../core/api.js';

/**
 * GL Validator class
 */
export class GLValidator {
    constructor() {
        this.validating = false;
        this.glMasterData = null;
    }

    /**
     * Load GL master data
     * @returns {Promise<void>}
     */
    async loadGLMasterData() {
        if (this.glMasterData) {
            return;
        }

        try {
            // This would typically load from an API
            this.glMasterData = {
                accounts: [],
                loaded: true,
            };
        } catch (error) {
            console.error('Error loading GL master data:', error);
            throw error;
        }
    }

    /**
     * Validate GL accounts
     * @param {Array} glAccounts - GL accounts to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateGLAccounts(glAccounts) {
        this.validating = true;

        try {
            const result = await SheetSenseAPI.validateGL(glAccounts);
            this.validating = false;
            return this.parseValidationResult(result);
        } catch (error) {
            this.validating = false;
            console.error('GL validation error:', error);
            throw error;
        }
    }

    /**
     * Parse validation result
     * @param {Object} result - API result
     * @returns {Object} Parsed result
     */
    parseValidationResult(result) {
        const validAccounts = [];
        const invalidAccounts = [];
        const warnings = [];

        result.accounts.forEach(account => {
            if (account.valid) {
                validAccounts.push(account);
            } else {
                invalidAccounts.push(account);
            }

            if (account.warnings && account.warnings.length > 0) {
                warnings.push(...account.warnings);
            }
        });

        return {
            valid: invalidAccounts.length === 0,
            validCount: validAccounts.length,
            invalidCount: invalidAccounts.length,
            warningCount: warnings.length,
            validAccounts,
            invalidAccounts,
            warnings,
        };
    }

    /**
     * Check if validating
     * @returns {boolean} Validation status
     */
    isValidating() {
        return this.validating;
    }
}

export default new GLValidator();
