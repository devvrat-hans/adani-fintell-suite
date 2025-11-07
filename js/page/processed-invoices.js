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

        // Get processed invoice data from state (from fetch-processed-invoices API)
        const processedInvoice = state.invoices.find(inv => (inv.invoice_id || inv._id) === invoiceId);
        if (!processedInvoice) {
            throw new Error('Invoice not found in processed invoices');
        }

        // Fetch detailed invoice data from get-invoice-details API
        console.log('Fetching invoice details for ID:', invoiceId);
        const detailsResponse = await fetch(`${window.API_ENDPOINTS.FINGUARD.GET_INVOICE_DETAILS}?invoice_id=${invoiceId}`, {
            method: 'GET'
        });
        
        if (!detailsResponse.ok) {
            throw new Error(`Failed to fetch invoice details: ${detailsResponse.status}`);
        }

        const detailsResult = await detailsResponse.json();
        console.log('Invoice details received:', detailsResult);

        // API returns an array with one item
        const invoiceDetails = Array.isArray(detailsResult) && detailsResult.length > 0 
            ? detailsResult[0] 
            : detailsResult;

        // Combine both data sources and display
        displayCombinedInvoiceDetails(processedInvoice, invoiceDetails);

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
 * Display combined invoice details from both APIs
 */
function displayCombinedInvoiceDetails(processedInvoice, invoiceDetails) {
    // Calculate overall status from processing_status
    const processingStatus = processedInvoice.processing_status || {};
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
    
    // Get processed date from multiple possible sources
    const processedDate = processedInvoice.upload_timestamp || 
                         processedInvoice.batch_metadata?.processed_at || 
                         processedInvoice.processed_at;
    
    let detailsHTML = '<div class="invoice-details-sections">';

    // Section 1: Processing Status (from fetch-processed-invoices)
    detailsHTML += `
        <section class="details-section">
            <h3 class="section-title">Processing Status</h3>
            <div class="detail-row">
                <span class="detail-label">Overall Status:</span>
                <span class="detail-value"><span class="badge badge-${overallStatus}">${overallStatus}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Processed Date:</span>
                <span class="detail-value">${formatDateTime(processedDate)}</span>
            </div>
            ${overallStatus === 'failed' ? `
            <div class="detail-row">
                <span class="detail-label">Failed Stages:</span>
                <span class="detail-value">${getFailedStage(processedInvoice)}</span>
            </div>
            ` : ''}
        </section>
    `;

    // Section 2: Invoice Information (from get-invoice-details)
    detailsHTML += `
        <section class="details-section">
            <h3 class="section-title">Invoice Information</h3>
            <div class="detail-row">
                <span class="detail-label">Invoice Number:</span>
                <span class="detail-value">${invoiceDetails.invoice_number || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Invoice Date:</span>
                <span class="detail-value">${invoiceDetails.invoice_date ? new Date(invoiceDetails.invoice_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Invoice Amount:</span>
                <span class="detail-value">${invoiceDetails.invoice_amount ? '₹' + formatAmount(invoiceDetails.invoice_amount) : 'N/A'}</span>
            </div>
        </section>
    `;

    // Section 3: Vendor Information (from get-invoice-details)
    detailsHTML += `
        <section class="details-section">
            <h3 class="section-title">Vendor Information</h3>
            <div class="detail-row">
                <span class="detail-label">Vendor Name:</span>
                <span class="detail-value">${invoiceDetails.vendor_name || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Vendor GSTIN:</span>
                <span class="detail-value">${invoiceDetails.vendor_gstin || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Company GSTIN:</span>
                <span class="detail-value">${invoiceDetails.company_gstin || 'N/A'}</span>
            </div>
        </section>
    `;

    // Section 4: GST Details (from get-invoice-details)
    if (invoiceDetails.subtotal || invoiceDetails.gst_rate) {
        detailsHTML += `
            <section class="details-section">
                <h3 class="section-title">GST Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Subtotal:</span>
                    <span class="detail-value">${invoiceDetails.subtotal ? '₹' + formatAmount(invoiceDetails.subtotal) : 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">GST Rate:</span>
                    <span class="detail-value">${invoiceDetails.gst_rate ? invoiceDetails.gst_rate + '%' : 'N/A'}</span>
                </div>
                ${invoiceDetails.cgst_amount ? `
                <div class="detail-row">
                    <span class="detail-label">CGST:</span>
                    <span class="detail-value">₹${formatAmount(invoiceDetails.cgst_amount)}</span>
                </div>
                ` : ''}
                ${invoiceDetails.sgst_amount ? `
                <div class="detail-row">
                    <span class="detail-label">SGST:</span>
                    <span class="detail-value">₹${formatAmount(invoiceDetails.sgst_amount)}</span>
                </div>
                ` : ''}
                ${invoiceDetails.igst_amount ? `
                <div class="detail-row">
                    <span class="detail-label">IGST:</span>
                    <span class="detail-value">₹${formatAmount(invoiceDetails.igst_amount)}</span>
                </div>
                ` : ''}
            </section>
        `;
    }

    // Section 5: Line Items (from get-invoice-details)
    if (invoiceDetails.line_items && invoiceDetails.line_items.length > 0) {
        detailsHTML += `
            <section class="details-section">
                <h3 class="section-title">Line Items</h3>
                <div class="line-items-table">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-lighter); text-align: left;">
                                <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">Description</th>
                                <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">HSN/SAC</th>
                                <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">Qty</th>
                                <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">Rate</th>
                                <th style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceDetails.line_items.map(item => `
                                <tr>
                                    <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-light);">${item.description || '-'}</td>
                                    <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-light);">${item.hsn_sac || '-'}</td>
                                    <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-light);">${item.quantity || '-'}</td>
                                    <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-light);">₹${item.rate ? formatAmount(item.rate) : '-'}</td>
                                    <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-light); text-align: right;">₹${item.amount ? formatAmount(item.amount) : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    // Section 6: Validation Results (from fetch-processed-invoices)
    if (processedInvoice.processing_status) {
        detailsHTML += `
            <section class="details-section">
                <h3 class="section-title">Validation Results</h3>
                ${renderValidationStatus('OCR Extraction', processedInvoice.processing_status.ocr_extraction)}
                ${renderValidationStatus('Arithmetic Accuracy', processedInvoice.processing_status.arithmetic_accuracy)}
                ${renderValidationStatus('Price Anomaly Check', processedInvoice.processing_status.price_anomaly_check)}
                ${renderValidationStatus('Duplicate Detection', processedInvoice.processing_status.duplicate_detection)}
                ${renderValidationStatus('GST Validation', processedInvoice.processing_status.gst_validation)}
                ${renderValidationStatus('GST Rate Validation', processedInvoice.processing_status.gst_rate_validation)}
            </section>
        `;
    }

    detailsHTML += '</div>';

    elements.modalBody.innerHTML = detailsHTML;
}

/**
 * Render validation status row
 */
function renderValidationStatus(label, statusObj) {
    if (!statusObj) return '';
    
    const success = statusObj.success === true;
    const statusIcon = success
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" style="color: var(--status-success);"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" style="color: var(--status-error);"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    
    const statusBadge = success
        ? '<span class="badge badge-success" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Passed</span>'
        : '<span class="badge badge-failed" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Failed</span>';
    
    return `
        <div class="validation-row">
            <div class="validation-left">
                <div class="validation-icon">${statusIcon}</div>
                <span class="validation-label">${label}</span>
            </div>
            <div class="validation-right">
                ${statusBadge}
                ${statusObj.comments ? `<span class="validation-comment">${statusObj.comments}</span>` : ''}
            </div>
        </div>
    `;
}

/**
 * Close modal
 */
function closeModal() {
    elements.modalOverlay.classList.remove('active');
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
