/**
 * Anomalies Dashboard Page
 * Displays and manages invoice anomalies
 */

import { API_ENDPOINTS } from '../utils/api-endpoints.js';
import { showNotification } from '../utils/notification.js';

// State Management
const state = {
    anomalies: [],
    filteredAnomalies: [],
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
        search: '',
        type: '',
        severity: '',
        status: ''
    }
};

// DOM Elements
const elements = {
    searchInput: null,
    typeFilter: null,
    severityFilter: null,
    statusFilter: null,
    refreshBtn: null,
    tableBody: null,
    paginationContainer: null,
    modalOverlay: null,
    modalClose: null,
    modalBody: null,
    totalAnomalies: null,
    highSeverity: null,
    mediumSeverity: null,
    lowSeverity: null,
    duplicateCount: null,
    priceAnomalyCount: null,
    gstComplianceCount: null,
    highRiskCount: null
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
    await fetchAnomalies();

    // Remove loading state
    document.body.classList.remove('loading-layout');
}

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements.searchInput = document.getElementById('searchInput');
    elements.typeFilter = document.getElementById('typeFilter');
    elements.severityFilter = document.getElementById('severityFilter');
    elements.statusFilter = document.getElementById('statusFilter');
    elements.refreshBtn = document.getElementById('refreshBtn');
    elements.tableBody = document.getElementById('anomaliesTableBody');
    elements.paginationContainer = document.getElementById('paginationContainer');
    elements.modalOverlay = document.getElementById('modalOverlay');
    elements.modalClose = document.getElementById('modalClose');
    elements.modalBody = document.getElementById('modalBody');
    elements.totalAnomalies = document.getElementById('totalAnomalies');
    elements.highSeverity = document.getElementById('highSeverity');
    elements.mediumSeverity = document.getElementById('mediumSeverity');
    elements.lowSeverity = document.getElementById('lowSeverity');
    elements.duplicateCount = document.getElementById('duplicateCount');
    elements.priceAnomalyCount = document.getElementById('priceAnomalyCount');
    elements.gstComplianceCount = document.getElementById('gstComplianceCount');
    elements.highRiskCount = document.getElementById('highRiskCount');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Search input
    elements.searchInput?.addEventListener('input', handleSearch);

    // Filter dropdowns
    elements.typeFilter?.addEventListener('change', handleFilterChange);
    elements.severityFilter?.addEventListener('change', handleFilterChange);
    elements.statusFilter?.addEventListener('change', handleFilterChange);

    // Refresh button
    elements.refreshBtn?.addEventListener('click', handleRefresh);

    // Modal close
    elements.modalClose?.addEventListener('click', closeModal);
    elements.modalOverlay?.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });

    // Anomaly type cards
    document.querySelectorAll('.anomaly-type-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            elements.typeFilter.value = type;
            handleFilterChange();
        });
    });
}

/**
 * Fetch anomalies from API
 */
async function fetchAnomalies() {
    try {
        // For now, using mock data since API endpoint might not be ready
        // Uncomment below when API is ready
        // const response = await fetch(API_ENDPOINTS.FETCH_ANOMALIES);
        // const data = await response.json();
        
        // Mock data for testing
        const data = getMockData();

        if (data.success) {
            state.anomalies = data.anomalies;
            updateSummary(data.summary);
            applyFilters();
        } else {
            throw new Error(data.message || 'Failed to fetch anomalies');
        }
    } catch (error) {
        console.error('Error fetching anomalies:', error);
        showNotification('Failed to load anomalies data', 'error');
        elements.tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="10" class="text-center">
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

    elements.totalAnomalies.textContent = summary.total_anomalies || 0;
    elements.highSeverity.textContent = summary.by_severity?.high || 0;
    elements.mediumSeverity.textContent = summary.by_severity?.medium || 0;
    elements.lowSeverity.textContent = summary.by_severity?.low || 0;
    elements.duplicateCount.textContent = summary.by_type?.duplicate || 0;
    elements.priceAnomalyCount.textContent = summary.by_type?.price_anomaly || 0;
    elements.gstComplianceCount.textContent = summary.by_type?.gst_compliance || 0;
    elements.highRiskCount.textContent = summary.by_type?.high_risk || 0;
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
    state.filters.type = elements.typeFilter.value;
    state.filters.severity = elements.severityFilter.value;
    state.filters.status = elements.statusFilter.value;
    state.currentPage = 1;
    applyFilters();
}

/**
 * Apply filters to anomalies
 */
function applyFilters() {
    let filtered = [...state.anomalies];

    // Apply search filter
    if (state.filters.search) {
        filtered = filtered.filter(anomaly => 
            anomaly.invoice_number.toLowerCase().includes(state.filters.search) ||
            anomaly.vendor_name.toLowerCase().includes(state.filters.search) ||
            anomaly.vendor_gstin.toLowerCase().includes(state.filters.search) ||
            anomaly.id.toLowerCase().includes(state.filters.search)
        );
    }

    // Apply type filter
    if (state.filters.type) {
        filtered = filtered.filter(anomaly => anomaly.anomaly_type === state.filters.type);
    }

    // Apply severity filter
    if (state.filters.severity) {
        filtered = filtered.filter(anomaly => anomaly.severity === state.filters.severity);
    }

    // Apply status filter
    if (state.filters.status) {
        filtered = filtered.filter(anomaly => anomaly.status === state.filters.status);
    }

    state.filteredAnomalies = filtered;
    renderTable();
    renderPagination();
}

/**
 * Render table with anomalies
 */
function renderTable() {
    if (state.filteredAnomalies.length === 0) {
        elements.tableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="10" class="text-center">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">No anomalies found</h3>
                    <p class="empty-state-text">Try adjusting your filters</p>
                </td>
            </tr>
        `;
        return;
    }

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const pageAnomalies = state.filteredAnomalies.slice(start, end);

    elements.tableBody.innerHTML = pageAnomalies.map(anomaly => `
        <tr>
            <td><strong>${anomaly.id}</strong></td>
            <td>${anomaly.invoice_number}</td>
            <td>${anomaly.vendor_name}</td>
            <td>${formatDate(anomaly.invoice_date)}</td>
            <td>₹${formatAmount(anomaly.invoice_amount)}</td>
            <td><span class="badge badge-type badge-${anomaly.anomaly_type.replace('_', '-')}">${formatType(anomaly.anomaly_type)}</span></td>
            <td><span class="badge badge-${anomaly.severity}">${anomaly.severity}</span></td>
            <td>
                <div class="risk-score">
                    <span>${anomaly.risk_score}</span>
                    <div class="risk-bar">
                        <div class="risk-fill risk-fill-${getRiskLevel(anomaly.risk_score)}" style="width: ${anomaly.risk_score}%"></div>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-${anomaly.status.replace('_', '-')}">${formatStatus(anomaly.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="window.viewAnomalyDetails('${anomaly.id}')">View</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render pagination
 */
function renderPagination() {
    const totalPages = Math.ceil(state.filteredAnomalies.length / state.itemsPerPage);

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
 * View anomaly details
 */
window.viewAnomalyDetails = function(anomalyId) {
    const anomaly = state.anomalies.find(a => a.id === anomalyId);
    if (!anomaly) return;

    let detailsHTML = `
        <div class="detail-row">
            <span class="detail-label">Anomaly ID:</span>
            <span class="detail-value">${anomaly.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Invoice Number:</span>
            <span class="detail-value">${anomaly.invoice_number}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Vendor Name:</span>
            <span class="detail-value">${anomaly.vendor_name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Vendor GSTIN:</span>
            <span class="detail-value">${anomaly.vendor_gstin}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Invoice Date:</span>
            <span class="detail-value">${formatDate(anomaly.invoice_date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Invoice Amount:</span>
            <span class="detail-value">₹${formatAmount(anomaly.invoice_amount)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Anomaly Type:</span>
            <span class="detail-value"><span class="badge badge-type badge-${anomaly.anomaly_type.replace('_', '-')}">${formatType(anomaly.anomaly_type)}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Severity:</span>
            <span class="detail-value"><span class="badge badge-${anomaly.severity}">${anomaly.severity}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Risk Score:</span>
            <span class="detail-value">${anomaly.risk_score}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value"><span class="badge badge-${anomaly.status.replace('_', '-')}">${formatStatus(anomaly.status)}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Detected Date:</span>
            <span class="detail-value">${formatDateTime(anomaly.detected_date)}</span>
        </div>
    `;

    // Add type-specific details
    if (anomaly.details) {
        detailsHTML += '<h4 style="margin-top: 1.5rem; margin-bottom: 1rem; color: var(--text-primary);">Specific Details</h4>';
        detailsHTML += renderSpecificDetails(anomaly.anomaly_type, anomaly.details);
    }

    elements.modalBody.innerHTML = detailsHTML;
    elements.modalOverlay.classList.add('active');
};

/**
 * Render type-specific details
 */
function renderSpecificDetails(type, details) {
    let html = '';

    switch (type) {
        case 'duplicate':
            html = `
                <div class="detail-row">
                    <span class="detail-label">Duplicate Type:</span>
                    <span class="detail-value">${details.duplicate_type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Matched Invoices:</span>
                    <span class="detail-value">${details.matched_invoice_ids?.join(', ')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Confidence Score:</span>
                    <span class="detail-value">${details.confidence_score}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reason:</span>
                    <span class="detail-value">${details.duplicate_reason}</span>
                </div>
            `;
            break;

        case 'price_anomaly':
            html = '<h5 style="margin-bottom: 0.5rem; color: var(--text-primary);">Price Deviations:</h5>';
            details.anomalies?.forEach(item => {
                html += `
                    <div style="background: var(--bg-lighter); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                        <div class="detail-row" style="border: none;">
                            <span class="detail-label">Item:</span>
                            <span class="detail-value">${item.description}</span>
                        </div>
                        <div class="detail-row" style="border: none;">
                            <span class="detail-label">HSN/SAC:</span>
                            <span class="detail-value">${item.hsn_sac}</span>
                        </div>
                        <div class="detail-row" style="border: none;">
                            <span class="detail-label">Invoiced Rate:</span>
                            <span class="detail-value">₹${item.invoiced_rate}</span>
                        </div>
                        <div class="detail-row" style="border: none;">
                            <span class="detail-label">Market Rate:</span>
                            <span class="detail-value">₹${item.market_rate}</span>
                        </div>
                        <div class="detail-row" style="border: none;">
                            <span class="detail-label">Deviation:</span>
                            <span class="detail-value">${item.deviation_percentage}%</span>
                        </div>
                    </div>
                `;
            });
            break;

        case 'gst_compliance':
            html = `
                <div class="detail-row">
                    <span class="detail-label">Issue Type:</span>
                    <span class="detail-value">${details.issue_type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Expected Rate:</span>
                    <span class="detail-value">${details.expected_rate}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Applied Rate:</span>
                    <span class="detail-value">${details.applied_rate}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">HSN/SAC Codes:</span>
                    <span class="detail-value">${details.hsn_sac_codes?.join(', ')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reason:</span>
                    <span class="detail-value">${details.reason}</span>
                </div>
            `;
            break;

        case 'high_risk':
            html = '<h5 style="margin-bottom: 0.5rem; color: var(--text-primary);">Risk Factors:</h5>';
            html += '<ul style="margin-left: 1.5rem; color: var(--text-secondary);">';
            details.risk_factors?.forEach(factor => {
                html += `<li style="margin-bottom: 0.5rem;">${factor}</li>`;
            });
            html += '</ul>';
            html += `
                <div class="detail-row">
                    <span class="detail-label">Recommendation:</span>
                    <span class="detail-value">${details.recommendation}</span>
                </div>
            `;
            break;
    }

    return html;
}

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
    await fetchAnomalies();
    showNotification('Data refreshed successfully', 'success');
    elements.refreshBtn.disabled = false;
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
 * Format type
 */
function formatType(type) {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Format status
 */
function formatStatus(status) {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Get risk level
 */
function getRiskLevel(score) {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

/**
 * Get mock data for testing
 */
function getMockData() {
    return {
        success: true,
        total_count: 145,
        anomalies: [
            {
                id: "ANO-2025-001",
                invoice_id: "IN000000000000001",
                invoice_number: "CONS-2025-789",
                vendor_name: "ABC Consulting Pvt Ltd",
                vendor_gstin: "07AADCB3456H1ZP",
                invoice_date: "2025-10-12",
                invoice_amount: 188800,
                anomaly_type: "duplicate",
                severity: "high",
                risk_score: 92,
                detected_date: "2025-10-15T14:30:00Z",
                status: "flagged",
                details: {
                    duplicate_type: "fuzzy_match",
                    matched_invoice_ids: ["IN000000000000023"],
                    duplicate_reason: "Same vendor, similar invoice number and amount within 3 days",
                    confidence_score: 92
                }
            },
            {
                id: "ANO-2025-002",
                invoice_id: "IN000000000000015",
                invoice_number: "INV-2025-456",
                vendor_name: "XYZ Trading Co",
                vendor_gstin: "29AABCT1332L1ZG",
                invoice_date: "2025-10-20",
                invoice_amount: 245000,
                anomaly_type: "price_anomaly",
                severity: "medium",
                risk_score: 68,
                detected_date: "2025-10-21T09:15:00Z",
                status: "under_review",
                details: {
                    anomalies: [
                        {
                            hsn_sac: "998314",
                            description: "Financial Consulting",
                            invoiced_rate: 3500,
                            market_rate: 2500,
                            deviation_percentage: 40,
                            severity: "medium"
                        }
                    ],
                    total_anomalies: 1
                }
            },
            {
                id: "ANO-2025-003",
                invoice_id: "IN000000000000027",
                invoice_number: "BILL-2025-789",
                vendor_name: "PQR Services Ltd",
                vendor_gstin: "24AACCP1234M1Z5",
                invoice_date: "2025-10-22",
                invoice_amount: 125000,
                anomaly_type: "gst_compliance",
                severity: "high",
                risk_score: 85,
                detected_date: "2025-10-23T11:45:00Z",
                status: "flagged",
                details: {
                    issue_type: "invalid_gst_rate",
                    expected_rate: 18,
                    applied_rate: 12,
                    hsn_sac_codes: ["998314"],
                    reason: "Incorrect GST rate applied for services"
                }
            },
            {
                id: "ANO-2025-004",
                invoice_id: "IN000000000000035",
                invoice_number: "SRV-2025-123",
                vendor_name: "LMN Enterprises",
                vendor_gstin: "09AADCL1234M1ZX",
                invoice_date: "2025-10-25",
                invoice_amount: 450000,
                anomaly_type: "high_risk",
                severity: "high",
                risk_score: 88,
                detected_date: "2025-10-26T16:20:00Z",
                status: "flagged",
                details: {
                    risk_factors: [
                        "New vendor (less than 30 days)",
                        "High invoice amount (>400000)",
                        "Multiple GST issues detected"
                    ],
                    recommendation: "Manual verification required before processing"
                }
            },
            {
                id: "ANO-2025-005",
                invoice_id: "IN000000000000042",
                invoice_number: "TAX-2025-321",
                vendor_name: "Tech Solutions Inc",
                vendor_gstin: "19AACCT5678M1ZQ",
                invoice_date: "2025-10-28",
                invoice_amount: 98000,
                anomaly_type: "price_anomaly",
                severity: "low",
                risk_score: 45,
                detected_date: "2025-10-29T10:20:00Z",
                status: "resolved",
                details: {
                    anomalies: [
                        {
                            hsn_sac: "998314",
                            description: "IT Consulting",
                            invoiced_rate: 2200,
                            market_rate: 2000,
                            deviation_percentage: 10,
                            severity: "low"
                        }
                    ],
                    total_anomalies: 1
                }
            }
        ],
        summary: {
            total_anomalies: 145,
            by_type: {
                duplicate: 42,
                price_anomaly: 56,
                gst_compliance: 31,
                high_risk: 16
            },
            by_severity: {
                high: 48,
                medium: 67,
                low: 30
            },
            by_status: {
                flagged: 89,
                under_review: 34,
                resolved: 22
            }
        }
    };
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
