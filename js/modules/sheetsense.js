/**
 * SheetSense Module Controller
 * Manages trial balance processing and GL account validation
 */

import { FileUploader } from '../features/file-uploader.js';
import glValidator from '../features/gl-validator.js';
import { SheetSenseAPI } from '../core/api.js';
import { validateSpreadsheetFile } from '../utils/validation.js';
import { formatCurrency } from '../utils/formatters.js';
import app from '../core/app.js';

/**
 * SheetSense Controller class
 */
class SheetSenseController {
    constructor() {
        this.fileUploader = null;
        this.currentTrialBalance = null;
        this.glAccounts = [];
    }

    /**
     * Initialize SheetSense module
     */
    async init() {
        console.log('Initializing SheetSense module...');
        
        this.setupFileUploader();
        this.setupEventListeners();
        this.loadGLMasterData();
    }

    /**
     * Setup file uploader
     */
    setupFileUploader() {
        const uploaderContainer = document.querySelector('[data-tb-uploader]');
        if (!uploaderContainer) return;

        this.fileUploader = new FileUploader(uploaderContainer, {
            accept: '.xlsx,.xls,.csv',
            maxFiles: 1,
            hint: 'Supported formats: Excel, CSV (Max 10MB)',
            validator: validateSpreadsheetFile,
            onUpload: async (file, onProgress) => {
                return await this.processTrialBalance(file, onProgress);
            },
            onError: (error) => {
                app.showNotification(error.message, 'error');
            },
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Validate GL button
        const validateBtn = document.querySelector('[data-validate-gl]');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => this.validateGLAccounts());
        }

        // Generate report button
        const reportBtn = document.querySelector('[data-generate-report]');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.generateReport());
        }
    }

    /**
     * Process trial balance file
     * @param {File} file - Trial balance file
     * @param {Function} onProgress - Progress callback
     */
    async processTrialBalance(file, onProgress) {
        try {
            app.showLoading('Processing trial balance...');
            onProgress(30);

            const result = await SheetSenseAPI.processTrialBalance(file);
            onProgress(70);

            this.currentTrialBalance = {
                file,
                accounts: result.accounts || [],
                totalDebit: result.total_debit || 0,
                totalCredit: result.total_credit || 0,
                balanced: result.balanced || false,
                uploadedAt: new Date(),
            };

            onProgress(100);
            app.hideLoading();

            this.displayTrialBalance(this.currentTrialBalance);
            app.showNotification('Trial balance processed successfully', 'success');
            
            return this.currentTrialBalance;
        } catch (error) {
            app.hideLoading();
            console.error('Trial balance processing error:', error);
            throw new Error('Failed to process trial balance: ' + error.message);
        }
    }

    /**
     * Display trial balance
     * @param {Object} trialBalance - Trial balance data
     */
    displayTrialBalance(trialBalance) {
        const container = document.querySelector('[data-tb-details]');
        if (!container) return;

        container.innerHTML = `
            <div class="tb-details">
                <div class="tb-details__header">
                    <h2>Trial Balance</h2>
                    <span class="badge badge--${trialBalance.balanced ? 'success' : 'error'}">
                        ${trialBalance.balanced ? 'Balanced' : 'Not Balanced'}
                    </span>
                </div>

                <div class="tb-details__summary">
                    <div class="tb-summary-card">
                        <label>Total Debit</label>
                        <p class="tb-summary-card__value">${formatCurrency(trialBalance.totalDebit)}</p>
                    </div>
                    <div class="tb-summary-card">
                        <label>Total Credit</label>
                        <p class="tb-summary-card__value">${formatCurrency(trialBalance.totalCredit)}</p>
                    </div>
                    <div class="tb-summary-card">
                        <label>Accounts</label>
                        <p class="tb-summary-card__value">${trialBalance.accounts.length}</p>
                    </div>
                </div>

                ${this.renderAccountsTable(trialBalance.accounts)}

                <div class="tb-details__actions">
                    <button class="btn btn--primary" data-validate-gl>Validate GL Accounts</button>
                    <button class="btn btn--secondary" data-generate-report>Generate Report</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Render accounts table
     * @param {Array} accounts - GL accounts
     * @returns {string} HTML string
     */
    renderAccountsTable(accounts) {
        if (!accounts || accounts.length === 0) {
            return '<p>No accounts found</p>';
        }

        return `
            <div class="tb-details__table">
                <table class="tb-table">
                    <thead>
                        <tr>
                            <th>Account Code</th>
                            <th>Account Name</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${accounts.slice(0, 50).map(account => `
                            <tr>
                                <td>${account.code}</td>
                                <td>${account.name}</td>
                                <td>${formatCurrency(account.debit || 0)}</td>
                                <td>${formatCurrency(account.credit || 0)}</td>
                                <td>${formatCurrency((account.debit || 0) - (account.credit || 0))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${accounts.length > 50 ? `<p class="tb-table__note">Showing first 50 of ${accounts.length} accounts</p>` : ''}
            </div>
        `;
    }

    /**
     * Validate GL accounts
     */
    async validateGLAccounts() {
        if (!this.currentTrialBalance) {
            app.showNotification('No trial balance to validate', 'warning');
            return;
        }

        try {
            app.showLoading('Validating GL accounts...');
            const result = await glValidator.validateGLAccounts(this.currentTrialBalance.accounts);
            app.hideLoading();

            if (result.valid) {
                app.showNotification(`All ${result.validCount} accounts validated successfully`, 'success');
            } else {
                app.showNotification(`${result.invalidCount} invalid accounts found`, 'warning');
            }
        } catch (error) {
            app.hideLoading();
            app.showNotification('Validation failed', 'error');
        }
    }

    /**
     * Generate report
     */
    async generateReport() {
        if (!this.currentTrialBalance) {
            app.showNotification('No trial balance data available', 'warning');
            return;
        }

        try {
            app.showLoading('Generating report...');
            const report = await SheetSenseAPI.generateReport({
                trialBalance: this.currentTrialBalance,
                format: 'pdf',
            });
            app.hideLoading();

            app.showNotification('Report generated successfully', 'success');
            // Handle report download
        } catch (error) {
            app.hideLoading();
            app.showNotification('Report generation failed', 'error');
        }
    }

    /**
     * Load GL master data
     */
    async loadGLMasterData() {
        try {
            await glValidator.loadGLMasterData();
            console.log('GL master data loaded');
        } catch (error) {
            console.error('Failed to load GL master data:', error);
        }
    }
}

const sheetSenseController = new SheetSenseController();
export default sheetSenseController;
