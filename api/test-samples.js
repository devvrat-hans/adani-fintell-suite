/**
 * Adani-Fintell-Suite - FinGuard API Test Samples
 * Sample requests for testing FinGuard endpoints
 */

'use strict';

// ==========================================================================
// Base Configuration
// ==========================================================================

const BASE_URL = 'https://n8n-n8n.j8euv3.easypanel.host';

// ==========================================================================
// Sample Invoice Data
// ==========================================================================

const sampleInvoiceData = {
    invoice_number: "CONS-2025-789",
    invoice_date: "October 12, 2025",
    invoice_amount: "188800",
    vendor_gstin: "07AADCB3456H1ZP",
    vendor_name: "ABC Consultancy Services Pvt Ltd",
    company_gstin: "27AAACP1234M1Z1",
    hsn_sac_codes: ["998314"],
    line_items: [
        {
            description: "Financial Consulting",
            hsn_sac: "998314",
            quantity: "40",
            rate: "2500",
            amount: "100000"
        },
        {
            description: "Tax Advisory",
            hsn_sac: "998314",
            quantity: "20",
            rate: "3000",
            amount: "60000"
        }
    ],
    subtotal: "160000",
    cgst_amount: "14400",
    sgst_amount: "14400",
    igst_amount: null,
    gst_rate: null
};

// ==========================================================================
// 1. Detect Duplicate Endpoint
// ==========================================================================

/**
 * Test detect duplicate endpoint
 */
async function testDetectDuplicate() {
    const endpoint = `${BASE_URL}/webhook/f/finguard/detect-duplicate`;
    
    const requestBody = {
        invoice_number: sampleInvoiceData.invoice_number,
        invoice_date: sampleInvoiceData.invoice_date,
        invoice_amount: sampleInvoiceData.invoice_amount,
        vendor_gstin: sampleInvoiceData.vendor_gstin,
        company_gstin: sampleInvoiceData.company_gstin,
        hsn_sac_codes: sampleInvoiceData.hsn_sac_codes,
        line_items: sampleInvoiceData.line_items,
        subtotal: sampleInvoiceData.subtotal,
        cgst_amount: sampleInvoiceData.cgst_amount,
        sgst_amount: sampleInvoiceData.sgst_amount,
        igst_amount: sampleInvoiceData.igst_amount,
        gst_rate: sampleInvoiceData.gst_rate
    };
    
    console.log('='.repeat(60));
    console.log('Testing: Detect Duplicate Endpoint');
    console.log('='.repeat(60));
    console.log('Endpoint:', endpoint);
    console.log('Method: POST');
    console.log('\nRequest Body:');
    console.log(JSON.stringify(requestBody, null, 2));
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('\nResponse Status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('\nResponse Body:');
        console.log(JSON.stringify(data, null, 2));
        
        return data;
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    }
}

// ==========================================================================
// 2. Validate GST Endpoint
// ==========================================================================

/**
 * Test validate GST endpoint
 */
async function testValidateGST() {
    const endpoint = `${BASE_URL}/webhook/f/finguard/validate-gst`;
    
    const requestBody = {
        vendor_gstin: sampleInvoiceData.vendor_gstin,
        vendor_name: sampleInvoiceData.vendor_name,
        company_gstin: sampleInvoiceData.company_gstin,
        invoice_number: sampleInvoiceData.invoice_number,
        invoice_amount: sampleInvoiceData.invoice_amount,
        cgst_amount: sampleInvoiceData.cgst_amount,
        sgst_amount: sampleInvoiceData.sgst_amount,
        igst_amount: sampleInvoiceData.igst_amount
    };
    
    console.log('='.repeat(60));
    console.log('Testing: Validate GST Endpoint');
    console.log('='.repeat(60));
    console.log('Endpoint:', endpoint);
    console.log('Method: POST');
    console.log('\nRequest Body:');
    console.log(JSON.stringify(requestBody, null, 2));
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('\nResponse Status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('\nResponse Body:');
        console.log(JSON.stringify(data, null, 2));
        
        return data;
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    }
}

// ==========================================================================
// 3. Validate Company Registration Number Endpoint
// ==========================================================================

/**
 * Test validate company registration number endpoint
 */
async function testValidateCompanyRegistration() {
    const endpoint = `${BASE_URL}/webhook/f/finguard/validate-company-registration`;
    
    const requestBody = {
        company_registration_number: "U12345MH2020PTC123456",
        company_name: "Adani Enterprises Limited",
        state: "Maharashtra"
    };
    
    console.log('='.repeat(60));
    console.log('Testing: Validate Company Registration Endpoint');
    console.log('='.repeat(60));
    console.log('Endpoint:', endpoint);
    console.log('Method: POST');
    console.log('\nRequest Body:');
    console.log(JSON.stringify(requestBody, null, 2));
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('\nResponse Status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('\nResponse Body:');
        console.log(JSON.stringify(data, null, 2));
        
        return data;
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    }
}

// ==========================================================================
// Run All Tests
// ==========================================================================

/**
 * Run all endpoint tests sequentially
 */
async function runAllTests() {
    console.log('\n🧪 Starting FinGuard API Tests...\n');
    
    const results = {
        detectDuplicate: null,
        validateGST: null,
        validateCompanyRegistration: null
    };
    
    try {
        // Test 1: Detect Duplicate
        console.log('\n📋 Test 1: Detect Duplicate');
        results.detectDuplicate = await testDetectDuplicate();
        console.log('✅ Detect Duplicate test completed\n');
        
        // Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2: Validate GST
        console.log('\n📋 Test 2: Validate GST');
        results.validateGST = await testValidateGST();
        console.log('✅ Validate GST test completed\n');
        
        // Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 3: Validate Company Registration
        console.log('\n📋 Test 3: Validate Company Registration');
        results.validateCompanyRegistration = await testValidateCompanyRegistration();
        console.log('✅ Validate Company Registration test completed\n');
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 All Tests Completed Successfully!');
        console.log('='.repeat(60));
        
        return results;
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        throw error;
    }
}

// ==========================================================================
// Export Functions
// ==========================================================================

// For use in browser console or as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testDetectDuplicate,
        testValidateGST,
        testValidateCompanyRegistration,
        runAllTests,
        sampleInvoiceData
    };
}

// Auto-run tests if accessed directly in browser
if (typeof window !== 'undefined') {
    console.log('FinGuard API Test Suite loaded!');
    console.log('Available functions:');
    console.log('  - testDetectDuplicate()');
    console.log('  - testValidateGST()');
    console.log('  - testValidateCompanyRegistration()');
    console.log('  - runAllTests()');
    console.log('\nTo run all tests, execute: runAllTests()');
}

// ==========================================================================
// cURL Examples (for command line testing)
// ==========================================================================

/*

# 1. Detect Duplicate
curl -X POST https://n8n-n8n.j8euv3.easypanel.host/webhook/f/finguard/detect-duplicate \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "CONS-2025-789",
    "invoice_date": "October 12, 2025",
    "invoice_amount": "188800",
    "vendor_gstin": "07AADCB3456H1ZP",
    "company_gstin": "27AAACP1234M1Z1",
    "hsn_sac_codes": ["998314"],
    "line_items": [
      {
        "description": "Financial Consulting",
        "hsn_sac": "998314",
        "quantity": "40",
        "rate": "2500",
        "amount": "100000"
      },
      {
        "description": "Tax Advisory",
        "hsn_sac": "998314",
        "quantity": "20",
        "rate": "3000",
        "amount": "60000"
      }
    ],
    "subtotal": "160000",
    "cgst_amount": "14400",
    "sgst_amount": "14400",
    "igst_amount": null,
    "gst_rate": null
  }'

# 2. Validate GST
curl -X POST https://n8n-n8n.j8euv3.easypanel.host/webhook/f/finguard/validate-gst \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_gstin": "07AADCB3456H1ZP",
    "vendor_name": "ABC Consultancy Services Pvt Ltd",
    "company_gstin": "27AAACP1234M1Z1",
    "invoice_number": "CONS-2025-789",
    "invoice_amount": "188800",
    "cgst_amount": "14400",
    "sgst_amount": "14400",
    "igst_amount": null
  }'

# 3. Validate Company Registration
curl -X POST https://n8n-n8n.j8euv3.easypanel.host/webhook/f/finguard/validate-company-registration \
  -H "Content-Type: application/json" \
  -d '{
    "company_registration_number": "U12345MH2020PTC123456",
    "company_name": "Adani Enterprises Limited",
    "state": "Maharashtra"
  }'

*/
