/**
 * Adani-Fintell-Suite - FinGuard AI
 * Validation Module
 * Handles arithmetical accuracy checks and other validations
 */

'use strict';

/**
 * Check arithmetical accuracy of invoice
 * Verifies that line items add up to subtotal and taxes add up correctly
 * @param {Object} invoiceData - Extracted invoice data
 * @returns {Object} - Accuracy check result {accurate: boolean, errors: array}
 */
export async function checkArithmeticalAccuracy(invoiceData) {
    try {
        console.log('Checking arithmetical accuracy...');
        
        const errors = [];
        let accurate = true;
        
        // Helper function to parse amount (removes commas and converts to number)
        const parseAmount = (amount) => {
            if (amount === null || amount === undefined || amount === '') return 0;
            return parseFloat(String(amount).replace(/,/g, ''));
        };
        
        // 1. Check if line items add up to subtotal
        if (invoiceData.line_items && Array.isArray(invoiceData.line_items)) {
            let calculatedSubtotal = 0;
            
            invoiceData.line_items.forEach((item, index) => {
                const quantity = parseAmount(item.quantity);
                const rate = parseAmount(item.rate);
                const amount = parseAmount(item.amount);
                const expectedAmount = quantity * rate;
                
                // Check if individual line item calculation is correct
                if (Math.abs(expectedAmount - amount) > 0.01) {
                    errors.push(`Line item ${index + 1}: Expected amount ${expectedAmount.toFixed(2)} but got ${amount.toFixed(2)}`);
                    accurate = false;
                }
                
                calculatedSubtotal += amount;
            });
            
            const givenSubtotal = parseAmount(invoiceData.subtotal);
            
            // Check if calculated subtotal matches given subtotal (allow 1 rupee tolerance for rounding)
            if (Math.abs(calculatedSubtotal - givenSubtotal) > 1) {
                errors.push(`Subtotal mismatch: Line items sum to ${calculatedSubtotal.toFixed(2)} but subtotal is ${givenSubtotal.toFixed(2)}`);
                accurate = false;
            }
        }
        
        // 2. Check if subtotal + taxes = invoice amount
        const subtotal = parseAmount(invoiceData.subtotal);
        const cgst = parseAmount(invoiceData.cgst_amount);
        const sgst = parseAmount(invoiceData.sgst_amount);
        const igst = parseAmount(invoiceData.igst_amount);
        const invoiceAmount = parseAmount(invoiceData.invoice_amount);
        
        const calculatedTotal = subtotal + cgst + sgst + igst;
        
        // Check if calculated total matches invoice amount (allow 1 rupee tolerance for rounding)
        if (Math.abs(calculatedTotal - invoiceAmount) > 1) {
            errors.push(`Invoice total mismatch: Subtotal + taxes = ${calculatedTotal.toFixed(2)} but invoice amount is ${invoiceAmount.toFixed(2)}`);
            accurate = false;
        }
        
        return { accurate, errors };
        
    } catch (error) {
        console.error('Error checking arithmetical accuracy:', error);
        return { accurate: false, errors: ['Unable to perform arithmetic check'] };
    }
}
