/**
 * API Communication Layer
 * Handles all API requests to n8n workflows
 */

import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants.js';
import { retryWithBackoff } from '../utils/helpers.js';

/**
 * API client class for handling HTTP requests
 */
class APIClient {
    constructor() {
        this.baseURL = API_ENDPOINTS.BASE_URL;
    }

    /**
     * Get authentication token from storage
     * @returns {string|null} Auth token
     */
    getAuthToken() {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    /**
     * Build headers for API requests
     * @param {Object} customHeaders - Custom headers to add
     * @returns {Object} Headers object
     */
    buildHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Make HTTP request
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Response data
     */
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: this.buildHeaders(options.headers),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response data
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET',
        });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @returns {Promise<Object>} Response data
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * POST request with FormData (for file uploads)
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data
     * @returns {Promise<Object>} Response data
     */
    async postFormData(endpoint, formData) {
        const token = this.getAuthToken();
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Upload Error:', error);
            throw error;
        }
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @returns {Promise<Object>} Response data
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }
}

// Create singleton instance
const apiClient = new APIClient();

/**
 * FinGuard API methods
 */
export const FinGuardAPI = {
    /**
     * Process invoice with OCR
     * @param {File} file - Invoice file
     * @returns {Promise<Object>} Processed invoice data
     */
    async processInvoice(file) {
        const formData = new FormData();
        formData.append('invoice', file);
        formData.append('timestamp', Date.now());

        return retryWithBackoff(() => 
            apiClient.postFormData(API_ENDPOINTS.FINGUARD.PROCESS_INVOICE, formData)
        );
    },

    /**
     * Validate GST number
     * @param {string} gstNumber - GST number to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateGST(gstNumber) {
        return apiClient.post(API_ENDPOINTS.FINGUARD.VALIDATE_GST, { gstNumber });
    },

    /**
     * Check for duplicate invoices
     * @param {string} invoiceNumber - Invoice number
     * @param {string} vendorGST - Vendor GST number
     * @returns {Promise<Object>} Duplicate check result
     */
    async checkDuplicate(invoiceNumber, vendorGST) {
        return apiClient.post(API_ENDPOINTS.FINGUARD.CHECK_DUPLICATE, {
            invoiceNumber,
            vendorGST,
        });
    },

    /**
     * Detect anomalies in invoice
     * @param {Object} invoiceData - Invoice data to analyze
     * @returns {Promise<Object>} Anomaly detection result
     */
    async detectAnomaly(invoiceData) {
        return apiClient.post(API_ENDPOINTS.FINGUARD.DETECT_ANOMALY, invoiceData);
    },

    /**
     * Get all invoices with filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of invoices
     */
    async getInvoices(filters = {}) {
        return apiClient.get(API_ENDPOINTS.FINGUARD.GET_INVOICES, filters);
    },
};

/**
 * SheetSense API methods
 */
export const SheetSenseAPI = {
    /**
     * Process trial balance file
     * @param {File} file - Trial balance file
     * @returns {Promise<Object>} Processed trial balance data
     */
    async processTrialBalance(file) {
        const formData = new FormData();
        formData.append('trial_balance', file);
        formData.append('timestamp', Date.now());

        return retryWithBackoff(() =>
            apiClient.postFormData(API_ENDPOINTS.SHEETSENSE.PROCESS_TRIAL_BALANCE, formData)
        );
    },

    /**
     * Validate GL accounts
     * @param {Array} glAccounts - GL accounts to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateGL(glAccounts) {
        return apiClient.post(API_ENDPOINTS.SHEETSENSE.VALIDATE_GL, { glAccounts });
    },

    /**
     * Get GL assignments
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Array>} List of GL assignments
     */
    async getAssignments(filters = {}) {
        return apiClient.get(API_ENDPOINTS.SHEETSENSE.GET_ASSIGNMENTS, filters);
    },

    /**
     * Generate report
     * @param {Object} reportConfig - Report configuration
     * @returns {Promise<Object>} Generated report
     */
    async generateReport(reportConfig) {
        return apiClient.post(API_ENDPOINTS.SHEETSENSE.GENERATE_REPORT, reportConfig);
    },
};

/**
 * Analytics API methods
 */
export const AnalyticsAPI = {
    /**
     * Get dashboard data
     * @param {string} timeRange - Time range for data
     * @returns {Promise<Object>} Dashboard data
     */
    async getDashboardData(timeRange = '30days') {
        return apiClient.get(API_ENDPOINTS.ANALYTICS.GET_DASHBOARD_DATA, { timeRange });
    },

    /**
     * Get trend data
     * @param {string} metric - Metric to analyze
     * @param {string} timeRange - Time range
     * @returns {Promise<Object>} Trend data
     */
    async getTrends(metric, timeRange = '30days') {
        return apiClient.get(API_ENDPOINTS.ANALYTICS.GET_TRENDS, { metric, timeRange });
    },
};

/**
 * Authentication API methods
 */
export const AuthAPI = {
    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response
     */
    async login(email, password) {
        return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    },

    /**
     * Logout user
     * @returns {Promise<Object>} Logout response
     */
    async logout() {
        return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    },

    /**
     * Verify session
     * @returns {Promise<Object>} Session verification result
     */
    async verifySession() {
        return apiClient.get(API_ENDPOINTS.AUTH.VERIFY_SESSION);
    },
};

export default apiClient;
