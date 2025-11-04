/**
 * Vendor Database Page Script
 * Manages vendor listing, search, and pagination
 */

// Mock vendor data
const mockVendors = [
    {
        vendorCode: "VEN-001",
        vendorName: "ABC Suppliers Pvt Ltd",
        gstNumber: "27AABCU9603R1ZM",
        contactPerson: "Rajesh Kumar",
        email: "rajesh@abcsuppliers.com",
        phone: "+91 9876543210",
        address: "Mumbai, Maharashtra",
        status: "active"
    },
    {
        vendorCode: "VEN-002",
        vendorName: "XYZ Industries Ltd",
        gstNumber: "29AACFX1234E1ZN",
        contactPerson: "Priya Sharma",
        email: "priya@xyzindustries.com",
        phone: "+91 9876543211",
        address: "Bangalore, Karnataka",
        status: "active"
    },
    {
        vendorCode: "VEN-003",
        vendorName: "Global Traders Co",
        gstNumber: "07AADCG5678F1ZO",
        contactPerson: "Amit Patel",
        email: "amit@globaltraders.com",
        phone: "+91 9876543212",
        address: "Delhi, Delhi",
        status: "inactive"
    },
    {
        vendorCode: "VEN-004",
        vendorName: "Tech Solutions Pvt Ltd",
        gstNumber: "24AAFCT9012G1ZP",
        contactPerson: "Neha Gupta",
        email: "neha@techsolutions.com",
        phone: "+91 9876543213",
        address: "Ahmedabad, Gujarat",
        status: "active"
    },
    {
        vendorCode: "VEN-005",
        vendorName: "Prime Materials Ltd",
        gstNumber: "33AAGCP3456H1ZQ",
        contactPerson: "Vikram Singh",
        email: "vikram@primematerials.com",
        phone: "+91 9876543214",
        address: "Chennai, Tamil Nadu",
        status: "active"
    },
    {
        vendorCode: "VEN-006",
        vendorName: "Mega Distributors",
        gstNumber: "09AAHCD7890I1ZR",
        contactPerson: "Sneha Reddy",
        email: "sneha@megadistributors.com",
        phone: "+91 9876543215",
        address: "Hyderabad, Telangana",
        status: "active"
    },
    {
        vendorCode: "VEN-007",
        vendorName: "Elite Enterprises",
        gstNumber: "19AAICE2345J1ZS",
        contactPerson: "Rahul Verma",
        email: "rahul@eliteenterprises.com",
        phone: "+91 9876543216",
        address: "Pune, Maharashtra",
        status: "inactive"
    },
    {
        vendorCode: "VEN-008",
        vendorName: "Supreme Products Ltd",
        gstNumber: "06AAJCS6789K1ZT",
        contactPerson: "Anjali Mehta",
        email: "anjali@supremeproducts.com",
        phone: "+91 9876543217",
        address: "Jaipur, Rajasthan",
        status: "active"
    },
    {
        vendorCode: "VEN-009",
        vendorName: "Royal Suppliers Co",
        gstNumber: "22AAKRC0123L1ZU",
        contactPerson: "Suresh Kumar",
        email: "suresh@royalsuppliers.com",
        phone: "+91 9876543218",
        address: "Kolkata, West Bengal",
        status: "active"
    },
    {
        vendorCode: "VEN-010",
        vendorName: "Bright Industries",
        gstNumber: "36AALBI4567M1ZV",
        contactPerson: "Kavita Shah",
        email: "kavita@brightindustries.com",
        phone: "+91 9876543219",
        address: "Surat, Gujarat",
        status: "active"
    },
    {
        vendorCode: "VEN-011",
        vendorName: "Unity Traders Pvt Ltd",
        gstNumber: "23AAMUT8901N1ZW",
        contactPerson: "Deepak Joshi",
        email: "deepak@unitytraders.com",
        phone: "+91 9876543220",
        address: "Indore, Madhya Pradesh",
        status: "inactive"
    },
    {
        vendorCode: "VEN-012",
        vendorName: "Perfect Solutions Ltd",
        gstNumber: "27AANPS2345O1ZX",
        contactPerson: "Pooja Kapoor",
        email: "pooja@perfectsolutions.com",
        phone: "+91 9876543221",
        address: "Nagpur, Maharashtra",
        status: "active"
    }
];

// State management
const state = {
    vendors: [...mockVendors],
    filteredVendors: [...mockVendors],
    currentPage: 1,
    itemsPerPage: 10,
    searchQuery: ""
};

// DOM Elements
let searchInput;
let refreshBtn;
let tableBody;
let prevPageBtn;
let nextPageBtn;
let pageNumbersContainer;
let showingStart;
let showingEnd;
let totalVendors;

/**
 * Initialize the vendor database page
 */
function init() {
    // Get DOM elements
    searchInput = document.getElementById('search-input');
    refreshBtn = document.getElementById('refresh-btn');
    tableBody = document.getElementById('vendor-table-body');
    prevPageBtn = document.getElementById('prev-page');
    nextPageBtn = document.getElementById('next-page');
    pageNumbersContainer = document.getElementById('page-numbers');
    showingStart = document.getElementById('showing-start');
    showingEnd = document.getElementById('showing-end');
    totalVendors = document.getElementById('total-vendors');

    // Add event listeners
    attachEventListeners();

    // Initial render
    renderTable();
    updatePagination();
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Search input
    searchInput.addEventListener('input', handleSearch);

    // Refresh button
    refreshBtn.addEventListener('click', handleRefresh);

    // Pagination buttons
    prevPageBtn.addEventListener('click', () => changePage(state.currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(state.currentPage + 1));
}

/**
 * Handle search functionality
 * @param {Event} event - Input event
 */
function handleSearch(event) {
    state.searchQuery = event.target.value.toLowerCase().trim();
    
    if (state.searchQuery === "") {
        state.filteredVendors = [...state.vendors];
    } else {
        state.filteredVendors = state.vendors.filter(vendor => {
            return (
                vendor.vendorCode.toLowerCase().includes(state.searchQuery) ||
                vendor.vendorName.toLowerCase().includes(state.searchQuery) ||
                vendor.gstNumber.toLowerCase().includes(state.searchQuery) ||
                vendor.contactPerson.toLowerCase().includes(state.searchQuery) ||
                vendor.email.toLowerCase().includes(state.searchQuery) ||
                vendor.phone.includes(state.searchQuery) ||
                vendor.address.toLowerCase().includes(state.searchQuery)
            );
        });
    }

    state.currentPage = 1;
    renderTable();
    updatePagination();
}

/**
 * Handle refresh functionality
 */
function handleRefresh() {
    // Reset state
    state.vendors = [...mockVendors];
    state.filteredVendors = [...mockVendors];
    state.currentPage = 1;
    state.searchQuery = "";
    searchInput.value = "";

    // Re-render
    renderTable();
    updatePagination();

    // Show success notification
    if (window.showNotification) {
        window.showNotification('Vendor list refreshed successfully', 'success');
    }
}

/**
 * Render the vendor table
 */
function renderTable() {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const vendorsToDisplay = state.filteredVendors.slice(startIndex, endIndex);

    if (vendorsToDisplay.length === 0) {
        renderEmptyState();
        return;
    }

    tableBody.innerHTML = vendorsToDisplay.map(vendor => `
        <tr>
            <td>${vendor.vendorCode}</td>
            <td>${vendor.vendorName}</td>
            <td>${vendor.gstNumber}</td>
            <td>${vendor.contactPerson}</td>
            <td>${vendor.email}</td>
            <td>${vendor.phone}</td>
            <td>${vendor.address}</td>
            <td>
                <span class="status-badge ${vendor.status}">
                    ${vendor.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewVendor('${vendor.vendorCode}')">View</button>
                    <button class="btn-action edit" onclick="editVendor('${vendor.vendorCode}')">Edit</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render empty state when no vendors found
 */
function renderEmptyState() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="9">
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-text">No vendors found</div>
                    <div class="empty-state-subtext">
                        ${state.searchQuery ? 'Try adjusting your search criteria' : 'Add vendors to get started'}
                    </div>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(state.filteredVendors.length / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endIndex = Math.min(state.currentPage * state.itemsPerPage, state.filteredVendors.length);

    // Update info text
    showingStart.textContent = state.filteredVendors.length > 0 ? startIndex : 0;
    showingEnd.textContent = endIndex;
    totalVendors.textContent = state.filteredVendors.length;

    // Update button states
    prevPageBtn.disabled = state.currentPage === 1;
    nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;

    // Render page numbers
    renderPageNumbers(totalPages);
}

/**
 * Render page number buttons
 * @param {number} totalPages - Total number of pages
 */
function renderPageNumbers(totalPages) {
    if (totalPages <= 1) {
        pageNumbersContainer.innerHTML = '';
        return;
    }

    let pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
        pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
        if (state.currentPage <= 3) {
            pageNumbers = [1, 2, 3, 4, '...', totalPages];
        } else if (state.currentPage >= totalPages - 2) {
            pageNumbers = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pageNumbers = [1, '...', state.currentPage - 1, state.currentPage, state.currentPage + 1, '...', totalPages];
        }
    }

    pageNumbersContainer.innerHTML = pageNumbers.map(page => {
        if (page === '...') {
            return '<span class="page-ellipsis">...</span>';
        }
        return `
            <button 
                class="page-number ${page === state.currentPage ? 'active' : ''}" 
                onclick="changePage(${page})"
            >
                ${page}
            </button>
        `;
    }).join('');
}

/**
 * Change to a specific page
 * @param {number} pageNumber - Page number to navigate to
 */
function changePage(pageNumber) {
    const totalPages = Math.ceil(state.filteredVendors.length / state.itemsPerPage);
    
    if (pageNumber < 1 || pageNumber > totalPages) {
        return;
    }

    state.currentPage = pageNumber;
    renderTable();
    updatePagination();

    // Scroll to top of table
    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * View vendor details
 * @param {string} vendorCode - Vendor code to view
 */
function viewVendor(vendorCode) {
    console.log('Viewing vendor:', vendorCode);
    // TODO: Implement view vendor functionality
    if (window.showNotification) {
        window.showNotification(`Viewing details for vendor: ${vendorCode}`, 'info');
    }
}

/**
 * Edit vendor details
 * @param {string} vendorCode - Vendor code to edit
 */
function editVendor(vendorCode) {
    console.log('Editing vendor:', vendorCode);
    // TODO: Implement edit vendor functionality
    if (window.showNotification) {
        window.showNotification(`Edit functionality for vendor ${vendorCode} coming soon`, 'info');
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);

// Export functions for global access
window.changePage = changePage;
window.viewVendor = viewVendor;
window.editVendor = editVendor;
