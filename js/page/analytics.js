/**
 * Analytics Dashboard JavaScript
 * Handles data visualization and analytics display
 */

// Mock data for analytics
const mockData = {
    summary: {
        totalInvoices: 1247,
        invoiceChange: 12.5,
        totalSpend: 45678900,
        spendChange: 8.3,
        complianceRate: 94.5,
        complianceChange: 2.1,
        anomalyCount: 43,
        anomalyChange: -5.2
    },
    invoiceTrends: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        processed: [280, 310, 295, 362],
        failed: [12, 8, 15, 8]
    },
    spendByCategory: {
        labels: ['Raw Materials', 'Equipment', 'Services', 'Utilities', 'Transportation', 'Others'],
        values: [15234500, 8765400, 7654300, 5432100, 4321000, 4271600]
    },
    topVendors: {
        labels: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'],
        values: [8765400, 7654300, 6543200, 5432100, 4321000]
    },
    efficiency: {
        avgProcessingTime: 3.2,
        successRate: 96.5,
        ocrAccuracy: 89.3,
        validationSuccess: 94.8
    },
    anomalyTrends: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        duplicate: [8, 6, 9, 5],
        price: [5, 7, 4, 6],
        gst: [3, 2, 4, 3],
        risk: [6, 5, 8, 4]
    },
    riskDistribution: {
        low: 156,
        medium: 67,
        high: 24
    },
    vendorAnalytics: {
        totalVendors: 342,
        avgVendorSpend: 133564,
        avgPaymentDays: 28,
        onTimePayments: 87.5
    },
    gstCompliance: {
        gstValidation: 94.5,
        hsnSacMatch: 91.2,
        gstRateAccuracy: 96.8
    },
    paymentPatterns: {
        labels: ['0-15 Days', '16-30 Days', '31-45 Days', '46-60 Days', '60+ Days'],
        values: [234, 456, 312, 178, 67]
    }
};

/**
 * Helper function to properly size canvas with device pixel ratio support
 */
function setupCanvas(canvas) {
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    // Get the size the canvas should display on screen
    const rect = container.getBoundingClientRect();
    
    // Set the canvas actual size (scaled by device pixel ratio)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Set the canvas display size (CSS pixels)
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Scale all drawing operations by the device pixel ratio
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    return { width: rect.width, height: rect.height, dpr };
}

/**
 * Initialize the analytics dashboard
 */
function initAnalytics() {
    // Wait for DOM to fully render before initializing charts
    setTimeout(() => {
        loadSummaryMetrics();
        createInvoiceTrendsChart();
        createSpendAnalysisChart();
        createTopVendorsChart();
        updateEfficiencyMetrics();
        createAnomalyTrendsChart();
        updateRiskDistribution();
        updateVendorAnalytics();
        updateGSTCompliance();
        createPaymentPatternsChart();
    }, 100);
    
    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    document.getElementById('timeRangeFilter').addEventListener('change', handleTimeRangeChange);
}

/**
 * Load summary metrics
 */
function loadSummaryMetrics() {
    const { summary } = mockData;
    
    // Total Invoices
    document.getElementById('totalInvoices').textContent = summary.totalInvoices.toLocaleString();
    document.getElementById('invoiceChange').textContent = `+${summary.invoiceChange}%`;
    document.getElementById('invoiceChange').className = `metric-change ${summary.invoiceChange >= 0 ? 'positive' : 'negative'}`;
    
    // Total Spend
    document.getElementById('totalSpend').textContent = formatCurrency(summary.totalSpend);
    document.getElementById('spendChange').textContent = `+${summary.spendChange}%`;
    document.getElementById('spendChange').className = `metric-change ${summary.spendChange >= 0 ? 'positive' : 'negative'}`;
    
    // Compliance Rate
    document.getElementById('complianceRate').textContent = `${summary.complianceRate}%`;
    document.getElementById('complianceChange').textContent = `+${summary.complianceChange}%`;
    document.getElementById('complianceChange').className = `metric-change ${summary.complianceChange >= 0 ? 'positive' : 'negative'}`;
    
    // Anomaly Count
    document.getElementById('anomalyCount').textContent = summary.anomalyCount;
    document.getElementById('anomalyChange').textContent = `${summary.anomalyChange}%`;
    document.getElementById('anomalyChange').className = `metric-change ${summary.anomalyChange >= 0 ? 'negative' : 'positive'}`;
}

/**
 * Create Invoice Trends Chart
 */
function createInvoiceTrendsChart() {
    const canvas = document.getElementById('invoiceTrendsCanvas');
    const ctx = canvas.getContext('2d');
    const { invoiceTrends } = mockData;
    
    // Simple bar chart implementation
    drawBarChart(ctx, canvas, {
        labels: invoiceTrends.labels,
        datasets: [
            { label: 'Processed', data: invoiceTrends.processed, color: '#0B74B0' },
            { label: 'Failed', data: invoiceTrends.failed, color: '#DC3545' }
        ]
    });
}

/**
 * Create Spend Analysis Chart (Pie/Doughnut)
 */
function createSpendAnalysisChart() {
    const canvas = document.getElementById('spendAnalysisCanvas');
    const ctx = canvas.getContext('2d');
    const { spendByCategory } = mockData;
    
    drawDoughnutChart(ctx, canvas, {
        labels: spendByCategory.labels,
        data: spendByCategory.values,
        colors: ['#0B74B0', '#75479C', '#BD3861', '#28A745', '#FFC107', '#17A2B8']
    });
}

/**
 * Create Top Vendors Chart
 */
function createTopVendorsChart() {
    const canvas = document.getElementById('topVendorsCanvas');
    const ctx = canvas.getContext('2d');
    const { topVendors } = mockData;
    
    drawHorizontalBarChart(ctx, canvas, {
        labels: topVendors.labels,
        data: topVendors.values,
        color: '#75479C'
    });
}

/**
 * Update Efficiency Metrics
 */
function updateEfficiencyMetrics() {
    const { efficiency } = mockData;
    
    document.getElementById('avgProcessingTime').textContent = `${efficiency.avgProcessingTime}s`;
    document.getElementById('avgTimeProgress').style.width = `${(efficiency.avgProcessingTime / 10) * 100}%`;
    
    document.getElementById('successRate').textContent = `${efficiency.successRate}%`;
    document.getElementById('successRateProgress').style.width = `${efficiency.successRate}%`;
    
    document.getElementById('ocrAccuracy').textContent = `${efficiency.ocrAccuracy}%`;
    document.getElementById('ocrAccuracyProgress').style.width = `${efficiency.ocrAccuracy}%`;
    
    document.getElementById('validationSuccess').textContent = `${efficiency.validationSuccess}%`;
    document.getElementById('validationSuccessProgress').style.width = `${efficiency.validationSuccess}%`;
}

/**
 * Create Anomaly Trends Chart
 */
function createAnomalyTrendsChart() {
    const canvas = document.getElementById('anomalyTrendsCanvas');
    const ctx = canvas.getContext('2d');
    const { anomalyTrends } = mockData;
    
    drawLineChart(ctx, canvas, {
        labels: anomalyTrends.labels,
        datasets: [
            { label: 'Duplicate', data: anomalyTrends.duplicate, color: '#BD3861' },
            { label: 'Price', data: anomalyTrends.price, color: '#FFC107' },
            { label: 'GST', data: anomalyTrends.gst, color: '#0B74B0' },
            { label: 'Risk', data: anomalyTrends.risk, color: '#DC3545' }
        ]
    });
}

/**
 * Update Risk Distribution
 */
function updateRiskDistribution() {
    const { riskDistribution } = mockData;
    const total = riskDistribution.low + riskDistribution.medium + riskDistribution.high;
    
    // Low Risk
    document.getElementById('lowRiskCount').textContent = riskDistribution.low;
    document.getElementById('lowRiskProgress').style.width = `${(riskDistribution.low / total) * 100}%`;
    document.getElementById('lowRiskPercentage').textContent = `${((riskDistribution.low / total) * 100).toFixed(1)}%`;
    
    // Medium Risk
    document.getElementById('mediumRiskCount').textContent = riskDistribution.medium;
    document.getElementById('mediumRiskProgress').style.width = `${(riskDistribution.medium / total) * 100}%`;
    document.getElementById('mediumRiskPercentage').textContent = `${((riskDistribution.medium / total) * 100).toFixed(1)}%`;
    
    // High Risk
    document.getElementById('highRiskCount').textContent = riskDistribution.high;
    document.getElementById('highRiskProgress').style.width = `${(riskDistribution.high / total) * 100}%`;
    document.getElementById('highRiskPercentage').textContent = `${((riskDistribution.high / total) * 100).toFixed(1)}%`;
}

/**
 * Update Vendor Analytics
 */
function updateVendorAnalytics() {
    const { vendorAnalytics } = mockData;
    
    document.getElementById('totalVendors').textContent = vendorAnalytics.totalVendors;
    document.getElementById('avgVendorSpend').textContent = formatCurrency(vendorAnalytics.avgVendorSpend);
    document.getElementById('avgPaymentDays').textContent = `${vendorAnalytics.avgPaymentDays} days`;
    document.getElementById('onTimePayments').textContent = `${vendorAnalytics.onTimePayments}%`;
}

/**
 * Update GST Compliance Metrics
 */
function updateGSTCompliance() {
    const { gstCompliance } = mockData;
    
    updateCircularProgress('gstValidationProgress', gstCompliance.gstValidation);
    document.getElementById('gstValidationValue').textContent = `${gstCompliance.gstValidation}%`;
    
    updateCircularProgress('hsnSacProgress', gstCompliance.hsnSacMatch);
    document.getElementById('hsnSacValue').textContent = `${gstCompliance.hsnSacMatch}%`;
    
    updateCircularProgress('gstRateProgress', gstCompliance.gstRateAccuracy);
    document.getElementById('gstRateValue').textContent = `${gstCompliance.gstRateAccuracy}%`;
}

/**
 * Create Payment Patterns Chart
 */
function createPaymentPatternsChart() {
    const canvas = document.getElementById('paymentPatternsCanvas');
    const ctx = canvas.getContext('2d');
    const { paymentPatterns } = mockData;
    
    drawBarChart(ctx, canvas, {
        labels: paymentPatterns.labels,
        datasets: [
            { label: 'Invoices', data: paymentPatterns.values, color: '#0B74B0' }
        ]
    });
}

/**
 * Update circular progress
 */
function updateCircularProgress(elementId, percentage) {
    const circle = document.getElementById(elementId);
    const circumference = 283; // 2 * π * 45
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

/**
 * Draw Bar Chart
 */
function drawBarChart(ctx, canvas, config) {
    const { width, height } = setupCanvas(canvas);
    
    const leftPadding = 50;
    const rightPadding = 20;
    const topPadding = 30;
    const bottomPadding = 60;
    
    const chartWidth = width - leftPadding - rightPadding;
    const chartHeight = height - topPadding - bottomPadding;
    
    const maxValue = Math.max(...config.datasets.flatMap(d => d.data)) * 1.1; // Add 10% headroom
    const datasetCount = config.datasets.length;
    const groupCount = config.labels.length;
    
    const groupWidth = chartWidth / groupCount;
    const barWidth = Math.min((groupWidth * 0.7) / datasetCount, 50);
    const barGap = 4;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = topPadding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(leftPadding, y);
        ctx.lineTo(width - rightPadding, y);
        ctx.stroke();
        
        // Draw y-axis labels
        const value = maxValue - (maxValue / 5) * i;
        ctx.fillStyle = '#6C757D';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(value).toString(), leftPadding - 10, y);
    }
    
    // Draw axes
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftPadding, topPadding);
    ctx.lineTo(leftPadding, height - bottomPadding);
    ctx.lineTo(width - rightPadding, height - bottomPadding);
    ctx.stroke();
    
    // Draw bars
    config.labels.forEach((label, i) => {
        const groupX = leftPadding + (i * groupWidth) + (groupWidth / 2) - ((datasetCount * barWidth + (datasetCount - 1) * barGap) / 2);
        
        config.datasets.forEach((dataset, j) => {
            const value = dataset.data[i];
            const barHeight = (value / maxValue) * chartHeight;
            const x = groupX + j * (barWidth + barGap);
            const y = height - bottomPadding - barHeight;
            
            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(x, y, x, height - bottomPadding);
            gradient.addColorStop(0, dataset.color);
            gradient.addColorStop(1, dataset.color + '99');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw bar border
            ctx.strokeStyle = dataset.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);
            
            // Draw value on top of bar if space allows
            if (barHeight > 20) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(value.toString(), x + barWidth / 2, y + 10);
            }
        });
        
        // Draw label (horizontal)
        ctx.fillStyle = '#4A4A4A';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, leftPadding + (i * groupWidth) + (groupWidth / 2), height - bottomPadding + 10);
    });
    
    // Draw legend
    if (datasetCount > 1) {
        let legendX = leftPadding;
        const legendY = height - 20;
        
        config.datasets.forEach((dataset, i) => {
            // Draw legend box
            ctx.fillStyle = dataset.color;
            ctx.fillRect(legendX, legendY, 12, 12);
            ctx.strokeStyle = dataset.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(legendX, legendY, 12, 12);
            
            // Draw legend label
            ctx.fillStyle = '#1A1A1A';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(dataset.label, legendX + 18, legendY + 6);
            
            legendX += ctx.measureText(dataset.label).width + 40;
        });
    }
}

/**
 * Draw Doughnut Chart
 */
function drawDoughnutChart(ctx, canvas, config) {
    const { width, height } = setupCanvas(canvas);
    
    const legendWidth = 180;
    const chartSize = Math.min(width - legendWidth - 40, height - 40);
    const centerX = chartSize / 2 + 20;
    const centerY = height / 2;
    const radius = chartSize / 2 - 10;
    const innerRadius = radius * 0.65;
    
    const total = config.data.reduce((sum, val) => sum + val, 0);
    let currentAngle = -Math.PI / 2;
    
    ctx.clearRect(0, 0, width, height);
    
    config.data.forEach((value, i) => {
        const sliceAngle = (value / total) * Math.PI * 2;
        
        // Draw slice
        ctx.fillStyle = config.colors[i];
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fill();
        
        // Draw slice border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.stroke();
        
        // Draw percentage on slice if > 5%
        const percentage = (value / total) * 100;
        if (percentage > 5) {
            const midAngle = currentAngle + sliceAngle / 2;
            const labelRadius = innerRadius + (radius - innerRadius) / 2;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage.toFixed(1)}%`, labelX, labelY);
        }
        
        currentAngle += sliceAngle;
    });
    
    // Draw center circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw total in center
    ctx.fillStyle = '#1A1A1A';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatCurrency(total), centerX, centerY - 10);
    
    ctx.fillStyle = '#6C757D';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Total Spend', centerX, centerY + 15);
    
    // Draw legend
    const legendX = chartSize + 40;
    const legendY = 30;
    const legendItemHeight = 35;
    
    config.labels.forEach((label, i) => {
        const y = legendY + i * legendItemHeight;
        
        // Draw color box
        ctx.fillStyle = config.colors[i];
        ctx.fillRect(legendX, y, 16, 16);
        ctx.strokeStyle = config.colors[i];
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, y, 16, 16);
        
        // Draw label
        ctx.fillStyle = '#1A1A1A';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(label, legendX + 24, y);
        
        // Draw value
        const percentage = ((config.data[i] / total) * 100).toFixed(1);
        ctx.fillStyle = '#6C757D';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${formatCurrency(config.data[i])} (${percentage}%)`, legendX + 24, y + 14);
    });
}

/**
 * Draw Horizontal Bar Chart
 */
function drawHorizontalBarChart(ctx, canvas, config) {
    const { width, height } = setupCanvas(canvas);
    
    const leftPadding = 120;
    const rightPadding = 100;
    const topPadding = 30;
    const bottomPadding = 20;
    
    const chartWidth = width - leftPadding - rightPadding;
    const chartHeight = height - topPadding - bottomPadding;
    
    const maxValue = Math.max(...config.data);
    const barCount = config.labels.length;
    const totalBarSpace = chartHeight / barCount;
    const barHeight = Math.min(totalBarSpace * 0.6, 40);
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const x = leftPadding + (chartWidth / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, topPadding);
        ctx.lineTo(x, height - bottomPadding);
        ctx.stroke();
    }
    
    config.labels.forEach((label, i) => {
        const value = config.data[i];
        const barWidth = (value / maxValue) * chartWidth;
        const y = topPadding + (i * totalBarSpace) + (totalBarSpace - barHeight) / 2;
        
        // Draw bar background
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(leftPadding, y, chartWidth, barHeight);
        
        // Draw bar
        const gradient = ctx.createLinearGradient(leftPadding, 0, leftPadding + barWidth, 0);
        gradient.addColorStop(0, config.color);
        gradient.addColorStop(1, config.color + 'CC');
        ctx.fillStyle = gradient;
        ctx.fillRect(leftPadding, y, barWidth, barHeight);
        
        // Draw bar border
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(leftPadding, y, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = '#1A1A1A';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, leftPadding - 15, y + barHeight / 2);
        
        // Draw value
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatCurrency(value), leftPadding + barWidth + 10, y + barHeight / 2);
    });
}

/**
 * Draw Line Chart
 */
function drawLineChart(ctx, canvas, config) {
    const { width, height } = setupCanvas(canvas);
    
    const leftPadding = 50;
    const rightPadding = 20;
    const topPadding = 30;
    const bottomPadding = 60;
    
    const chartWidth = width - leftPadding - rightPadding;
    const chartHeight = height - topPadding - bottomPadding;
    
    const maxValue = Math.max(...config.datasets.flatMap(d => d.data)) * 1.1; // Add 10% headroom
    const stepX = chartWidth / (config.labels.length - 1);
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = topPadding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(leftPadding, y);
        ctx.lineTo(width - rightPadding, y);
        ctx.stroke();
        
        // Draw y-axis labels
        const value = maxValue - (maxValue / 5) * i;
        ctx.fillStyle = '#6C757D';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(value).toString(), leftPadding - 10, y);
    }
    
    // Draw axes
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftPadding, topPadding);
    ctx.lineTo(leftPadding, height - bottomPadding);
    ctx.lineTo(width - rightPadding, height - bottomPadding);
    ctx.stroke();
    
    // Draw lines with area fill
    config.datasets.forEach(dataset => {
        // Draw area
        ctx.fillStyle = dataset.color + '20'; // 20 = ~12% opacity
        ctx.beginPath();
        
        dataset.data.forEach((value, i) => {
            const x = leftPadding + i * stepX;
            const y = height - bottomPadding - (value / maxValue) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, height - bottomPadding);
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.lineTo(leftPadding + (config.labels.length - 1) * stepX, height - bottomPadding);
        ctx.closePath();
        ctx.fill();
        
        // Draw line
        ctx.strokeStyle = dataset.color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        dataset.data.forEach((value, i) => {
            const x = leftPadding + i * stepX;
            const y = height - bottomPadding - (value / maxValue) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        dataset.data.forEach((value, i) => {
            const x = leftPadding + i * stepX;
            const y = height - bottomPadding - (value / maxValue) * chartHeight;
            
            // Draw point shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.arc(x, y + 1, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw point
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = dataset.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw value above point
            ctx.fillStyle = '#1A1A1A';
            ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(value.toString(), x, y - 10);
        });
    });
    
    // Draw x-axis labels
    config.labels.forEach((label, i) => {
        const x = leftPadding + i * stepX;
        ctx.fillStyle = '#4A4A4A';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, height - bottomPadding + 10);
    });
    
    // Draw legend
    if (config.datasets.length > 1) {
        let legendX = leftPadding;
        const legendY = height - 20;
        
        config.datasets.forEach((dataset, i) => {
            // Draw legend line
            ctx.strokeStyle = dataset.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(legendX, legendY + 6);
            ctx.lineTo(legendX + 20, legendY + 6);
            ctx.stroke();
            
            // Draw legend point
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(legendX + 10, legendY + 6, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = dataset.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(legendX + 10, legendY + 6, 4, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw legend label
            ctx.fillStyle = '#1A1A1A';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(dataset.label, legendX + 26, legendY + 6);
            
            legendX += ctx.measureText(dataset.label).width + 50;
        });
    }
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(2)}K`;
    }
    return `₹${amount.toFixed(2)}`;
}

/**
 * Refresh data
 */
function refreshData() {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.style.opacity = '0.6';
    
    // Simulate API call
    setTimeout(() => {
        initAnalytics();
        btn.disabled = false;
        btn.style.opacity = '1';
    }, 1000);
}

/**
 * Handle time range change
 */
function handleTimeRangeChange(event) {
    const timeRange = event.target.value;
    console.log('Time range changed to:', timeRange);
    // In real implementation, fetch data for selected time range
    refreshData();
}

/**
 * Download chart as image
 */
function downloadChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Get the chart title from the parent card
    const chartCard = canvas.closest('.chart-card');
    const chartTitle = chartCard.querySelector('.chart-title').textContent;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.download = `${chartTitle.replace(/\s+/g, '_').toLowerCase()}_${new Date().getTime()}.png`;
    
    // Convert canvas to data URL
    link.href = canvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Initialize download buttons
 */
function initDownloadButtons() {
    const downloadButtons = document.querySelectorAll('.btn-download-chart');
    downloadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const canvasId = button.getAttribute('data-chart');
            downloadChart(canvasId);
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    initDownloadButtons();
});
