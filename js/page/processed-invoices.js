/**
 * Processed Invoices Page
 * Displays processed invoices with their status and API results
 */

import { API_ENDPOINTS } from '../utils/api-endpoints.js';
import { showNotification } from '../utils/notification.js';

// State Management
const state = {
    invoices: [],
    filteredInvoices: [],
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
        search: '',
        status: '',
        stage: '',
        dateFrom: '',
        dateTo: ''
    }
};

// DOM Elements
const elements = {
    searchInput: null,
    statusFilter: null,
    stageFilter: null,
    dateFromFilter: null,
    dateToFilter: null,
    refreshBtn: null,
    tableBody: null,
    paginationContainer: null,
    modalOverlay: null,
    modalClose: null,
    modalBody: null,
    totalProcessed: null,
    successCount: null,
    failedCount: null,
    processingCount: null
};

/**
 * Initialize the page
 */
async function init() {
    // Load templates
    await window.templateLoader.loadNavbar();
    await window.templateLoader.loadSidebar();

    // Initialize DOM elements
    initializeElements();

    // Attach event listeners
    attachEventListeners();

    // Load data
    await fetchProcessedInvoices();

    // Remove loading state
    document.body.classList.remove('loading-layout');
}

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements.searchInput = document.getElementById('searchInput');
    elements.statusFilter = document.getElementById('statusFilter');
    elements.stageFilter = document.getElementById('stageFilter');
    elements.dateFromFilter = document.getElementById('dateFromFilter');
    elements.dateToFilter = document.getElementById('dateToFilter');
    elements.refreshBtn = document.getElementById('refreshBtn');
    elements.tableBody = document.getElementById('invoicesTableBody');
    elements.paginationContainer = document.getElementById('paginationContainer');
    elements.modalOverlay = document.getElementById('modalOverlay');
    elements.modalClose = document.getElementById('modalClose');
    elements.modalBody = document.getElementById('modalBody');
    elements.totalProcessed = document.getElementById('totalProcessed');
    elements.successCount = document.getElementById('successCount');
    elements.failedCount = document.getElementById('failedCount');
    elements.processingCount = document.getElementById('processingCount');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Search input
    elements.searchInput?.addEventListener('input', handleSearch);

    // Filter dropdowns
    elements.statusFilter?.addEventListener('change', handleFilterChange);
    elements.stageFilter?.addEventListener('change', handleFilterChange);
    elements.dateFromFilter?.addEventListener('change', handleFilterChange);
    elements.dateToFilter?.addEventListener('change', handleFilterChange);

    // Refresh button
    elements.refreshBtn?.addEventListener('click', handleRefresh);

    // Modal close
    elements.modalClose?.addEventListener('click', closeModal);
    elements.modalOverlay?.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });
}

/**
 * Fetch processed invoices from API
 */
async function fetchProcessedInvoices() {
    try {
        // For now, using mock data since API endpoint might not be ready
        // Uncomment below when API is ready
        // const response = await fetch(API_ENDPOINTS.FINGUARD.GET_PROCESSED_INVOICES);
        // const data = await response.json();
        
        // Mock data for testing
        const data = getMockData();

        if (data.success) {
            state.invoices = data.invoices;
            updateSummary(data.summary);
            applyFilters();
        } else {
            throw new Error(data.message || 'Failed to fetch processed invoices');
        }
    } catch (error) {
        console.error('Error fetching processed invoices:', error);
        showNotification('Failed to load processed invoices data', 'error');
        elements.tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="9" class="text-center">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">Failed to load data</h3>
                    <p class="empty-state-text">Please try refreshing the page</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Update summary cards
 */
function updateSummary(summary) {
    if (!summary) return;

    elements.totalProcessed.textContent = summary.total || 0;
    elements.successCount.textContent = summary.success || 0;
    elements.failedCount.textContent = summary.failed || 0;
    elements.processingCount.textContent = summary.processing || 0;
}

/**
 * Handle search input
 */
function handleSearch(e) {
    state.filters.search = e.target.value.toLowerCase();
    state.currentPage = 1;
    applyFilters();
}

/**
 * Handle filter changes
 */
function handleFilterChange() {
    state.filters.status = elements.statusFilter.value;
    state.filters.stage = elements.stageFilter.value;
    state.filters.dateFrom = elements.dateFromFilter.value;
    state.filters.dateTo = elements.dateToFilter.value;
    state.currentPage = 1;
    applyFilters();
}

/**
 * Apply filters to invoices
 */
function applyFilters() {
    let filtered = [...state.invoices];

    // Apply search filter
    if (state.filters.search) {
        filtered = filtered.filter(invoice => 
            invoice.file_name.toLowerCase().includes(state.filters.search) ||
            invoice.invoice_number?.toLowerCase().includes(state.filters.search) ||
            invoice.vendor_name?.toLowerCase().includes(state.filters.search)
        );
    }

    // Apply status filter
    if (state.filters.status) {
        filtered = filtered.filter(invoice => invoice.status === state.filters.status);
    }

    // Apply stage filter
    if (state.filters.stage) {
        filtered = filtered.filter(invoice => 
            invoice.failed_stage === state.filters.stage || 
            invoice.stages.some(stage => stage.stage === state.filters.stage)
        );
    }

    // Apply date range filter
    if (state.filters.dateFrom) {
        filtered = filtered.filter(invoice => 
            new Date(invoice.processed_date) >= new Date(state.filters.dateFrom)
        );
    }

    if (state.filters.dateTo) {
        filtered = filtered.filter(invoice => 
            new Date(invoice.processed_date) <= new Date(state.filters.dateTo)
        );
    }

    state.filteredInvoices = filtered;
    renderTable();
    renderPagination();
}

/**
 * Render table with invoices
 */
function renderTable() {
    if (state.filteredInvoices.length === 0) {
        elements.tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="9" class="text-center">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">No invoices found</h3>
                    <p class="empty-state-text">Try adjusting your filters</p>
                </td>
            </tr>
        `;
        return;
    }

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const pageInvoices = state.filteredInvoices.slice(start, end);

    elements.tableBody.innerHTML = pageInvoices.map(invoice => `
        <tr>
            <td><strong>${invoice.file_name}</strong></td>
            <td>${invoice.invoice_number || '-'}</td>
            <td>${invoice.vendor_name || '-'}</td>
            <td>${invoice.amount ? '₹' + formatAmount(invoice.amount) : '-'}</td>
            <td>${formatDateTime(invoice.processed_date)}</td>
            <td><span class="badge badge-${invoice.status}">${invoice.status}</span></td>
            <td>${invoice.failed_stage ? `<span class="badge badge-stage">${formatStage(invoice.failed_stage)}</span>` : '-'}</td>
            <td>${invoice.processing_time || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="window.viewProcessingDetails('${invoice.id}')">View</button>
                    ${invoice.status === 'failed' ? `<button class="btn-action btn-retry" onclick="window.retryProcessing('${invoice.id}')">Retry</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render pagination
 */
function renderPagination() {
    const totalPages = Math.ceil(state.filteredInvoices.length / state.itemsPerPage);

    if (totalPages <= 1) {
        elements.paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <button class="pagination-btn" ${state.currentPage === 1 ? 'disabled' : ''} onclick="window.changePage(${state.currentPage - 1})">
            Previous
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
            paginationHTML += `
                <button class="pagination-btn ${i === state.currentPage ? 'active' : ''}" onclick="window.changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
            paginationHTML += `<span>...</span>`;
        }
    }

    paginationHTML += `
        <button class="pagination-btn" ${state.currentPage === totalPages ? 'disabled' : ''} onclick="window.changePage(${state.currentPage + 1})">
            Next
        </button>
    `;

    elements.paginationContainer.innerHTML = paginationHTML;
}

/**
 * Change page
 */
window.changePage = function(page) {
    state.currentPage = page;
    renderTable();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * View processing details
 */
window.viewProcessingDetails = function(invoiceId) {
    const invoice = state.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    let detailsHTML = `
        <div class="detail-row">
            <span class="detail-label">File Name:</span>
            <span class="detail-value">${invoice.file_name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Invoice Number:</span>
            <span class="detail-value">${invoice.invoice_number || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Vendor Name:</span>
            <span class="detail-value">${invoice.vendor_name || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value">${invoice.amount ? '₹' + formatAmount(invoice.amount) : 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Processed Date:</span>
            <span class="detail-value">${formatDateTime(invoice.processed_date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value"><span class="badge badge-${invoice.status}">${invoice.status}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Processing Time:</span>
            <span class="detail-value">${invoice.processing_time}</span>
        </div>
    `;

    // Add processing timeline
    detailsHTML += '<div class="processing-timeline"><h4 style="margin-bottom: 1rem; color: var(--text-primary);">Processing Timeline</h4>';
    
    invoice.stages.forEach(stage => {
        const iconClass = stage.status === 'success' ? 'timeline-icon-success' : 
                         stage.status === 'failed' ? 'timeline-icon-failed' : 
                         'timeline-icon-pending';
        
        const icon = stage.status === 'success' ? 
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' :
            stage.status === 'failed' ?
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' :
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>';

        detailsHTML += `
            <div class="timeline-item">
                <div class="timeline-icon ${iconClass}">
                    ${icon}
                </div>
                <div class="timeline-content">
                    <div class="timeline-stage">${formatStage(stage.stage)}</div>
                    <div class="timeline-details">${stage.details || 'Completed successfully'}</div>
                    ${stage.time ? `<div class="timeline-time">${stage.time}</div>` : ''}
                </div>
            </div>
        `;
    });

    detailsHTML += '</div>';

    // Add API response data if available
    if (invoice.api_responses) {
        detailsHTML += '<h4 style="margin-top: 1.5rem; margin-bottom: 1rem; color: var(--text-primary);">API Responses</h4>';
        detailsHTML += '<pre style="background: var(--bg-lighter); padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.875rem;">' + 
                       JSON.stringify(invoice.api_responses, null, 2) + '</pre>';
    }

    elements.modalBody.innerHTML = detailsHTML;
    elements.modalOverlay.classList.add('active');
};

/**
 * Retry processing
 */
window.retryProcessing = function(invoiceId) {
    // Implementation for retrying failed invoice processing
    showNotification('Retry functionality will be implemented soon', 'info');
};

/**
 * Close modal
 */
function closeModal() {
    elements.modalOverlay.classList.remove('active');
}

/**
 * Handle refresh
 */
async function handleRefresh() {
    elements.refreshBtn.disabled = true;
    await fetchProcessedInvoices();
    showNotification('Data refreshed successfully', 'success');
    elements.refreshBtn.disabled = false;
}

/**
 * Format date time
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format amount
 */
function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN').format(amount);
}

/**
 * Format stage name
 */
function formatStage(stage) {
    const stageNames = {
        'ocr': 'OCR Processing',
        'arithmetical': 'Arithmetical Check',
        'gst_validation': 'GST Validation',
        'duplicate_check': 'Duplicate Check',
        'price_anomaly': 'Price Anomaly Detection'
    };
    return stageNames[stage] || stage;
}

/**
 * Get mock data for testing
 */
function getMockData() {
    return {
        success: true,
        summary: {
            total: 125,
            success: 98,
            failed: 15,
            processing: 12
        },
        invoices: [
            {
                id: 'PROC-001',
                file_name: 'invoice_abc_consulting.pdf',
                invoice_number: 'CONS-2025-789',
                vendor_name: 'ABC Consulting Pvt Ltd',
                amount: 188800,
                processed_date: '2025-11-04T10:30:00Z',
                status: 'success',
                failed_stage: null,
                processing_time: '45 seconds',
                stages: [
                    { stage: 'ocr', status: 'success', details: 'OCR processing completed', time: '15 seconds' },
                    { stage: 'arithmetical', status: 'success', details: 'Arithmetical accuracy verified', time: '5 seconds' },
                    { stage: 'gst_validation', status: 'success', details: 'GST validation passed', time: '10 seconds' },
                    { stage: 'duplicate_check', status: 'success', details: 'No duplicates found', time: '8 seconds' },
                    { stage: 'price_anomaly', status: 'success', details: 'No price anomalies detected', time: '7 seconds' }
                ],
                api_responses: {
                    ocr: { success: true, data: { invoice_number: 'CONS-2025-789' } },
                    gst_validation: { success: true, valid: true },
                    duplicate_check: { success: true, is_duplicate: false },
                    price_anomaly: { success: true, anomalies: [] }
                }
            },
            {
                id: 'PROC-002',
                file_name: 'invoice_xyz_trading.pdf',
                invoice_number: 'INV-2025-456',
                vendor_name: 'XYZ Trading Co',
                amount: 245000,
                processed_date: '2025-11-04T09:15:00Z',
                status: 'failed',
                failed_stage: 'gst_validation',
                processing_time: '28 seconds',
                stages: [
                    { stage: 'ocr', status: 'success', details: 'OCR processing completed', time: '18 seconds' },
                    { stage: 'arithmetical', status: 'success', details: 'Arithmetical accuracy verified', time: '5 seconds' },
                    { stage: 'gst_validation', status: 'failed', details: 'Invalid GST number format', time: '5 seconds' }
                ],
                api_responses: {
                    ocr: { success: true, data: { invoice_number: 'INV-2025-456' } },
                    gst_validation: { success: false, error: 'Invalid GST number' }
                }
            },
            {
                id: 'PROC-003',
                file_name: 'invoice_pqr_services.pdf',
                invoice_number: 'BILL-2025-789',
                vendor_name: 'PQR Services Ltd',
                amount: 125000,
                processed_date: '2025-11-04T08:45:00Z',
                status: 'processing',
                failed_stage: null,
                processing_time: 'In progress',
                stages: [
                    { stage: 'ocr', status: 'success', details: 'OCR processing completed', time: '20 seconds' },
                    { stage: 'arithmetical', status: 'success', details: 'Arithmetical accuracy verified', time: '6 seconds' },
                    { stage: 'gst_validation', status: 'pending', details: 'Validating GST details...', time: null }
                ],
                api_responses: {
                    ocr: { success: true, data: { invoice_number: 'BILL-2025-789' } }
                }
            },
            {
                id: 'PROC-004',
                file_name: 'invoice_lmn_enterprises.jpg',
                invoice_number: 'SRV-2025-123',
                vendor_name: 'LMN Enterprises',
                amount: 450000,
                processed_date: '2025-11-04T07:20:00Z',
                status: 'success',
                failed_stage: null,
                processing_time: '52 seconds',
                stages: [
                    { stage: 'ocr', status: 'success', details: 'OCR processing completed', time: '22 seconds' },
                    { stage: 'arithmetical', status: 'success', details: 'Arithmetical accuracy verified', time: '5 seconds' },
                    { stage: 'gst_validation', status: 'success', details: 'GST validation passed', time: '10 seconds' },
                    { stage: 'duplicate_check', status: 'success', details: 'No duplicates found', time: '8 seconds' },
                    { stage: 'price_anomaly', status: 'success', details: 'No price anomalies detected', time: '7 seconds' }
                ],
                api_responses: {
                    ocr: { success: true, data: { invoice_number: 'SRV-2025-123' } },
                    gst_validation: { success: true, valid: true },
                    duplicate_check: { success: true, is_duplicate: false },
                    price_anomaly: { success: true, anomalies: [] }
                }
            },
            {
                id: 'PROC-005',
                file_name: 'invoice_tech_solutions.pdf',
                invoice_number: 'TAX-2025-321',
                vendor_name: 'Tech Solutions Inc',
                amount: 98000,
                processed_date: '2025-11-03T16:50:00Z',
                status: 'failed',
                failed_stage: 'ocr',
                processing_time: '12 seconds',
                stages: [
                    { stage: 'ocr', status: 'failed', details: 'Unable to extract invoice data - poor image quality', time: '12 seconds' }
                ],
                api_responses: {
                    ocr: { success: false, error: 'Poor image quality' }
                }
            }
        ]
    };
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
