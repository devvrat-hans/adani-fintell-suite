/**
 * OCR Processor
 * Handles document processing and OCR via Gemini AI
 */

import { FinGuardAPI } from '../core/api.js';

/**
 * OCR Processor class
 */
export class OCRProcessor {
    constructor() {
        this.processing = false;
    }

    /**
     * Process invoice with OCR
     * @param {File} file - Invoice file
     * @returns {Promise<Object>} Extracted data
     */
    async processInvoice(file) {
        if (this.processing) {
            throw new Error('Processing already in progress');
        }

        this.processing = true;

        try {
            const result = await FinGuardAPI.processInvoice(file);
            this.processing = false;
            return this.parseInvoiceData(result);
        } catch (error) {
            this.processing = false;
            throw error;
        }
    }

    /**
     * Parse invoice data from API response
     * @param {Object} response - API response
     * @returns {Object} Parsed invoice data
     */
    parseInvoiceData(response) {
        return {
            invoiceNumber: response.invoice_number || '',
            invoiceDate: response.invoice_date || '',
            vendorName: response.vendor_name || '',
            vendorGST: response.vendor_gst || '',
            buyerName: response.buyer_name || '',
            buyerGST: response.buyer_gst || '',
            totalAmount: parseFloat(response.total_amount) || 0,
            taxAmount: parseFloat(response.tax_amount) || 0,
            lineItems: this.parseLineItems(response.line_items || []),
            confidence: parseFloat(response.confidence) || 0,
            rawData: response,
        };
    }

    /**
     * Parse line items
     * @param {Array} items - Raw line items
     * @returns {Array} Parsed line items
     */
    parseLineItems(items) {
        return items.map((item, index) => ({
            id: index + 1,
            description: item.description || '',
            hsnSac: item.hsn_sac || '',
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            amount: parseFloat(item.amount) || 0,
            taxRate: parseFloat(item.tax_rate) || 0,
        }));
    }

    /**
     * Get processing status
     * @returns {boolean} Processing status
     */
    isProcessing() {
        return this.processing;
    }
}

export default new OCRProcessor();
