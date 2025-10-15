/**
 * Application Constants
 * Configuration, API endpoints, and constants for Adani-Fintell-Suite
 */

const APP_CONFIG = {
    APP_NAME: 'Adani-Fintell-Suite',
    VERSION: '1.0.0',
    ENTITY_COUNT: 1000,
    SESSION_TIMEOUT: 12 * 60 * 60 * 1000, // 12 hours
};

// API Endpoints for n8n workflows
const API_ENDPOINTS = {
    BASE_URL: '/n8n/webhook',
    FINGUARD: {
        PROCESS_INVOICE: '/n8n/webhook/process-invoice',
        VALIDATE_GST: '/n8n/webhook/validate-gst',
        CHECK_DUPLICATE: '/n8n/webhook/check-duplicate',
        DETECT_ANOMALY: '/n8n/webhook/detect-anomaly',
        GET_INVOICES: '/n8n/webhook/get-invoices',
    },
    SHEETSENSE: {
        PROCESS_TRIAL_BALANCE: '/n8n/webhook/process-trial-balance',
        VALIDATE_GL: '/n8n/webhook/validate-gl',
        GET_ASSIGNMENTS: '/n8n/webhook/get-assignments',
        GENERATE_REPORT: '/n8n/webhook/generate-report',
    },
    ANALYTICS: {
        GET_DASHBOARD_DATA: '/n8n/webhook/get-dashboard-data',
        GET_TRENDS: '/n8n/webhook/get-trends',
    },
    AUTH: {
        LOGIN: '/n8n/webhook/auth/login',
        LOGOUT: '/n8n/webhook/auth/logout',
        VERIFY_SESSION: '/n8n/webhook/auth/verify',
    },
};

// File upload constraints
const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: {
        INVOICE: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    },
};

// Risk level definitions
const RISK_LEVELS = {
    LOW: { label: 'Low', color: '#10b981', threshold: 30 },
    MEDIUM: { label: 'Medium', color: '#f59e0b', threshold: 70 },
    HIGH: { label: 'High', color: '#ef4444', threshold: 100 },
};

// Status definitions
const STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

// GST validation patterns
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Date formats
const DATE_FORMATS = {
    DISPLAY: 'DD MMM YYYY',
    API: 'YYYY-MM-DD',
    DATETIME: 'DD MMM YYYY HH:mm',
};

// Pagination
const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Local storage keys
const STORAGE_KEYS = {
    AUTH_TOKEN: 'fintell_auth_token',
    USER_DATA: 'fintell_user_data',
    SESSION_EXPIRY: 'fintell_session_expiry',
    THEME: 'fintell_theme',
    CACHED_DATA: 'fintell_cached_data',
};

// Animation durations (ms)
const ANIMATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
};

// Debounce delays (ms)
const DEBOUNCE_DELAY = {
    SEARCH: 300,
    VALIDATION: 500,
    RESIZE: 150,
};

// Chart colors
const CHART_COLORS = {
    PRIMARY: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
    SUCCESS: ['#065f46', '#10b981', '#34d399', '#6ee7b7'],
    WARNING: ['#92400e', '#f59e0b', '#fbbf24', '#fcd34d'],
    DANGER: ['#991b1b', '#ef4444', '#f87171', '#fca5a5'],
};

// Export for use in modules
export {
    APP_CONFIG,
    API_ENDPOINTS,
    FILE_UPLOAD,
    RISK_LEVELS,
    STATUS,
    GST_PATTERN,
    PAN_PATTERN,
    DATE_FORMATS,
    PAGINATION,
    STORAGE_KEYS,
    ANIMATION,
    DEBOUNCE_DELAY,
    CHART_COLORS,
};
