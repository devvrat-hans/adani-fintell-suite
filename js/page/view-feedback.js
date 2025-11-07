/**
 * View Feedback Page JavaScript
 * Displays and manages submitted feedback entries
 */

// State Management
const state = {
    allFeedback: [],
    filteredFeedback: [],
    filters: {
        type: '',
        severity: '',
        invoice: ''
    }
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refreshBtn'),
    filterType: document.getElementById('filterType'),
    filterSeverity: document.getElementById('filterSeverity'),
    filterInvoice: document.getElementById('filterInvoice'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    feedbackList: document.getElementById('feedbackList'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    feedbackDetailModal: document.getElementById('feedbackDetailModal'),
    modalBody: document.getElementById('modalBody'),
    summaryElements: {
        total: document.querySelector('[data-summary="total"]'),
        critical: document.querySelector('[data-summary="critical"]'),
        major: document.querySelector('[data-summary="major"]'),
        minor: document.querySelector('[data-summary="minor"]')
    },
    resultCount: document.querySelector('[data-count="results"]')
};

/**
 * Initialize the page
 */
async function init() {
    await loadFeedback();
    attachEventListeners();
}

/**
 * Load feedback from the backend
 */
async function loadFeedback(forceRefresh = false) {
    try {
        showLoadingState();
        
        // Check if feedback is already in localStorage and not forcing refresh
        if (!forceRefresh) {
            const cachedFeedback = localStorage.getItem('allFeedback');
            
            if (cachedFeedback) {
                console.log('Loading feedback from cache');
                state.allFeedback = JSON.parse(cachedFeedback);
                state.filteredFeedback = [...state.allFeedback];
                
                updateSummaryCards();
                renderFeedbackList();
                hideLoadingState();
                return;
            }
        }
        
        // Fetch from API
        console.log('Fetching feedback from API');
        const response = await fetch(API_ENDPOINTS.DATABASE.FETCH_FEEDBACK);
        
        if (!response.ok) {
            throw new Error('Failed to fetch feedback');
        }
        
        const data = await response.json();
        console.log('Feedback fetched successfully:', data);
        
        // Normalize the API response to match expected format
        const normalizedData = data.map(item => ({
            id: item._id?.$oid || item.id || 'N/A',
            invoice_id: item.invoice_id,
            invoice_number: item.invoice_number,
            vendor_name: item.vendor_name,
            feedback_type: item.feedback_type,
            severity: item.severity,
            title: item.title,
            description: item.description,
            expected_result: item.expected_result || '',
            actual_result: item.actual_result || '',
            affected_fields: item.affected_fields || '',
            suggested_fix: item.suggested_fix || '',
            submitted_at: item.submitted_at,
            submitted_by: item.submitted_by || { name: 'Unknown', email: 'unknown@email.com' },
            metadata: item.metadata || {}
        }));
        
        // Store in state and localStorage
        state.allFeedback = normalizedData;
        localStorage.setItem('allFeedback', JSON.stringify(normalizedData));
        
        state.filteredFeedback = [...state.allFeedback];
        
        updateSummaryCards();
        renderFeedbackList();
        hideLoadingState();
        
    } catch (error) {
        console.error('Error loading feedback:', error);
        
        // Try to use cached data on error
        const cachedFeedback = localStorage.getItem('allFeedback');
        if (cachedFeedback) {
            console.log('Using cached feedback due to error');
            state.allFeedback = JSON.parse(cachedFeedback);
        } else {
            // No cached data available, show empty state
            console.log('No cached feedback available');
            state.allFeedback = [];
        }
        
        state.filteredFeedback = [...state.allFeedback];
        
        updateSummaryCards();
        renderFeedbackList();
        hideLoadingState();
    }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Refresh button
    elements.refreshBtn.addEventListener('click', handleRefresh);
    
    // Filter changes
    elements.filterType.addEventListener('change', handleFilterChange);
    elements.filterSeverity.addEventListener('change', handleFilterChange);
    elements.filterInvoice.addEventListener('input', debounce(handleFilterChange, 300));
    
    // Reset filters
    elements.resetFiltersBtn.addEventListener('click', handleResetFilters);
    
    // Modal close
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
    console.log('Refreshing feedback data...');
    await loadFeedback(true); // Force refresh from API
}

/**
 * Handle filter changes
 */
function handleFilterChange() {
    // Update filter state
    state.filters.type = elements.filterType.value;
    state.filters.severity = elements.filterSeverity.value;
    state.filters.invoice = elements.filterInvoice.value.toLowerCase().trim();
    
    // Apply filters
    applyFilters();
    
    // Re-render list
    renderFeedbackList();
}

/**
 * Apply filters to feedback data
 */
function applyFilters() {
    state.filteredFeedback = state.allFeedback.filter(feedback => {
        // Filter by type
        if (state.filters.type && feedback.feedback_type !== state.filters.type) {
            return false;
        }
        
        // Filter by severity
        if (state.filters.severity && feedback.severity !== state.filters.severity) {
            return false;
        }
        
        // Filter by invoice number
        if (state.filters.invoice) {
            const invoiceMatch = feedback.invoice_number.toLowerCase().includes(state.filters.invoice);
            if (!invoiceMatch) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Handle reset filters
 */
function handleResetFilters() {
    elements.filterType.value = '';
    elements.filterSeverity.value = '';
    elements.filterInvoice.value = '';
    
    state.filters = {
        type: '',
        severity: '',
        invoice: ''
    };
    
    state.filteredFeedback = [...state.allFeedback];
    renderFeedbackList();
}

/**
 * Update summary cards
 */
function updateSummaryCards() {
    const summary = {
        total: state.allFeedback.length,
        critical: state.allFeedback.filter(f => f.severity === 'critical').length,
        major: state.allFeedback.filter(f => f.severity === 'major').length,
        minor: state.allFeedback.filter(f => f.severity === 'minor').length
    };
    
    elements.summaryElements.total.textContent = summary.total;
    elements.summaryElements.critical.textContent = summary.critical;
    elements.summaryElements.major.textContent = summary.major;
    elements.summaryElements.minor.textContent = summary.minor;
}

/**
 * Render feedback list
 */
function renderFeedbackList() {
    const list = elements.feedbackList;
    
    // Update result count
    elements.resultCount.textContent = `Showing ${state.filteredFeedback.length} entries`;
    
    // Check if empty
    if (state.filteredFeedback.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    // Clear existing list
    list.innerHTML = '';
    
    // Render each feedback item
    state.filteredFeedback.forEach(feedback => {
        const item = createFeedbackItem(feedback);
        list.appendChild(item);
    });
}

/**
 * Create feedback item element
 */
function createFeedbackItem(feedback) {
    const item = document.createElement('div');
    item.className = 'feedback-item';
    item.dataset.feedbackId = feedback.id;
    
    item.innerHTML = `
        <div class="feedback-item-header">
            <div class="feedback-item-title">
                <h3 class="feedback-title">${escapeHtml(feedback.title)}</h3>
                <div class="feedback-meta">
                    <span>Submitted by ${escapeHtml(feedback.submitted_by.name)}</span>
                    <span>•</span>
                    <span>${formatDate(feedback.submitted_at)}</span>
                </div>
            </div>
            <div class="feedback-badges">
                <span class="badge badge-${feedback.severity}">${capitalize(feedback.severity)}</span>
            </div>
        </div>
        <div class="feedback-item-body">
            <p class="feedback-description">${escapeHtml(feedback.description)}</p>
        </div>
        <div class="feedback-item-footer">
            <div class="feedback-invoice-info">
                Invoice: <span class="invoice-number">${escapeHtml(feedback.invoice_number)}</span> - ${escapeHtml(feedback.vendor_name)}
            </div>
            <div class="feedback-type-badge">${formatFeedbackType(feedback.feedback_type)}</div>
        </div>
    `;
    
    // Add click handler to show details
    item.addEventListener('click', () => showFeedbackDetails(feedback));
    
    return item;
}

/**
 * Show feedback details in modal
 */
function showFeedbackDetails(feedback) {
    const modalBody = elements.modalBody;
    
    modalBody.innerHTML = `
        <div class="feedback-detail-content">
            <div class="detail-section">
                <h3 class="detail-section-title">Basic Information</h3>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Feedback ID:</label>
                        <span>${escapeHtml(feedback.id)}</span>
                    </div>
                    <div class="detail-field">
                        <label>Severity:</label>
                        <span class="badge badge-${feedback.severity}">${capitalize(feedback.severity)}</span>
                    </div>
                    <div class="detail-field">
                        <label>Issue Type:</label>
                        <span>${formatFeedbackType(feedback.feedback_type)}</span>
                    </div>
                    <div class="detail-field">
                        <label>Submitted Date:</label>
                        <span>${formatDateTime(feedback.submitted_at)}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Invoice Information</h3>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Invoice ID:</label>
                        <span>${escapeHtml(feedback.invoice_id)}</span>
                    </div>
                    <div class="detail-field">
                        <label>Invoice Number:</label>
                        <span>${escapeHtml(feedback.invoice_number)}</span>
                    </div>
                    <div class="detail-field">
                        <label>Vendor Name:</label>
                        <span>${escapeHtml(feedback.vendor_name)}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Issue Details</h3>
                <div class="detail-field-full">
                    <label>Title:</label>
                    <p>${escapeHtml(feedback.title)}</p>
                </div>
                <div class="detail-field-full">
                    <label>Description:</label>
                    <p>${escapeHtml(feedback.description)}</p>
                </div>
                ${feedback.expected_result ? `
                    <div class="detail-field-full">
                        <label>Expected Result:</label>
                        <p>${escapeHtml(feedback.expected_result)}</p>
                    </div>
                ` : ''}
                ${feedback.actual_result ? `
                    <div class="detail-field-full">
                        <label>Actual Result:</label>
                        <p>${escapeHtml(feedback.actual_result)}</p>
                    </div>
                ` : ''}
                ${feedback.affected_fields ? `
                    <div class="detail-field-full">
                        <label>Affected Fields:</label>
                        <p>${escapeHtml(feedback.affected_fields)}</p>
                    </div>
                ` : ''}
                ${feedback.suggested_fix ? `
                    <div class="detail-field-full">
                        <label>Suggested Fix:</label>
                        <p>${escapeHtml(feedback.suggested_fix)}</p>
                    </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">Submitted By</h3>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Name:</label>
                        <span>${escapeHtml(feedback.submitted_by.name)}</span>
                    </div>
                    <div class="detail-field">
                        <label>Email:</label>
                        <span>${escapeHtml(feedback.submitted_by.email)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles to body
    addModalStyles();
    
    // Show modal
    elements.feedbackDetailModal.style.display = 'flex';
}

/**
 * Add modal-specific styles to body
 */
function addModalStyles() {
    if (!document.getElementById('modalDynamicStyles')) {
        const style = document.createElement('style');
        style.id = 'modalDynamicStyles';
        style.textContent = `
            .feedback-detail-content { padding: 0; }
            .detail-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border-light); }
            .detail-section:last-child { border-bottom: none; margin-bottom: 0; }
            .detail-section-title { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin: 0 0 1rem 0; }
            .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
            .detail-field { display: flex; flex-direction: column; }
            .detail-field label { font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.25rem; }
            .detail-field span, .detail-field p { font-size: 0.95rem; color: var(--text-primary); margin: 0; }
            .detail-field-full { margin-bottom: 1rem; }
            .detail-field-full:last-child { margin-bottom: 0; }
            .detail-field-full label { display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; }
            .detail-field-full p { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
            @media (max-width: 768px) {
                .detail-grid { grid-template-columns: 1fr; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Close modal
 */
function closeModal() {
    elements.feedbackDetailModal.style.display = 'none';
}

/**
 * Show loading state
 */
function showLoadingState() {
    elements.loadingState.style.display = 'flex';
    elements.emptyState.style.display = 'none';
    elements.feedbackList.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    elements.loadingState.style.display = 'none';
    elements.feedbackList.style.display = 'block';
}

/**
 * Show empty state
 */
function showEmptyState() {
    elements.emptyState.style.display = 'flex';
    elements.feedbackList.style.display = 'none';
}

/**
 * Hide empty state
 */
function hideEmptyState() {
    elements.emptyState.style.display = 'none';
    elements.feedbackList.style.display = 'block';
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Utility: Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Utility: Format feedback type
 */
function formatFeedbackType(type) {
    const typeMap = {
        'ocr_error': 'OCR Error',
        'data_mismatch': 'Data Mismatch',
        'gst_validation_error': 'GST Validation Error',
        'duplicate_detection_error': 'Duplicate Detection Error',
        'amount_calculation_error': 'Amount Calculation Error',
        'hsn_sac_error': 'HSN/SAC Code Error',
        'vendor_details_error': 'Vendor Details Error',
        'line_items_error': 'Line Items Error',
        'other': 'Other Issue'
    };
    return typeMap[type] || type;
}

/**
 * Utility: Format date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

/**
 * Utility: Format date and time
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
