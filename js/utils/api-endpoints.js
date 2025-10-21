/**
 * Adani Fintell Suite - API Endpoints Configuration
 * Central location for all API endpoint definitions
 */

'use strict';

// ==========================================================================
// Base URLs
// ==========================================================================

const API_BASE_URL = 'https://n8n-n8n.j8euv3.easypanel.host';

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
    PRICE_ANOMALY: `${API_BASE_URL}/webhook/price-anomaly`,
    GET_INVOICES: `${API_BASE_URL}/webhook/f/finguard/get-invoices`,
    GET_INVOICE_DETAILS: `${API_BASE_URL}/webhook/f/finguard/get-invoice-details`,
    UPDATE_INVOICE: `${API_BASE_URL}/webhook/f/finguard/update-invoice`,
    DELETE_INVOICE: `${API_BASE_URL}/webhook/f/finguard/delete-invoice`
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
    DATABASE: DATABASE_ENDPOINTS
};

// Make available globally
if (typeof window !== 'undefined') {
    window.API_ENDPOINTS = API_ENDPOINTS;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_ENDPOINTS;
}
