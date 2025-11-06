/**
 * Adani Fintell Suite - API Endpoints Configuration
 * Central location for all API endpoint definitions
 */

'use strict';

// ==========================================================================
// Base URLs
// ==========================================================================

const API_BASE_URL = 'https://n8n-n8n.qoezvx.easypanel.host';

// ==========================================================================
// Authentication Endpoints
// ==========================================================================

const AUTH_ENDPOINTS = {
    SIGNIN: `${API_BASE_URL}/webhook/f/signin`,
    SIGNOUT: `${API_BASE_URL}/webhook/f/signout`,
    FORGOT_PASSWORD: `${API_BASE_URL}/webhook/f/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/webhook/f/reset-password`,
};

// ==========================================================================
// FinGuard Module Endpoints
// ==========================================================================

const FINGUARD_ENDPOINTS = {
    OCR_PDF: `${API_BASE_URL}/webhook/f/finguard/ocr/pdf`,
    OCR_IMAGE: `${API_BASE_URL}/webhook/f/finguard/ocr/image`,
    DETECT_DUPLICATE: `${API_BASE_URL}/webhook/f/finguard/detect-duplicate`,
    VALIDATE_GST: `${API_BASE_URL}/webhook/f/finguard/validate-gst`,
    VALIDATE_GST_RATE: `${API_BASE_URL}/webhook/f/finguard/validate-gst-rate`,
    PRICE_ANOMALY: `${API_BASE_URL}/webhook/f/finguard/price-anomaly`,
    GET_INVOICES: `${API_BASE_URL}/webhook/f/finguard/get-invoices`,
    GET_INVOICE_DETAILS: `${API_BASE_URL}/webhook/f/finguard/get-invoice-details`,
    UPDATE_INVOICE: `${API_BASE_URL}/webhook/f/finguard/update-invoice`,
    DELETE_INVOICE: `${API_BASE_URL}/webhook/f/finguard/delete-invoice`,
    FETCH_ANOMALIES: `${API_BASE_URL}/webhook/f/finguard/anomalies`
};

// ==========================================================================
// SheetSense Module Endpoints
// ==========================================================================

const SHEETSENSE_ENDPOINTS = {
    UPLOAD_TRIAL_BALANCE: `${API_BASE_URL}/webhook/f/sheetsense/upload-trial-balance`,
    PROCESS_TRIAL_BALANCE: `${API_BASE_URL}/webhook/f/sheetsense/process-trial-balance`,
    ASSIGN_GL_ACCOUNTS: `${API_BASE_URL}/webhook/f/sheetsense/assign-gl-accounts`,
    VALIDATE_ENTRIES: `${API_BASE_URL}/webhook/f/sheetsense/validate-entries`,
    RUN_ANALYTICAL_REVIEW: `${API_BASE_URL}/webhook/f/sheetsense/analytical-review`,
    GET_REPORTS: `${API_BASE_URL}/webhook/f/sheetsense/get-reports`,
    GENERATE_REPORT: `${API_BASE_URL}/webhook/f/sheetsense/generate-report`,
    EXPORT_DATA: `${API_BASE_URL}/webhook/f/sheetsense/export-data`
};

// ==========================================================================
// Analytics & Dashboard Endpoints
// ==========================================================================

const ANALYTICS_ENDPOINTS = {
    GET_DASHBOARD_DATA: `${API_BASE_URL}/webhook/f/analytics/dashboard`,
    GET_STATISTICS: `${API_BASE_URL}/webhook/f/analytics/statistics`,
    GET_TRENDS: `${API_BASE_URL}/webhook/f/analytics/trends`,
    GET_COMPLIANCE_STATUS: `${API_BASE_URL}/webhook/f/analytics/compliance-status`,
    EXPORT_ANALYTICS: `${API_BASE_URL}/webhook/f/analytics/export`
};

// ==========================================================================
// User Management Endpoints
// ==========================================================================

const USER_ENDPOINTS = {
    GET_PROFILE: `${API_BASE_URL}/webhook/f/user/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/webhook/f/user/update-profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/webhook/f/user/change-password`,
    GET_PREFERENCES: `${API_BASE_URL}/webhook/f/user/preferences`,
    UPDATE_PREFERENCES: `${API_BASE_URL}/webhook/f/user/update-preferences`,
    GET_ACTIVITY_LOG: `${API_BASE_URL}/webhook/f/user/activity-log`
};

// ==========================================================================
// Entity Management Endpoints
// ==========================================================================

const ENTITY_ENDPOINTS = {
    GET_ENTITIES: `${API_BASE_URL}/webhook/f/entities/list`,
    GET_ENTITY_DETAILS: `${API_BASE_URL}/webhook/f/entities/details`,
    CREATE_ENTITY: `${API_BASE_URL}/webhook/f/entities/create`,
    UPDATE_ENTITY: `${API_BASE_URL}/webhook/f/entities/update`,
    DELETE_ENTITY: `${API_BASE_URL}/webhook/f/entities/delete`
};

// ==========================================================================
// Database Endpoints
// ==========================================================================

const DATABASE_ENDPOINTS = {
    FETCH_INVOICES: `${API_BASE_URL}/webhook/f/database/fetch-invoices`,
    ADD_INVOICE: `${API_BASE_URL}/webhook/f/database/add-invoice`
};

// ==========================================================================
// Purchase Order Endpoints
// ==========================================================================

const PURCHASE_ORDER_ENDPOINTS = {
    FETCH_PURCHASE_ORDERS: `${API_BASE_URL}/webhook/f/database/fetch-purchase-orders`,
    GET_PO_DETAILS: `${API_BASE_URL}/webhook/f/purchase-orders/get-po-details`,
    ADD_PURCHASE_ORDER: `${API_BASE_URL}/webhook/f/purchase-orders/add-po`,
    UPDATE_PURCHASE_ORDER: `${API_BASE_URL}/webhook/f/purchase-orders/update-po`,
    DELETE_PURCHASE_ORDER: `${API_BASE_URL}/webhook/f/purchase-orders/delete-po`,
    APPROVE_PURCHASE_ORDER: `${API_BASE_URL}/webhook/f/purchase-orders/approve-po`,
    REJECT_PURCHASE_ORDER: `${API_BASE_URL}/webhook/f/purchase-orders/reject-po`,
    GET_PO_STATUS: `${API_BASE_URL}/webhook/f/purchase-orders/get-po-status`,
    EXPORT_PO_DATA: `${API_BASE_URL}/webhook/f/purchase-orders/export-po-data`
};

// ==========================================================================
// Vendor Master Endpoints
// ==========================================================================

const VENDOR_MASTER_ENDPOINTS = {
    ADD_VENDOR: `${API_BASE_URL}/webhook/f/vendor-master/add-vendor`,
    FETCH_VENDORS: `${API_BASE_URL}/webhook/f/vendor-master/fetch-vendors`,
    GET_VENDOR_DETAILS: `${API_BASE_URL}/webhook/f/vendor-master/get-vendor-details`,
    UPDATE_VENDOR: `${API_BASE_URL}/webhook/f/vendor-master/update-vendor`,
    GET_VENDOR_POS: `${API_BASE_URL}/webhook/f/vendor-master/get-vendor-purchase-orders`,
    GET_VENDOR_PERFORMANCE: `${API_BASE_URL}/webhook/f/vendor-master/get-vendor-performance`
};

// ==========================================================================
// Vendor Management Endpoints
// ==========================================================================

const VENDOR_ENDPOINTS = {
    FETCH_VENDORS: `${API_BASE_URL}/webhook/f/database/fetch-vendors`,
    GET_VENDOR_DETAILS: `${API_BASE_URL}/webhook/f/vendors/get-vendor-details`,
    ADD_VENDOR: `${API_BASE_URL}/webhook/f/finguard/add-vendor`,
    UPDATE_VENDOR: `${API_BASE_URL}/webhook/f/vendors/update-vendor`,
    DELETE_VENDOR: `${API_BASE_URL}/webhook/f/vendors/delete-vendor`,
    APPROVE_VENDOR: `${API_BASE_URL}/webhook/f/vendors/approve-vendor`,
    BLOCK_VENDOR: `${API_BASE_URL}/webhook/f/vendors/block-vendor`,
    UNBLOCK_VENDOR: `${API_BASE_URL}/webhook/f/vendors/unblock-vendor`,
    GET_VENDOR_POS: `${API_BASE_URL}/webhook/f/vendors/get-vendor-pos`,
    EXPORT_VENDOR_DATA: `${API_BASE_URL}/webhook/f/vendors/export-vendor-data`
};

// ==========================================================================
// AI Assistant Endpoints
// ==========================================================================

const AI_ASSISTANT_ENDPOINTS = {
    SEND_MESSAGE: `${API_BASE_URL}/webhook/f/ai-assistant/chat`,
    GET_CONVERSATIONS: `${API_BASE_URL}/webhook/f/ai-assistant/conversations`,
    GET_CONVERSATION_MESSAGES: `${API_BASE_URL}/webhook/f/ai-assistant/conversation`,
    DELETE_CONVERSATION: `${API_BASE_URL}/webhook/f/ai-assistant/conversation`,
    CREATE_CONVERSATION: `${API_BASE_URL}/webhook/f/ai-assistant/conversation/new`,
    UPDATE_CONVERSATION: `${API_BASE_URL}/webhook/f/ai-assistant/conversation/update`,
    EXPORT_CONVERSATION: `${API_BASE_URL}/webhook/f/ai-assistant/conversation/export`
};

// ==========================================================================
// Export All Endpoints
// ==========================================================================

const API_ENDPOINTS = {
    BASE_URL: API_BASE_URL,
    AUTH: AUTH_ENDPOINTS,
    FINGUARD: FINGUARD_ENDPOINTS,
    SHEETSENSE: SHEETSENSE_ENDPOINTS,
    ANALYTICS: ANALYTICS_ENDPOINTS,
    USER: USER_ENDPOINTS,
    ENTITY: ENTITY_ENDPOINTS,
    DATABASE: DATABASE_ENDPOINTS,
    PURCHASE_ORDER: PURCHASE_ORDER_ENDPOINTS,
    VENDOR_MASTER: VENDOR_MASTER_ENDPOINTS,
    VENDOR: VENDOR_ENDPOINTS,
    AI_ASSISTANT: AI_ASSISTANT_ENDPOINTS
};

// Make available globally
if (typeof window !== 'undefined') {
    window.API_ENDPOINTS = API_ENDPOINTS;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_ENDPOINTS;
}
