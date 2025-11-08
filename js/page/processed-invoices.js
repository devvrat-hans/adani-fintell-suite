/**
 * Processed Invoices Page
 * Displays processed invoices with their status and API results
 */

// API Endpoints are available globally via window.API_ENDPOINTS
// Loaded from api-endpoints.js script tag in HTML
// Notification System available globally via window.NotificationSystem
// Loaded from notification.js script tag in HTML

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
    console.log('Processed invoices page init started');
    
    // Wait for templates to load (auto-loaded by templates.js)
    // Templates.js will automatically load navbar and sidebar based on placeholders
    if (!document.body.classList.contains('templates-loaded')) {
        console.log('Waiting for templates to load...');
        await new Promise(resolve => {
            document.addEventListener('templatesLoaded', resolve, { once: true });
        });
        console.log('Templates loaded');
    }
    
    // Initialize DOM elements
    initializeElements();

    // Attach event listeners
    attachEventListeners();

    // Load data - always try cache first on page load
    // API fetch only happens if no cache OR when refresh button is clicked
    console.log('Loading data on page init - trying cache first');
    await loadInvoicesData(false);

    // Remove loading state (if not already removed by templates.js)
    document.body.classList.remove('loading-layout');
    
    console.log('Processed invoices page init complete');
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
 * Load invoices data - uses cache-first strategy
 * @param {boolean} forceRefresh - If true, always fetch from API
 */
async function loadInvoicesData(forceRefresh = false) {
    console.log(`Loading invoices data (forceRefresh: ${forceRefresh})`);
    
    // If not forcing refresh, try to load from localStorage first
    if (!forceRefresh) {
        const cached = localStorage.getItem('processed_invoices');
        
        if (cached) {
            console.log('Found cached invoices data - using cached data');
            try {
                state.invoices = JSON.parse(cached);
                
                // Display cached data
                const summary = calculateSummary(state.invoices);
                updateSummary(summary);
                applyFilters();
                
                console.log('Successfully loaded and displayed cached data');
                return; // Exit early - don't fetch from API
            } catch (parseError) {
                console.error('Error parsing cached data:', parseError);
                // If cache is corrupted, clear it and fetch from API
                localStorage.removeItem('processed_invoices');
                localStorage.removeItem('processed_invoices_timestamp');
            }
        } else {
            console.log('No cached data found - will fetch from API');
        }
    } else {
        console.log('Force refresh requested - fetching fresh data from API');
    }
    
    // Fetch from API only if:
    // 1. forceRefresh is true (refresh button clicked), OR
    // 2. No cached data exists
    await fetchProcessedInvoices();
}

/**
 * Fetch processed invoices from API
 */
async function fetchProcessedInvoices() {
    try {
        // Show loading state
        if (elements.tableBody) {
            elements.tableBody.innerHTML = `
                <tr class="loading-state">
                    <td colspan="9" class="text-center">
                        <div class="spinner"></div>
                        <p>Loading processed invoices...</p>
                    </td>
                </tr>
            `;
        }

        // Fetch from API
        const response = await fetch(window.API_ENDPOINTS.FINGUARD.FETCH_PROCESSED_INVOICES, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Fetch processed invoices response:', result);

        // The API returns an array of batch objects, each with _id, results[], and metadata
        // Format: [{ _id: "...", results: [{invoice data}], metadata: {...} }, ...]
        let invoices = [];
        
        if (Array.isArray(result)) {
            // Extract invoices from all batches
            result.forEach(batch => {
                if (batch.results && Array.isArray(batch.results)) {
                    // Each batch can have multiple invoices in results array
                    batch.results.forEach(invoice => {
                        // Attach batch-level metadata to each invoice for easier access
                        invoices.push({
                            ...invoice,
                            batch_id: batch._id,
                            batch_metadata: batch.metadata || {}
                        });
                    });
                }
            });
            
            console.log('Extracted invoices from batch results:', invoices.length);
            console.log('Total batches processed:', result.length);
        } else if (result && result.results && Array.isArray(result.results)) {
            // Single batch format: { _id: {...}, results: [...], metadata: {...} }
            invoices = result.results.map(invoice => ({
                ...invoice,
                batch_id: result._id,
                batch_metadata: result.metadata || {}
            }));
            
            console.log('Extracted invoices from single batch result:', invoices.length);
        } else {
            console.error('Unexpected API response format:', result);
            throw new Error('Invalid API response format');
        }

        // Store invoices in state
        state.invoices = invoices;
        console.log('First invoice sample:', invoices[0]);
        console.log('Invoice fields:', invoices[0] ? Object.keys(invoices[0]) : 'No invoices');
            
        // Store in localStorage for caching with timestamp
        localStorage.setItem('processed_invoices', JSON.stringify(state.invoices));
        localStorage.setItem('processed_invoices_timestamp', Date.now().toString());
        console.log(`Successfully fetched ${state.invoices.length} invoices and cached to localStorage`);
        
        // Calculate summary
        const summary = calculateSummary(state.invoices);
        updateSummary(summary);
        
        // Apply filters and display
        applyFilters();
    } catch (error) {
        console.error('Error fetching processed invoices:', error);
        
        // Try to load from localStorage as fallback
        const cached = localStorage.getItem('processed_invoices');
        if (cached) {
            console.log('Loading from cache...');
            state.invoices = JSON.parse(cached);
            const summary = calculateSummary(state.invoices);
            updateSummary(summary);
            applyFilters();
        } else {
            // Show error state
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
}

/**
 * Calculate summary statistics from invoices
 */
function calculateSummary(invoices) {
    const summary = {
        total: invoices.length,
        success: 0,
        failed: 0,
        processing: 0
    };

    invoices.forEach(invoice => {
        // Calculate status from processing_status
        const processingStatus = invoice.processing_status || {};
        let hasFailures = false;
        
        Object.values(processingStatus).forEach(step => {
            if (step.success === false) {
                hasFailures = true;
            }
        });
        
        if (hasFailures) {
            summary.failed++;
        } else {
            summary.success++;
        }
    });

    return summary;
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
        const searchLower = state.filters.search.toLowerCase();
        filtered = filtered.filter(invoice => 
            invoice.invoice_number?.toLowerCase().includes(searchLower) ||
            invoice.vendor_name?.toLowerCase().includes(searchLower) ||
            invoice.invoice_id?.toLowerCase().includes(searchLower)
        );
    }

    // Apply status filter
    if (state.filters.status) {
        filtered = filtered.filter(invoice => {
            // Calculate status from processing_status
            const processingStatus = invoice.processing_status || {};
            let hasFailures = false;
            
            Object.values(processingStatus).forEach(step => {
                if (step.success === false) {
                    hasFailures = true;
                }
            });
            
            const calculatedStatus = hasFailures ? 'failed' : 'completed';
            return calculatedStatus === state.filters.status;
        });
    }

    // Apply stage filter (check which validation step failed)
    if (state.filters.stage) {
        filtered = filtered.filter(invoice => {
            const processingStatus = invoice.processing_status || {};
            const stage = state.filters.stage;
            
            // Check if the stage exists and has failed
            return processingStatus[stage] && processingStatus[stage].success === false;
        });
    }

    // Apply date range filter
    if (state.filters.dateFrom) {
        filtered = filtered.filter(invoice => {
            const processedDate = invoice.upload_timestamp || invoice.batch_metadata?.processed_at;
            return new Date(processedDate) >= new Date(state.filters.dateFrom);
        });
    }

    if (state.filters.dateTo) {
        filtered = filtered.filter(invoice => {
            const processedDate = invoice.upload_timestamp || invoice.batch_metadata?.processed_at;
            return new Date(processedDate) <= new Date(state.filters.dateTo);
        });
    }

    state.filteredInvoices = filtered;
    renderTable();
    renderPagination();
}

/**
 * Render table with invoices
 */
function renderTable() {
    console.log('renderTable called');
    console.log('Filtered invoices count:', state.filteredInvoices.length);
    if (state.filteredInvoices.length > 0) {
        console.log('First filtered invoice:', state.filteredInvoices[0]);
    }
    
    if (state.filteredInvoices.length === 0) {
        // Determine the appropriate empty state message
        const isFilterApplied = state.filters.search || state.filters.status || state.filters.stage || 
                               state.filters.dateFrom || state.filters.dateTo;
        const hasAnyInvoices = state.invoices.length > 0;
        
        let emptyMessage, emptySubtext;
        if (!hasAnyInvoices) {
            // No data in database at all
            emptyMessage = 'No processed invoices found';
            emptySubtext = 'Processed invoices will appear here once you upload and process invoices.';
        } else if (isFilterApplied) {
            // Data exists but filters exclude all
            emptyMessage = 'No invoices found';
            emptySubtext = 'Try adjusting your filters';
        } else {
            // This shouldn't happen but handle it anyway
            emptyMessage = 'No invoices to display';
            emptySubtext = 'Try refreshing the page';
        }
        
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
                    <h3 class="empty-state-title">${emptyMessage}</h3>
                    <p class="empty-state-text">${emptySubtext}</p>
                </td>
            </tr>
        `;
        return;
    }

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const pageInvoices = state.filteredInvoices.slice(start, end);

    elements.tableBody.innerHTML = pageInvoices.map(invoice => {
        console.log('Rendering invoice:', {
            invoice_number: invoice.invoice_number,
            vendor_name: invoice.vendor_name,
            invoice_amount: invoice.invoice_amount,
            upload_timestamp: invoice.upload_timestamp,
            batch_metadata: invoice.batch_metadata,
            processing_status: invoice.processing_status
        });
        
        // Calculate overall status from processing_status
        const processingStatus = invoice.processing_status || {};
        let overallStatus = 'completed';
        let failedCount = 0;
        
        Object.values(processingStatus).forEach(step => {
            if (step.success === false) {
                failedCount++;
            }
        });
        
        if (failedCount > 0) {
            overallStatus = 'failed';
        }
        
        // Get the processed date - try multiple sources
        const processedDate = invoice.upload_timestamp || 
                             invoice.batch_metadata?.processed_at || 
                             invoice.processed_at;
        
        console.log('Processed date for invoice:', processedDate);
        
        return `
            <tr>
                <td>${invoice.invoice_number || '-'}</td>
                <td>${invoice.vendor_name || '-'}</td>
                <td>${invoice.invoice_amount ? '₹' + formatAmount(invoice.invoice_amount) : '-'}</td>
                <td>${formatDateTime(processedDate)}</td>
                <td><span class="badge badge-${overallStatus}">${overallStatus}</span></td>
                <td>${getFailedStage(invoice)}</td>
                <td>-</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="window.viewProcessingDetails('${invoice.invoice_id || invoice._id}')">View</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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
window.viewProcessingDetails = async function(invoiceId) {
    try {
        // Show loading state in modal
        elements.modalBody.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Loading invoice details...</p>
            </div>
        `;
        elements.modalOverlay.classList.add('active');
        
        // Blur navbar, sidebar, and main content
        const navbar = document.querySelector('.navbar');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.processed-invoices-main');
        if (navbar) {
            navbar.style.filter = 'blur(3px)';
            navbar.style.pointerEvents = 'none';
        }
        if (sidebar) {
            sidebar.style.filter = 'blur(3px)';
            sidebar.style.pointerEvents = 'none';
        }
        if (mainContent) {
            mainContent.style.filter = 'blur(3px)';
            mainContent.style.pointerEvents = 'none';
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Fetch detailed invoice data from the new unified API
        console.log('Fetching processed invoice details for ID:', invoiceId);
        const detailsResponse = await fetch(`https://n8n-n8n.qoezvx.easypanel.host/webhook/f/fetch-processed-invoice-details?invoice_id=${invoiceId}`, {
            method: 'GET'
        });
        
        if (!detailsResponse.ok) {
            throw new Error(`Failed to fetch invoice details: ${detailsResponse.status}`);
        }

        const detailsResult = await detailsResponse.json();
        console.log('Invoice details received:', detailsResult);

        // API returns an array with one item containing all the data
        const invoiceData = Array.isArray(detailsResult) && detailsResult.length > 0 
            ? detailsResult[0] 
            : detailsResult;

        // Display the comprehensive invoice details
        displayProcessedInvoiceDetails(invoiceData);

    } catch (error) {
        console.error('Error loading invoice details:', error);
        elements.modalBody.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <h3 class="error-title">Failed to load invoice details</h3>
                <p class="error-message">${error.message}</p>
                <button class="btn-primary error-close-btn" id="errorCloseBtn">Close</button>
            </div>
        `;
        
        // Attach event listener to the close button
        const errorCloseBtn = document.getElementById('errorCloseBtn');
        if (errorCloseBtn) {
            errorCloseBtn.addEventListener('click', closeModal);
        }
    }
};

/**
 * Display comprehensive processed invoice details from unified API
 */
function displayProcessedInvoiceDetails(invoiceData) {
    // Extract the main data structures
    const invoiceInfo = invoiceData.results && invoiceData.results[0] ? invoiceData.results[0] : {};
    const metadata = invoiceData.metadata || {};
    const processingSummary = invoiceData.processing_summary || {};
    const apiResponsesFull = invoiceData.api_responses_full || {};
    
    // Calculate overall status
    const passedChecks = processingSummary.passed_checks || 0;
    const failedChecks = processingSummary.failed_checks || 0;
    const totalChecks = processingSummary.total_checks || 0;
    const overallStatus = metadata.overall_status || (failedChecks > 0 ? 'failed' : 'completed');
    
    // Get processed date
    const processedDate = metadata.processed_at || invoiceInfo.upload_timestamp;
    
    let detailsHTML = '<div class="invoice-details-sections">';

    // Section 1: Processing Summary
    detailsHTML += `
        <section class="details-section summary-section">
            <h3 class="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
                Processing Summary
            </h3>
            <div class="summary-cards-grid">
                <div class="summary-card">
                    <div class="summary-label">Overall Status</div>
                    <div class="summary-value">
                        <span class="badge badge-large badge-${overallStatus}">${overallStatus.toUpperCase()}</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Checks Passed</div>
                    <div class="summary-value passed-count">${passedChecks}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Checks Failed</div>
                    <div class="summary-value failed-count">${failedChecks}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Total Checks</div>
                    <div class="summary-value">${totalChecks}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Processed Date</div>
                    <div class="summary-value date-value">${formatDateTime(processedDate)}</div>
                </div>
                ${metadata.file_name ? `
                <div class="summary-card">
                    <div class="summary-label">File Name</div>
                    <div class="summary-value" style="font-size: 0.85rem; word-break: break-all;">${metadata.file_name}</div>
                </div>
                ` : ''}
            </div>
        </section>
    `;

    // Section 2: Invoice Information
    detailsHTML += `
        <section class="details-section">
            <h3 class="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Invoice Information
            </h3>
            <div class="detail-grid-2col">
                <div class="detail-item">
                    <span class="detail-label">Invoice ID</span>
                    <span class="detail-value mono">${invoiceInfo.invoice_id || invoiceInfo._id || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Invoice Number</span>
                    <span class="detail-value">${invoiceInfo.invoice_number || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Invoice Date</span>
                    <span class="detail-value">${invoiceInfo.invoice_date ? new Date(invoiceInfo.invoice_date).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Invoice Amount</span>
                    <span class="detail-value amount-highlight">₹${invoiceInfo.invoice_amount ? formatAmount(invoiceInfo.invoice_amount) : 'N/A'}</span>
                </div>
            </div>
        </section>
    `;

    // Section 3: Vendor & Company Information
    detailsHTML += `
        <section class="details-section">
            <h3 class="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
                Vendor & Company Information
            </h3>
            <div class="two-column-layout">
                <div class="column-section vendor-section">
                    <h4 class="column-header">Vendor Details</h4>
                    <div class="detail-grid-1col">
                        <div class="detail-item">
                            <span class="detail-label">Vendor Name</span>
                            <span class="detail-value">${invoiceInfo.vendor_name || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Vendor GSTIN</span>
                            <span class="detail-value mono">${invoiceInfo.vendor_gstin || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="column-section company-section">
                    <h4 class="column-header">Company Details</h4>
                    <div class="detail-grid-1col">
                        <div class="detail-item">
                            <span class="detail-label">Company GSTIN</span>
                            <span class="detail-value mono">${invoiceInfo.company_gstin || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;

    // Section 4: GST & Tax Details
    detailsHTML += `
        <section class="details-section">
            <h3 class="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
                </svg>
                GST & Tax Details
            </h3>
            <div class="detail-grid-3col">
                <div class="detail-item">
                    <span class="detail-label">Subtotal</span>
                    <span class="detail-value amount-highlight">₹${invoiceInfo.subtotal ? formatAmount(invoiceInfo.subtotal) : 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">GST Rate</span>
                    <span class="detail-value">${invoiceInfo.gst_rate || 0}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">CGST Amount</span>
                    <span class="detail-value">₹${invoiceInfo.cgst_amount ? formatAmount(invoiceInfo.cgst_amount) : 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">SGST Amount</span>
                    <span class="detail-value">₹${invoiceInfo.sgst_amount ? formatAmount(invoiceInfo.sgst_amount) : 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">IGST Amount</span>
                    <span class="detail-value">₹${invoiceInfo.igst_amount ? formatAmount(invoiceInfo.igst_amount) : 'N/A'}</span>
                </div>
                ${invoiceInfo.hsn_sac_codes && invoiceInfo.hsn_sac_codes.length > 0 ? `
                <div class="detail-item full-width">
                    <span class="detail-label">HSN/SAC Codes</span>
                    <span class="detail-value">
                        ${invoiceInfo.hsn_sac_codes.map(code => 
                            `<span class="badge badge-code">${code}</span>`
                        ).join(' ')}
                    </span>
                </div>
                ` : ''}
            </div>
        </section>
    `;

    // Section 5: Line Items
    if (invoiceInfo.line_items && invoiceInfo.line_items.length > 0) {
        detailsHTML += `
            <section class="details-section">
                <h3 class="section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    Line Items (${invoiceInfo.line_items.length})
                </h3>
                <div class="responsive-table-wrapper">
                    <table class="line-items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>HSN/SAC</th>
                                <th class="text-right">Quantity</th>
                                <th class="text-right">Rate</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceInfo.line_items.map((item, index) => `
                                <tr>
                                    <td class="description-cell">${item.description || '-'}</td>
                                    <td><span class="badge badge-code">${item.hsn_sac || '-'}</span></td>
                                    <td class="text-right">${item.quantity || '-'}</td>
                                    <td class="text-right amount-cell">₹${item.rate ? formatAmount(item.rate) : '-'}</td>
                                    <td class="text-right amount-cell amount-highlight">₹${item.amount ? formatAmount(item.amount) : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    // Section 6: Validation Results
    if (processingSummary.all_checks && processingSummary.all_checks.length > 0) {
        detailsHTML += `
            <section class="details-section">
                <h3 class="section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    Validation Results
                </h3>
                <div class="validation-results-grid">
                    ${processingSummary.all_checks.map(check => {
                        const checkLabel = formatCheckName(check.check_name);
                        return renderValidationStatusFromCheck(checkLabel, check);
                    }).join('')}
                </div>
            </section>
        `;
    }

    // Section 7: Detailed API Responses (Collapsible)
    if (apiResponsesFull && Object.keys(apiResponsesFull).length > 0) {
        detailsHTML += `
            <section class="details-section">
                <h3 class="section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    Detailed API Responses
                </h3>
                <div class="api-responses-accordion">
                    ${renderAPIResponse('OCR Processing', apiResponsesFull.ocr_processing)}
                    ${renderAPIResponse('Arithmetic Accuracy', apiResponsesFull.arithmetic_accuracy)}
                    ${renderAPIResponse('Price Anomaly Check', apiResponsesFull.price_anomaly_check)}
                    ${renderAPIResponse('Duplicate Detection', apiResponsesFull.duplicate_detection)}
                    ${renderAPIResponse('GST Validation', apiResponsesFull.gst_validation)}
                    ${renderAPIResponse('GST Rate Validation', apiResponsesFull.gst_rate_validation)}
                </div>
            </section>
        `;
    }

    detailsHTML += '</div>';

    elements.modalBody.innerHTML = detailsHTML;
    
    // Attach event listeners for collapsible sections
    attachAccordionListeners();
}

/**
 * Format check name to display name
 */
function formatCheckName(checkName) {
    const checkNameMap = {
        'ocr_extraction': 'OCR Extraction',
        'arithmetic_accuracy': 'Arithmetic Accuracy',
        'price_anomaly_check': 'Price Anomaly Check',
        'duplicate_detection': 'Duplicate Detection',
        'gst_validation': 'GST Validation',
        'gst_rate_validation': 'GST Rate Validation'
    };
    return checkNameMap[checkName] || checkName;
}

/**
 * Render validation status from check object
 */
function renderValidationStatusFromCheck(label, check) {
    if (!check) return '';
    
    const success = check.success === true;
    const statusIcon = success
        ? `<svg class="validation-icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg class="validation-icon-failed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    
    const statusBadge = success
        ? '<span class="validation-badge badge-success-check">Passed</span>'
        : '<span class="validation-badge badge-failed-check">Failed</span>';
    
    return `
        <div class="validation-card ${success ? 'success' : 'failed'}">
            <div class="validation-card-header">
                ${statusIcon}
                <span class="validation-card-label">${label}</span>
            </div>
            <div class="validation-card-body">
                ${statusBadge}
                ${check.comments ? `<p class="validation-card-comment">${check.comments}</p>` : ''}
            </div>
        </div>
    `;
}

/**
 * Render validation status row
 */
function renderValidationStatus(label, statusObj) {
    if (!statusObj) return '';
    
    const success = statusObj.success === true;
    const statusIcon = success
        ? `<svg class="validation-icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg class="validation-icon-failed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    
    const statusBadge = success
        ? '<span class="validation-badge badge-success-check">Passed</span>'
        : '<span class="validation-badge badge-failed-check">Failed</span>';
    
    return `
        <div class="validation-card ${success ? 'success' : 'failed'}">
            <div class="validation-card-header">
                ${statusIcon}
                <span class="validation-card-label">${label}</span>
            </div>
            <div class="validation-card-body">
                ${statusBadge}
                ${statusObj.comments ? `<p class="validation-card-comment">${statusObj.comments}</p>` : ''}
            </div>
        </div>
    `;
}

/**
 * Close modal
 */
function closeModal() {
    elements.modalOverlay.classList.remove('active');
    
    // Remove blur from navbar, sidebar, and main content
    const navbar = document.querySelector('.navbar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.processed-invoices-main');
    if (navbar) {
        navbar.style.filter = 'none';
        navbar.style.pointerEvents = '';
    }
    if (sidebar) {
        sidebar.style.filter = 'none';
        sidebar.style.pointerEvents = '';
    }
    if (mainContent) {
        mainContent.style.filter = 'none';
        mainContent.style.pointerEvents = '';
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Make closeModal available globally
window.closeModal = closeModal;

/**
 * Handle refresh
 */
async function handleRefresh() {
    console.log('Refresh button clicked - forcing API fetch');
    elements.refreshBtn.disabled = true;
    
    // Force refresh from API (true = skip cache)
    await loadInvoicesData(true);
    
    elements.refreshBtn.disabled = false;
}

/**
 * Format date time
 */
function formatDateTime(dateString) {
    if (!dateString) {
        return '-';
    }
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '-';
        }
        return date.toLocaleString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

/**
 * Format amount
 */
function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN').format(amount);
}

/**
 * Get the failed stage for an invoice - returns all failed stages
 */
function getFailedStage(invoice) {
    const failedStages = [];
    const processingStatus = invoice.processing_status || {};
    
    // Stage name mapping for display
    const stageDisplayNames = {
        'ocr_extraction': 'OCR Processing',
        'arithmetic_accuracy': 'Arithmetic Check',
        'price_anomaly_check': 'Price Anomaly',
        'duplicate_detection': 'Duplicate Detection',
        'gst_validation': 'GST Validation',
        'gst_rate_validation': 'GST Rate Validation'
    };
    
    // Check each validation step and collect all failures
    Object.keys(processingStatus).forEach(stageKey => {
        const stage = processingStatus[stageKey];
        if (stage && stage.success === false) {
            const displayName = stageDisplayNames[stageKey] || stageKey;
            failedStages.push(displayName);
        }
    });
    
    // Return formatted badges for all failed stages
    if (failedStages.length === 0) {
        return '<span class="badge badge-success-stage">All Checks Passed</span>';
    }
    
    return failedStages.map(stage => 
        `<span class="badge badge-failed-stage">${stage}</span>`
    ).join(' ');
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
 * Render API Response in collapsible accordion with structured data display
 */
function renderAPIResponse(label, response) {
    if (!response) return '';
    
    const accordionId = label.toLowerCase().replace(/\s+/g, '-');
    const success = response.success === true;
    const statusIcon = success
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color: var(--status-success);"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color: var(--status-error);"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    
    // Format the response data in a user-friendly way
    let contentHTML = '';
    
    if (response.comments) {
        contentHTML += `<p class="api-comments"><strong>Status:</strong> ${response.comments}</p>`;
    }
    
    // Check what type of response we have and format accordingly
    if (response.full_response) {
        const fullResponse = response.full_response;
        
        // Handle error responses
        if (fullResponse.error) {
            contentHTML += `
                <div class="api-error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>${fullResponse.error}</span>
                </div>
            `;
        }
        
        // Handle price anomaly check response
        else if (fullResponse.anomalies || fullResponse.marketComparison) {
            contentHTML += `<div class="api-structured-data">`;
            
            if (fullResponse.summary) {
                contentHTML += `<div class="api-summary">${fullResponse.summary}</div>`;
            }
            
            if (fullResponse.anomalies && fullResponse.anomalies.length > 0) {
                contentHTML += `
                    <h5 class="api-section-title">Anomalies Detected:</h5>
                    <div class="anomalies-list">
                        ${fullResponse.anomalies.map(anomaly => `
                            <div class="anomaly-item">
                                <div class="anomaly-description">${anomaly.description || 'N/A'}</div>
                                <div class="anomaly-details">
                                    ${anomaly.billed_rate ? `<span class="detail-chip">Billed: ₹${formatAmount(anomaly.billed_rate)}</span>` : ''}
                                    ${anomaly.market_rate ? `<span class="detail-chip">Market: ₹${formatAmount(anomaly.market_rate)}</span>` : ''}
                                    ${anomaly.deviation_percent !== null && anomaly.deviation_percent !== undefined ? `<span class="detail-chip alert">${anomaly.deviation_percent}% deviation</span>` : ''}
                                    ${anomaly.issue ? `<span class="detail-chip warning">${anomaly.issue}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            contentHTML += `</div>`;
        }
        
        // Handle duplicate detection response
        else if (fullResponse.is_duplicate !== undefined) {
            contentHTML += `<div class="api-structured-data">`;
            contentHTML += `
                <div class="detail-grid-2col">
                    <div class="detail-item">
                        <span class="detail-label">Is Duplicate</span>
                        <span class="detail-value">${fullResponse.is_duplicate ? 'Yes' : 'No'}</span>
                    </div>
                    ${fullResponse.duplicate_type ? `
                    <div class="detail-item">
                        <span class="detail-label">Duplicate Type</span>
                        <span class="detail-value">${fullResponse.duplicate_type}</span>
                    </div>
                    ` : ''}
                    ${fullResponse.confidence_score !== undefined ? `
                    <div class="detail-item">
                        <span class="detail-label">Confidence Score</span>
                        <span class="detail-value">${fullResponse.confidence_score}%</span>
                    </div>
                    ` : ''}
                    ${fullResponse.matched_invoice_ids && fullResponse.matched_invoice_ids.length > 0 ? `
                    <div class="detail-item full-width">
                        <span class="detail-label">Matched Invoice IDs</span>
                        <span class="detail-value mono">${fullResponse.matched_invoice_ids.join(', ')}</span>
                    </div>
                    ` : ''}
                </div>
            `;
            contentHTML += `</div>`;
        }
        
        // Handle GST validation response
        else if (fullResponse.vendorValidation || fullResponse.companyValidation || fullResponse.gstSummary) {
            contentHTML += `<div class="api-structured-data">`;
            
            if (fullResponse.messages && fullResponse.messages.length > 0) {
                contentHTML += `
                    <div class="validation-messages">
                        ${fullResponse.messages.map(msg => `
                            <div class="validation-message-item">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <polyline points="9 11 12 14 22 4"></polyline>
                                </svg>
                                <span>${msg}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            if (fullResponse.vendorValidation) {
                contentHTML += `
                    <h5 class="api-section-title">Vendor Validation:</h5>
                    <div class="detail-grid-3col">
                        ${fullResponse.vendorValidation.gstin ? `
                        <div class="detail-item">
                            <span class="detail-label">GSTIN</span>
                            <span class="detail-value mono">${fullResponse.vendorValidation.gstin}</span>
                        </div>
                        ` : ''}
                        ${fullResponse.vendorValidation.legalName ? `
                        <div class="detail-item">
                            <span class="detail-label">Legal Name</span>
                            <span class="detail-value">${fullResponse.vendorValidation.legalName}</span>
                        </div>
                        ` : ''}
                        ${fullResponse.vendorValidation.tradeName ? `
                        <div class="detail-item">
                            <span class="detail-label">Trade Name</span>
                            <span class="detail-value">${fullResponse.vendorValidation.tradeName}</span>
                        </div>
                        ` : ''}
                        ${fullResponse.vendorValidation.status ? `
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value"><span class="badge badge-${fullResponse.vendorValidation.active ? 'success' : 'failed'}">${fullResponse.vendorValidation.status}</span></span>
                        </div>
                        ` : ''}
                        ${fullResponse.vendorValidation.businessType ? `
                        <div class="detail-item">
                            <span class="detail-label">Business Type</span>
                            <span class="detail-value">${fullResponse.vendorValidation.businessType}</span>
                        </div>
                        ` : ''}
                        ${fullResponse.vendorValidation.state ? `
                        <div class="detail-item">
                            <span class="detail-label">State</span>
                            <span class="detail-value">${fullResponse.vendorValidation.state}</span>
                        </div>
                        ` : ''}
                    </div>
                `;
            }
            
            contentHTML += `</div>`;
        }
        
        // Handle arithmetic accuracy response
        else if (fullResponse.isValid !== undefined || fullResponse.calculations) {
            contentHTML += `<div class="api-structured-data">`;
            contentHTML += `
                <div class="detail-grid-2col">
                    ${fullResponse.isValid !== undefined ? `
                    <div class="detail-item">
                        <span class="detail-label">Is Valid</span>
                        <span class="detail-value"><span class="badge badge-${fullResponse.isValid ? 'success' : 'failed'}">${fullResponse.isValid ? 'Valid' : 'Invalid'}</span></span>
                    </div>
                    ` : ''}
                    ${fullResponse.errors && fullResponse.errors.length > 0 ? `
                    <div class="detail-item full-width">
                        <span class="detail-label">Errors</span>
                        <span class="detail-value">${fullResponse.errors.join(', ')}</span>
                    </div>
                    ` : ''}
                </div>
            `;
            
            if (fullResponse.calculations) {
                contentHTML += `
                    <h5 class="api-section-title">Calculations:</h5>
                    <div class="detail-grid-3col">
                        ${Object.entries(fullResponse.calculations).map(([key, value]) => `
                            <div class="detail-item">
                                <span class="detail-label">${key}</span>
                                <span class="detail-value">${value !== null && value !== undefined ? (typeof value === 'number' ? '₹' + formatAmount(value) : value) : 'N/A'}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            contentHTML += `</div>`;
        }
        
        // Handle OCR and other generic responses
        else if (fullResponse.data) {
            contentHTML += `<div class="api-success-message">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Data extracted successfully. See invoice information above.</span>
            </div>`;
        }
        
        // Default: Show a simplified message
        else {
            contentHTML += `<div class="api-info-message">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Response data available</span>
            </div>`;
        }
    }
    
    return `
        <div class="accordion-item">
            <div class="accordion-header" data-accordion="${accordionId}">
                <div class="accordion-title">
                    ${statusIcon}
                    <span>${label}</span>
                </div>
                <div class="accordion-toggle">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            <div class="accordion-content" id="accordion-${accordionId}">
                <div class="accordion-content-inner">
                    ${contentHTML}
                </div>
            </div>
        </div>
    `;
}

/**
 * Attach accordion event listeners
 */
function attachAccordionListeners() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionId = this.getAttribute('data-accordion');
            const content = document.getElementById(`accordion-${accordionId}`);
            const isActive = this.classList.contains('active');
            
            // Close all accordion items
            document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('active'));
            document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('active'));
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                this.classList.add('active');
                content.classList.add('active');
            }
        });
    });
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
