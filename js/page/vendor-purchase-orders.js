/**
 * Adani Fintell Suite - Vendor Purchase Orders Page
 * Displays purchase orders linked to vendors
 */

'use strict';

// State management
let vendorPOsData = [];
let filteredPOsData = [];
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
    loadVendorPOs();
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
 * Load vendor purchase orders
 */
async function loadVendorPOs() {
    try {
        // For now, use mock data. Later, fetch from API
        vendorPOsData = generateMockVendorPOData();
        filteredPOsData = [...vendorPOsData];
        
        // Render the data
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error loading vendor POs:', error);
        showError('Failed to load vendor purchase orders');
    }
}

/**
 * Generate mock vendor PO data
 */
function generateMockVendorPOData() {
    const mockData = [];
    const vendors = [
        { code: 'VEND001', name: 'ABC Suppliers Pvt Ltd' },
        { code: 'VEND002', name: 'XYZ Industries' },
        { code: 'VEND003', name: 'Tech Solutions Inc' },
        { code: 'VEND004', name: 'Global Traders' },
        { code: 'VEND005', name: 'Prime Materials Co' }
    ];
    
    const statuses = ['pending', 'approved', 'rejected', 'completed'];
    
    for (let i = 1; i <= 25; i++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const poDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const deliveryDate = new Date(poDate.getTime() + (Math.random() * 60 + 15) * 24 * 60 * 60 * 1000);
        
        mockData.push({
            vendor_code: vendor.code,
            vendor_name: vendor.name,
            po_number: `PO-2024-${String(i).padStart(4, '0')}`,
            po_date: poDate.toISOString().split('T')[0],
            po_amount: (Math.random() * 900000 + 100000).toFixed(2),
            delivery_date: deliveryDate.toISOString().split('T')[0],
            status: status,
            items_count: Math.floor(Math.random() * 10) + 1
        });
    }
    
    return mockData;
}

/**
 * Handle search
 */
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    filteredPOsData = vendorPOsData.filter(po => {
        return po.vendor_name.toLowerCase().includes(searchTerm) ||
               po.po_number.toLowerCase().includes(searchTerm) ||
               po.vendor_code.toLowerCase().includes(searchTerm);
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
    
    await loadVendorPOs();
    
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
    const tbody = document.getElementById('vendor-po-table-body');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredPOsData.slice(startIndex, endIndex);
    
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
                    <h3 class="empty-state-title">No Purchase Orders Found</h3>
                    <p class="empty-state-description">Try adjusting your search criteria</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Render rows
    pageData.forEach(po => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${po.vendor_code}</td>
            <td>${po.vendor_name}</td>
            <td><strong>${po.po_number}</strong></td>
            <td>${formatDate(po.po_date)}</td>
            <td>₹${formatNumber(po.po_amount)}</td>
            <td>${formatDate(po.delivery_date)}</td>
            <td><span class="status-badge ${po.status}">${po.status}</span></td>
            <td>${po.items_count}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewPO('${po.po_number}')" title="View details">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                    </button>
                    <button class="btn-action btn-edit" onclick="editPO('${po.po_number}')" title="Edit PO">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Update pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredPOsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredPOsData.length);
    
    // Update info
    document.getElementById('showing-start').textContent = filteredPOsData.length > 0 ? startIndex + 1 : 0;
    document.getElementById('showing-end').textContent = endIndex;
    document.getElementById('total-pos').textContent = filteredPOsData.length;
    
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
    const totalPages = Math.ceil(filteredPOsData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTable();
    updatePagination();
}

/**
 * View PO details
 */
function viewPO(poNumber) {
    console.log('Viewing PO:', poNumber);
    // Navigate to PO details page or show modal
    window.location.href = `edit-purchase-order.html?po=${poNumber}`;
}

/**
 * Edit PO
 */
function editPO(poNumber) {
    console.log('Editing PO:', poNumber);
    window.location.href = `edit-purchase-order.html?po=${poNumber}`;
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
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
