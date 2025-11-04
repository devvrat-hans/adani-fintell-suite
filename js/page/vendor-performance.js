/**
 * Adani Fintell Suite - Vendor Performance Page
 * Displays vendor performance metrics and analytics
 */

'use strict';

// State management
let performanceData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

/**
 * Initialize the page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add templates-loaded class to body
    document.body.classList.add('templates-loaded');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadPerformanceData();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
}

/**
 * Load vendor performance data
 */
async function loadPerformanceData() {
    try {
        // For now, use mock data. Later, fetch from API
        performanceData = generateMockPerformanceData();
        filteredData = [...performanceData];
        
        // Render the data
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error loading performance data:', error);
        showError('Failed to load vendor performance data');
    }
}

/**
 * Generate mock performance data
 */
function generateMockPerformanceData() {
    const mockData = [];
    const vendors = [
        { code: 'VEND001', name: 'ABC Suppliers Pvt Ltd' },
        { code: 'VEND002', name: 'XYZ Industries' },
        { code: 'VEND003', name: 'Tech Solutions Inc' },
        { code: 'VEND004', name: 'Global Traders' },
        { code: 'VEND005', name: 'Prime Materials Co' },
        { code: 'VEND006', name: 'Elite Services Ltd' },
        { code: 'VEND007', name: 'Quality Products Inc' },
        { code: 'VEND008', name: 'Reliable Suppliers' },
        { code: 'VEND009', name: 'Fast Logistics Co' },
        { code: 'VEND010', name: 'Premium Materials Ltd' }
    ];
    
    vendors.forEach(vendor => {
        const totalPOs = Math.floor(Math.random() * 100) + 20;
        const completedPOs = Math.floor(totalPOs * (0.6 + Math.random() * 0.4));
        const onTimeDelivery = Math.floor(60 + Math.random() * 40);
        const qualityRating = (3 + Math.random() * 2).toFixed(1);
        const totalValue = (Math.random() * 9000000 + 1000000).toFixed(2);
        const avgResponseTime = Math.floor(Math.random() * 48) + 2;
        const performanceScore = Math.floor(60 + Math.random() * 40);
        
        mockData.push({
            vendor_code: vendor.code,
            vendor_name: vendor.name,
            total_pos: totalPOs,
            completed_pos: completedPOs,
            on_time_delivery: onTimeDelivery,
            quality_rating: parseFloat(qualityRating),
            total_value: totalValue,
            avg_response_time: avgResponseTime,
            performance_score: performanceScore
        });
    });
    
    // Sort by performance score descending
    return mockData.sort((a, b) => b.performance_score - a.performance_score);
}

/**
 * Handle search
 */
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    filteredData = performanceData.filter(vendor => {
        return vendor.vendor_name.toLowerCase().includes(searchTerm) ||
               vendor.vendor_code.toLowerCase().includes(searchTerm);
    });
    
    currentPage = 1;
    renderTable();
    updatePagination();
}

/**
 * Handle refresh
 */
async function handleRefresh() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('refreshing');
    }
    
    await loadPerformanceData();
    
    if (refreshBtn) {
        setTimeout(() => {
            refreshBtn.classList.remove('refreshing');
        }, 500);
    }
}

/**
 * Render table
 */
function renderTable() {
    const tbody = document.getElementById('performance-table-body');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Check if there's data
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">No Performance Data Found</h3>
                    <p class="empty-state-description">Try adjusting your search criteria</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Render rows
    pageData.forEach(vendor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vendor.vendor_code}</td>
            <td><strong>${vendor.vendor_name}</strong></td>
            <td>${vendor.total_pos}</td>
            <td>${vendor.completed_pos}</td>
            <td>
                <span class="percentage ${getPercentageClass(vendor.on_time_delivery)}">
                    ${vendor.on_time_delivery}%
                </span>
            </td>
            <td>₹${formatNumber(vendor.total_value)}</td>
            <td>${vendor.avg_response_time} hrs</td>
            <td>${renderPerformanceScore(vendor.performance_score)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view-details" onclick="viewDetails('${vendor.vendor_code}')" title="View detailed analytics">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                        Details
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Get percentage class based on value
 */
function getPercentageClass(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
}

/**
 * Render rating stars
 */
function renderRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '<div class="rating-stars">';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            `;
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            `;
        } else {
            starsHTML += `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            `;
        }
    }
    
    starsHTML += `</div>`;
    return starsHTML;
}

/**
 * Render performance score badge
 */
function renderPerformanceScore(score) {
    let scoreClass = '';
    if (score >= 90) scoreClass = 'excellent';
    else if (score >= 75) scoreClass = 'good';
    else if (score >= 60) scoreClass = 'average';
    else scoreClass = 'poor';
    
    return `<span class="score-badge ${scoreClass}">${score}</span>`;
}

/**
 * Update pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    // Update info
    document.getElementById('showing-start').textContent = filteredData.length > 0 ? startIndex + 1 : 0;
    document.getElementById('showing-end').textContent = endIndex;
    document.getElementById('total-vendors').textContent = filteredData.length;
    
    // Update buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Update page numbers
    renderPageNumbers(totalPages);
}

/**
 * Render page numbers
 */
function renderPageNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById('page-numbers');
    if (!pageNumbersContainer) return;
    
    pageNumbersContainer.innerHTML = '';
    
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => changePage(i);
        pageNumbersContainer.appendChild(pageBtn);
    }
}

/**
 * Change page
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTable();
    updatePagination();
}

/**
 * View vendor details
 */
function viewDetails(vendorCode) {
    console.log('Viewing details for vendor:', vendorCode);
    
    // Find vendor data
    const vendor = performanceData.find(v => v.vendor_code === vendorCode);
    if (!vendor) {
        showError('Vendor not found');
        return;
    }
    
    // Show modal with detailed information
    showPerformanceModal(vendor);
}

/**
 * Show performance modal
 */
function showPerformanceModal(vendor) {
    const modal = document.getElementById('performance-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-vendor-name');
    
    if (!modal || !modalBody || !modalTitle) return;
    
    // Update modal title
    modalTitle.textContent = `${vendor.vendor_name} - Performance Analytics`;
    
    // Generate modal content
    modalBody.innerHTML = `
        <!-- Key Metrics Grid -->
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Performance Score</div>
                <div class="metric-value">${vendor.performance_score}</div>
                <div class="metric-trend ${vendor.performance_score >= 75 ? 'positive' : 'negative'}">
                    ${vendor.performance_score >= 75 ? '↑ Excellent' : '↓ Needs Improvement'}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">On-Time Delivery</div>
                <div class="metric-value">${vendor.on_time_delivery}%</div>
                <div class="metric-trend ${vendor.on_time_delivery >= 80 ? 'positive' : 'negative'}">
                    ${vendor.on_time_delivery >= 80 ? '↑ Above Target' : '↓ Below Target'}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Value</div>
                <div class="metric-value">₹${formatNumber(vendor.total_value)}</div>
                <div class="metric-trend positive">↑ +12% vs last quarter</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Response Time</div>
                <div class="metric-value">${vendor.avg_response_time} hrs</div>
                <div class="metric-trend ${vendor.avg_response_time <= 24 ? 'positive' : 'negative'}">
                    ${vendor.avg_response_time <= 24 ? '↑ Fast' : '↓ Slow'}
                </div>
            </div>
        </div>
        
        <!-- Order Statistics -->
        <div class="performance-section">
            <h4 class="section-title">Order Statistics</h4>
            <div class="detail-row">
                <span class="detail-label">Total Purchase Orders</span>
                <span class="detail-value">${vendor.total_pos}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Completed Orders</span>
                <span class="detail-value">${vendor.completed_pos}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Pending Orders</span>
                <span class="detail-value">${vendor.total_pos - vendor.completed_pos}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Completion Rate</span>
                <span class="detail-value">${Math.round((vendor.completed_pos / vendor.total_pos) * 100)}%</span>
            </div>
        </div>
        
        <!-- Vendor Information -->
        <div class="performance-section">
            <h4 class="section-title">Vendor Information</h4>
            <div class="detail-row">
                <span class="detail-label">Vendor Code</span>
                <span class="detail-value">${vendor.vendor_code}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Vendor Name</span>
                <span class="detail-value">${vendor.vendor_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Average Response Time</span>
                <span class="detail-value">${vendor.avg_response_time} hours</span>
            </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="performance-section">
            <h4 class="section-title">Recent Activity</h4>
            <ul class="activity-list">
                ${generateRecentActivity(vendor)}
            </ul>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Generate recent activity
 */
function generateRecentActivity(vendor) {
    const activities = [
        { title: 'Purchase Order Completed', date: '2 days ago', status: 'completed' },
        { title: 'Payment Processed', date: '5 days ago', status: 'completed' },
        { title: 'Quality Inspection Passed', date: '1 week ago', status: 'approved' },
        { title: 'New Purchase Order Created', date: '2 weeks ago', status: 'pending' }
    ];
    
    return activities.map(activity => `
        <li class="activity-item">
            <div class="activity-info">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-date">${activity.date}</div>
            </div>
            <span class="activity-status status-badge ${activity.status}">${activity.status}</span>
        </li>
    `).join('');
}

/**
 * Close performance modal
 */
function closePerformanceModal() {
    const modal = document.getElementById('performance-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Show error message
 */
function showError(message) {
    alert(message);
}
