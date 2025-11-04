/**
 * Reports Page JavaScript
 * Handles report generation, custom report builder, and report history
 */

// Mock data for report history
const mockReportHistory = [
    {
        id: 1,
        name: 'Monthly Invoice Summary - October 2024',
        type: 'Monthly Invoice Summary',
        generatedOn: '2024-10-31T10:30:00Z',
        dateRange: '2024-10-01 to 2024-10-31',
        format: 'pdf',
        size: '2.4 MB'
    },
    {
        id: 2,
        name: 'GST Compliance Report - Q3 2024',
        type: 'GST Compliance',
        generatedOn: '2024-10-28T14:15:00Z',
        dateRange: '2024-07-01 to 2024-09-30',
        format: 'excel',
        size: '1.8 MB'
    },
    {
        id: 3,
        name: 'Vendor Performance Analysis',
        type: 'Vendor Performance',
        generatedOn: '2024-10-25T09:45:00Z',
        dateRange: '2024-01-01 to 2024-10-25',
        format: 'pdf',
        size: '3.1 MB'
    },
    {
        id: 4,
        name: 'Anomaly Detection Report - October',
        type: 'Anomaly Detection',
        generatedOn: '2024-10-20T16:20:00Z',
        dateRange: '2024-10-01 to 2024-10-20',
        format: 'excel',
        size: '1.2 MB'
    },
    {
        id: 5,
        name: 'Processed Invoices Export',
        type: 'Processed Invoices',
        generatedOn: '2024-10-15T11:00:00Z',
        dateRange: '2024-09-01 to 2024-10-15',
        format: 'csv',
        size: '856 KB'
    },
    {
        id: 6,
        name: 'Purchase Order Status - Q3',
        type: 'Purchase Order Status',
        generatedOn: '2024-10-10T13:30:00Z',
        dateRange: '2024-07-01 to 2024-09-30',
        format: 'pdf',
        size: '2.7 MB'
    }
];

let reportHistory = [...mockReportHistory];

/**
 * Initialize the reports page
 */
function initReports() {
    setupEventListeners();
    populateReportHistory();
    setDefaultDates();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Template generate buttons
    document.querySelectorAll('.btn-generate').forEach(btn => {
        btn.addEventListener('click', handleTemplateGenerate);
    });
    
    // Custom report form
    const customForm = document.getElementById('customReportForm');
    if (customForm) {
        customForm.addEventListener('submit', handleCustomReportSubmit);
    }
    
    // Reset form button
    const resetBtn = document.getElementById('resetFormBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetForm);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    // History search
    const historySearch = document.getElementById('historySearch');
    if (historySearch) {
        historySearch.addEventListener('input', handleHistorySearch);
    }
    
    // History filter
    const historyFilter = document.getElementById('historyFilter');
    if (historyFilter) {
        historyFilter.addEventListener('change', handleHistoryFilter);
    }
}

/**
 * Handle template report generation
 */
function handleTemplateGenerate(event) {
    const template = event.target.dataset.template;
    const templateNames = {
        'monthly-invoice': 'Monthly Invoice Summary',
        'gst-compliance': 'GST Compliance Report',
        'vendor-performance': 'Vendor Performance Report',
        'anomaly-detection': 'Anomaly Detection Report',
        'processed-invoices': 'Processed Invoices Report',
        'purchase-order-status': 'Purchase Order Status Report'
    };
    
    const reportName = templateNames[template];
    
    showLoadingModal();
    
    // Simulate report generation
    setTimeout(() => {
        hideLoadingModal();
        
        // Add to history
        const newReport = {
            id: reportHistory.length + 1,
            name: `${reportName} - ${new Date().toLocaleDateString()}`,
            type: reportName,
            generatedOn: new Date().toISOString(),
            dateRange: 'Last 30 days',
            format: 'pdf',
            size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`
        };
        
        reportHistory.unshift(newReport);
        populateReportHistory();
        
        showNotification('success', `${reportName} generated successfully!`);
    }, 2000);
}

/**
 * Handle custom report form submission
 */
function handleCustomReportSubmit(event) {
    event.preventDefault();
    
    const formData = {
        reportName: document.getElementById('reportName').value,
        reportType: document.getElementById('reportType').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        entityFilter: Array.from(document.getElementById('entityFilter').selectedOptions).map(o => o.value),
        vendorFilter: document.getElementById('vendorFilter').value,
        reportFormat: document.getElementById('reportFormat').value,
        scheduleOption: document.getElementById('scheduleOption').value
    };
    
    showLoadingModal();
    
    // Simulate custom report generation
    setTimeout(() => {
        hideLoadingModal();
        
        // Add to history
        const newReport = {
            id: reportHistory.length + 1,
            name: formData.reportName,
            type: 'Custom Report',
            generatedOn: new Date().toISOString(),
            dateRange: `${formData.startDate} to ${formData.endDate}`,
            format: formData.reportFormat,
            size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`
        };
        
        reportHistory.unshift(newReport);
        populateReportHistory();
        
        // Reset form
        document.getElementById('customReportForm').reset();
        setDefaultDates();
        
        const scheduleText = formData.scheduleOption 
            ? ` and scheduled for ${formData.scheduleOption} generation`
            : '';
        
        showNotification('success', `Custom report "${formData.reportName}" generated successfully${scheduleText}!`);
    }, 2500);
}

/**
 * Handle form reset
 */
function handleResetForm() {
    document.getElementById('customReportForm').reset();
    setDefaultDates();
}

/**
 * Handle refresh
 */
function handleRefresh() {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.style.opacity = '0.6';
    
    setTimeout(() => {
        populateReportHistory();
        btn.disabled = false;
        btn.style.opacity = '1';
        showNotification('info', 'Report history refreshed');
    }, 1000);
}

/**
 * Handle history search
 */
function handleHistorySearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#historyTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

/**
 * Handle history filter
 */
function handleHistoryFilter(event) {
    const filterValue = event.target.value;
    const rows = document.querySelectorAll('#historyTableBody tr');
    
    rows.forEach(row => {
        if (filterValue === 'all') {
            row.style.display = '';
        } else {
            const format = row.querySelector('.report-badge').dataset.format;
            row.style.display = format === filterValue ? '' : 'none';
        }
    });
}

/**
 * Populate report history table
 */
function populateReportHistory() {
    const tbody = document.getElementById('historyTableBody');
    
    if (!tbody) return;
    
    if (reportHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <p>No reports generated yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = reportHistory.map(report => `
        <tr>
            <td><strong>${report.name}</strong></td>
            <td>${report.type}</td>
            <td>${formatDate(report.generatedOn)}</td>
            <td>${report.dateRange}</td>
            <td>
                <span class="report-badge badge-${report.format}" data-format="${report.format}">
                    ${report.format.toUpperCase()}
                </span>
            </td>
            <td>${report.size}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-download" onclick="downloadReport(${report.id})">
                        Download
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteReport(${report.id})">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Download report
 */
window.downloadReport = function(reportId) {
    const report = reportHistory.find(r => r.id === reportId);
    if (report) {
        showLoadingModal();
        setTimeout(() => {
            hideLoadingModal();
            showNotification('success', `Downloading "${report.name}"...`);
        }, 1000);
    }
};

/**
 * Delete report
 */
window.deleteReport = function(reportId) {
    if (confirm('Are you sure you want to delete this report?')) {
        reportHistory = reportHistory.filter(r => r.id !== reportId);
        populateReportHistory();
        showNotification('info', 'Report deleted successfully');
    }
};

/**
 * Set default dates for form
 */
function setDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    
    if (startInput) {
        startInput.value = startDate.toISOString().split('T')[0];
    }
    
    if (endInput) {
        endInput.value = endDate.toISOString().split('T')[0];
    }
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show loading modal
 */
function showLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Hide loading modal
 */
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Show notification
 */
function showNotification(type, message) {
    // Check if notification system exists
    if (typeof window.showNotification === 'function') {
        window.showNotification(type, message);
    } else {
        // Fallback to alert
        alert(message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initReports);
