/**
 * Formatters Utilities
 * Number, date, currency formatting functions for Adani-Fintell-Suite
 */

/**
 * Format number with Indian number system
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatIndianNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    
    const x = num.toString().split('.');
    let lastThree = x[0].substring(x[0].length - 3);
    const otherNumbers = x[0].substring(0, x[0].length - 3);
    
    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }
    
    const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    
    if (x.length > 1) {
        return result + '.' + x[1];
    }
    
    return result;
};

/**
 * Format currency in INR
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show ₹ symbol
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, showSymbol = true) => {
    if (amount === null || amount === undefined || isNaN(amount)) return showSymbol ? '₹0.00' : '0.00';
    
    const formatted = formatIndianNumber(parseFloat(amount).toFixed(2));
    return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format date to display format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string (default: 'DD MMM YYYY')
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'DD MMM YYYY') => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    
    const pad = (n) => n.toString().padStart(2, '0');
    
    return format
        .replace('DD', pad(day))
        .replace('D', day)
        .replace('MMMM', fullMonths[month])
        .replace('MMM', months[month])
        .replace('MM', pad(month + 1))
        .replace('M', month + 1)
        .replace('YYYY', year)
        .replace('YY', year.toString().slice(-2))
        .replace('HH', pad(hours))
        .replace('H', hours)
        .replace('mm', pad(minutes))
        .replace('m', minutes)
        .replace('ss', pad(seconds))
        .replace('s', seconds);
};

/**
 * Format date time to display format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date time
 */
export const formatDateTime = (date) => {
    return formatDate(date, 'DD MMM YYYY HH:mm');
};

/**
 * Format date to API format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
    return formatDate(date, 'YYYY-MM-DD');
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - d;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 1) => {
    if (total === 0) return '0%';
    const percent = (value / total) * 100;
    return `${percent.toFixed(decimals)}%`;
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
        return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
    }
    
    return phone;
};

/**
 * Format GST number
 * @param {string} gstNumber - GST number to format
 * @returns {string} Formatted GST number
 */
export const formatGSTNumber = (gstNumber) => {
    if (!gstNumber) return '';
    
    const cleaned = gstNumber.replace(/\s/g, '').toUpperCase();
    
    if (cleaned.length === 15) {
        return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 7)} ${cleaned.substring(7, 11)} ${cleaned.substring(11, 12)} ${cleaned.substring(12, 13)} ${cleaned.substring(13, 14)} ${cleaned.substring(14)}`;
    }
    
    return gstNumber;
};

/**
 * Format invoice number
 * @param {string} invoiceNumber - Invoice number to format
 * @returns {string} Formatted invoice number
 */
export const formatInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber) return '';
    return invoiceNumber.toUpperCase().trim();
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Format status text
 * @param {string} status - Status to format
 * @returns {string} Formatted status
 */
export const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

/**
 * Format risk level
 * @param {number} score - Risk score
 * @returns {Object} Risk level with label and color
 */
export const formatRiskLevel = (score) => {
    if (score < 30) {
        return { label: 'Low', color: '#10b981', score };
    } else if (score < 70) {
        return { label: 'Medium', color: '#f59e0b', score };
    } else {
        return { label: 'High', color: '#ef4444', score };
    }
};

/**
 * Parse amount from string
 * @param {string} amountStr - Amount string
 * @returns {number} Parsed amount
 */
export const parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    
    // Remove currency symbols and commas
    const cleaned = amountStr.replace(/[₹,\s]/g, '');
    const amount = parseFloat(cleaned);
    
    return isNaN(amount) ? 0 : amount;
};

/**
 * Format table cell based on type
 * @param {*} value - Value to format
 * @param {string} type - Type of value (currency, date, percentage, etc.)
 * @returns {string} Formatted value
 */
export const formatTableCell = (value, type = 'text') => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
        case 'currency':
            return formatCurrency(value);
        case 'date':
            return formatDate(value);
        case 'datetime':
            return formatDateTime(value);
        case 'percentage':
            return `${value}%`;
        case 'number':
            return formatIndianNumber(value);
        case 'filesize':
            return formatFileSize(value);
        default:
            return value.toString();
    }
};
