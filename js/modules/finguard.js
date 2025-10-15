/**
 * FinGuard Module Controller
 * Manages invoice OCR, GST validation, and compliance monitoring
 */

import { FileUploader } from '../features/file-uploader.js';
import ocrProcessor from '../features/ocr-processor.js';
import gstValidator from '../features/gst-validator.js';
import anomalyDetector from '../features/anomaly-detector.js';
import { validateInvoiceFile } from '../utils/validation.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import app from '../core/app.js';

/**
 * FinGuard Controller class
 */
class FinGuardController {
    constructor() {
        this.fileUploader = null;
        this.currentInvoice = null;
        this.invoices = [];
    }

    /**
     * Initialize FinGuard module
     */
    async init() {
        console.log('Initializing FinGuard module...');
        
        this.setupFileUploader();
        this.setupEventListeners();
        this.loadRecentInvoices();
    }

    /**
     * Setup file uploader
     */
    setupFileUploader() {
        const uploaderContainer = document.querySelector('[data-invoice-uploader]');
        if (!uploaderContainer) return;

        this.fileUploader = new FileUploader(uploaderContainer, {
            accept: 'image/*,.pdf',
            maxFiles: 1,
            hint: 'Supported formats: PDF, JPG, PNG (Max 10MB)',
            validator: validateInvoiceFile,
            onUpload: async (file, onProgress) => {
                return await this.processInvoice(file, onProgress);
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
        // GST validation button
        const validateGSTBtn = document.querySelector('[data-validate-gst]');
        if (validateGSTBtn) {
            validateGSTBtn.addEventListener('click', () => this.validateGST());
        }

        // Check duplicate button
        const checkDuplicateBtn = document.querySelector('[data-check-duplicate]');
        if (checkDuplicateBtn) {
            checkDuplicateBtn.addEventListener('click', () => this.checkDuplicate());
        }

        // Approve invoice button
        const approveBtn = document.querySelector('[data-approve-invoice]');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => this.approveInvoice());
        }

        // Reject invoice button
        const rejectBtn = document.querySelector('[data-reject-invoice]');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this.rejectInvoice());
        }

        // Filter controls
        const filterForm = document.querySelector('[data-filter-form]');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }
    }

    /**
     * Process invoice with OCR
     * @param {File} file - Invoice file
     * @param {Function} onProgress - Progress callback
     */
    async processInvoice(file, onProgress) {
        try {
            app.showLoading('Processing invoice with OCR...');
            onProgress(30);

            // Extract data using OCR
            const invoiceData = await ocrProcessor.processInvoice(file);
            onProgress(60);

            // Detect anomalies
            const anomalyResult = await anomalyDetector.detectAnomalies(invoiceData);
            onProgress(80);

            // Combine results
            this.currentInvoice = {
                ...invoiceData,
                anomalies: anomalyResult,
                file,
                status: 'pending',
                uploadedAt: new Date(),
            };

            onProgress(100);
            app.hideLoading();

            // Display invoice details
            this.displayInvoiceDetails(this.currentInvoice);
            
            app.showNotification('Invoice processed successfully', 'success');
            return this.currentInvoice;
        } catch (error) {
            app.hideLoading();
            console.error('Invoice processing error:', error);
            throw new Error('Failed to process invoice: ' + error.message);
        }
    }

    /**
     * Display invoice details
     * @param {Object} invoice - Invoice data
     */
    displayInvoiceDetails(invoice) {
        const detailsContainer = document.querySelector('[data-invoice-details]');
        if (!detailsContainer) return;

        detailsContainer.innerHTML = `
            <div class="invoice-details">
                <div class="invoice-details__header">
                    <h2>Invoice Details</h2>
                    <span class="badge badge--${invoice.anomalies.riskLevel.toLowerCase()}" style="background-color: ${invoice.anomalies.riskColor}">
                        Risk: ${invoice.anomalies.riskLevel}
                    </span>
                </div>

                <div class="invoice-details__grid">
                    <div class="invoice-details__field">
                        <label>Invoice Number</label>
                        <p>${invoice.invoiceNumber || 'N/A'}</p>
                    </div>
                    <div class="invoice-details__field">
                        <label>Invoice Date</label>
                        <p>${formatDate(invoice.invoiceDate)}</p>
                    </div>
                    <div class="invoice-details__field">
                        <label>Vendor Name</label>
                        <p>${invoice.vendorName || 'N/A'}</p>
                    </div>
                    <div class="invoice-details__field">
                        <label>Vendor GST</label>
                        <p>${invoice.vendorGST || 'N/A'}</p>
                    </div>
                    <div class="invoice-details__field">
                        <label>Total Amount</label>
                        <p class="invoice-details__amount">${formatCurrency(invoice.totalAmount)}</p>
                    </div>
                    <div class="invoice-details__field">
                        <label>Tax Amount</label>
                        <p>${formatCurrency(invoice.taxAmount)}</p>
                    </div>
                </div>

                ${this.renderLineItems(invoice.lineItems)}
                ${this.renderAnomalies(invoice.anomalies)}

                <div class="invoice-details__actions">
                    <button class="btn btn--primary" data-approve-invoice>Approve</button>
                    <button class="btn btn--secondary" data-reject-invoice>Reject</button>
                    <button class="btn btn--outline" data-validate-gst>Validate GST</button>
                    <button class="btn btn--outline" data-check-duplicate>Check Duplicate</button>
                </div>
            </div>
        `;

        // Reattach event listeners for new buttons
        this.setupEventListeners();
    }

    /**
     * Render line items table
     * @param {Array} lineItems - Line items
     * @returns {string} HTML string
     */
    renderLineItems(lineItems) {
        if (!lineItems || lineItems.length === 0) {
            return '<p>No line items found</p>';
        }

        return `
            <div class="invoice-details__section">
                <h3>Line Items</h3>
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>HSN/SAC</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>Tax Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lineItems.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.hsnSac}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.rate)}</td>
                                <td>${formatCurrency(item.amount)}</td>
                                <td>${item.taxRate}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render anomalies section
     * @param {Object} anomaliesResult - Anomalies detection result
     * @returns {string} HTML string
     */
    renderAnomalies(anomaliesResult) {
        if (!anomaliesResult.hasAnomalies) {
            return `
                <div class="invoice-details__section">
                    <h3>Compliance Check</h3>
                    <p class="text-success">✓ No anomalies detected</p>
                </div>
            `;
        }

        return `
            <div class="invoice-details__section">
                <h3>Detected Anomalies</h3>
                <div class="anomalies-list">
                    ${anomaliesResult.anomalies.map(anomaly => `
                        <div class="anomaly-item anomaly-item--${anomaly.severity}">
                            <span class="anomaly-item__type">${anomaly.type.toUpperCase()}</span>
                            <p class="anomaly-item__message">${anomaly.message}</p>
                            ${anomaly.details ? `<p class="anomaly-item__details">${anomaly.details}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                <p class="anomaly-recommendation"><strong>Recommendation:</strong> ${anomaliesResult.recommendation}</p>
            </div>
        `;
    }

    /**
     * Validate GST number
     */
    async validateGST() {
        if (!this.currentInvoice || !this.currentInvoice.vendorGST) {
            app.showNotification('No vendor GST number available', 'warning');
            return;
        }

        try {
            app.showLoading('Validating GST number...');
            const result = await gstValidator.validateWithAPI(this.currentInvoice.vendorGST);
            app.hideLoading();

            if (result.valid) {
                app.showNotification(`GST verified: ${result.businessName}`, 'success');
            } else {
                app.showNotification(result.error, 'error');
            }
        } catch (error) {
            app.hideLoading();
            app.showNotification('GST validation failed', 'error');
        }
    }

    /**
     * Check for duplicate invoices
     */
    async checkDuplicate() {
        if (!this.currentInvoice) {
            app.showNotification('No invoice to check', 'warning');
            return;
        }

        try {
            app.showLoading('Checking for duplicates...');
            const result = await anomalyDetector.checkDuplicate(
                this.currentInvoice.invoiceNumber,
                this.currentInvoice.vendorGST
            );
            app.hideLoading();

            if (result.isDuplicate) {
                app.showNotification(`Potential duplicate found (${result.matchPercentage}% match)`, 'warning');
            } else {
                app.showNotification('No duplicates found', 'success');
            }
        } catch (error) {
            app.hideLoading();
            app.showNotification('Duplicate check failed', 'error');
        }
    }

    /**
     * Approve invoice
     */
    approveInvoice() {
        if (!this.currentInvoice) return;

        this.currentInvoice.status = 'approved';
        this.invoices.push(this.currentInvoice);
        app.showNotification('Invoice approved successfully', 'success');
        
        // Reset for next invoice
        this.currentInvoice = null;
        if (this.fileUploader) {
            this.fileUploader.clear();
        }
        
        const detailsContainer = document.querySelector('[data-invoice-details]');
        if (detailsContainer) {
            detailsContainer.innerHTML = '<p>Upload an invoice to begin processing</p>';
        }
    }

    /**
     * Reject invoice
     */
    rejectInvoice() {
        if (!this.currentInvoice) return;

        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        this.currentInvoice.status = 'rejected';
        this.currentInvoice.rejectionReason = reason;
        this.invoices.push(this.currentInvoice);
        
        app.showNotification('Invoice rejected', 'info');
        
        // Reset for next invoice
        this.currentInvoice = null;
        if (this.fileUploader) {
            this.fileUploader.clear();
        }
        
        const detailsContainer = document.querySelector('[data-invoice-details]');
        if (detailsContainer) {
            detailsContainer.innerHTML = '<p>Upload an invoice to begin processing</p>';
        }
    }

    /**
     * Load recent invoices
     */
    async loadRecentInvoices() {
        // This would typically load from API
        console.log('Loading recent invoices...');
    }

    /**
     * Apply filters
     */
    applyFilters() {
        console.log('Applying filters...');
        // Implement filter logic
    }

    /**
     * Get current invoice
     * @returns {Object|null} Current invoice
     */
    getCurrentInvoice() {
        return this.currentInvoice;
    }
}

// Create singleton instance
const finGuardController = new FinGuardController();

export default finGuardController;
