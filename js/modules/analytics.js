/**
 * Analytics Module Controller
 * Cross-module insights and reporting
 */

import { AnalyticsAPI } from '../core/api.js';
import chartRenderer from '../features/chart-renderer.js';
import { formatCurrency, formatPercentage } from '../utils/formatters.js';
import app from '../core/app.js';

/**
 * Analytics Controller class
 */
class AnalyticsController {
    constructor() {
        this.dashboardData = null;
        this.currentTimeRange = '30days';
    }

    /**
     * Initialize Analytics module
     */
    async init() {
        console.log('Initializing Analytics module...');
        
        this.setupEventListeners();
        await this.loadDashboardData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Time range selector
        const timeRangeSelector = document.querySelector('[data-time-range]');
        if (timeRangeSelector) {
            timeRangeSelector.addEventListener('change', (e) => {
                this.currentTimeRange = e.target.value;
                this.loadDashboardData();
            });
        }

        // Refresh button
        const refreshBtn = document.querySelector('[data-refresh-analytics]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboardData());
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            app.showLoading('Loading analytics data...');
            
            this.dashboardData = await AnalyticsAPI.getDashboardData(this.currentTimeRange);
            
            this.renderKPIs();
            this.renderCharts();
            
            app.hideLoading();
        } catch (error) {
            app.hideLoading();
            console.error('Failed to load analytics data:', error);
            app.showNotification('Failed to load analytics', 'error');
        }
    }

    /**
     * Render KPIs
     */
    renderKPIs() {
        const kpiContainer = document.querySelector('[data-kpi-container]');
        if (!kpiContainer || !this.dashboardData) return;

        const kpis = this.dashboardData.kpis || {};

        kpiContainer.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <h3 class="kpi-card__label">Total Invoices</h3>
                    <p class="kpi-card__value">${kpis.totalInvoices || 0}</p>
                    <span class="kpi-card__change kpi-card__change--${kpis.invoicesChange >= 0 ? 'positive' : 'negative'}">
                        ${kpis.invoicesChange >= 0 ? '↑' : '↓'} ${Math.abs(kpis.invoicesChange || 0)}%
                    </span>
                </div>

                <div class="kpi-card">
                    <h3 class="kpi-card__label">Total Value</h3>
                    <p class="kpi-card__value">${formatCurrency(kpis.totalValue || 0)}</p>
                    <span class="kpi-card__change kpi-card__change--${kpis.valueChange >= 0 ? 'positive' : 'negative'}">
                        ${kpis.valueChange >= 0 ? '↑' : '↓'} ${Math.abs(kpis.valueChange || 0)}%
                    </span>
                </div>

                <div class="kpi-card">
                    <h3 class="kpi-card__label">Anomalies Detected</h3>
                    <p class="kpi-card__value">${kpis.anomaliesDetected || 0}</p>
                    <span class="kpi-card__change kpi-card__change--${kpis.anomaliesChange <= 0 ? 'positive' : 'negative'}">
                        ${kpis.anomaliesChange >= 0 ? '↑' : '↓'} ${Math.abs(kpis.anomaliesChange || 0)}%
                    </span>
                </div>

                <div class="kpi-card">
                    <h3 class="kpi-card__label">Processing Time</h3>
                    <p class="kpi-card__value">${kpis.avgProcessingTime || 0}s</p>
                    <span class="kpi-card__change kpi-card__change--${kpis.timeChange <= 0 ? 'positive' : 'negative'}">
                        ${kpis.timeChange >= 0 ? '↑' : '↓'} ${Math.abs(kpis.timeChange || 0)}%
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Render charts
     */
    renderCharts() {
        if (!this.dashboardData) return;

        // Invoice trend chart
        const invoiceTrendContainer = document.querySelector('[data-chart-invoice-trend]');
        if (invoiceTrendContainer && this.dashboardData.invoiceTrend) {
            chartRenderer.renderLineChart(invoiceTrendContainer, this.dashboardData.invoiceTrend);
        }

        // Risk distribution chart
        const riskDistContainer = document.querySelector('[data-chart-risk-distribution]');
        if (riskDistContainer && this.dashboardData.riskDistribution) {
            chartRenderer.renderPieChart(riskDistContainer, this.dashboardData.riskDistribution);
        }

        // Top vendors chart
        const topVendorsContainer = document.querySelector('[data-chart-top-vendors]');
        if (topVendorsContainer && this.dashboardData.topVendors) {
            chartRenderer.renderBarChart(topVendorsContainer, this.dashboardData.topVendors);
        }

        // Processing success rate
        const successRateContainer = document.querySelector('[data-chart-success-rate]');
        if (successRateContainer) {
            chartRenderer.renderProgressChart(successRateContainer, this.dashboardData.successRate || 0);
        }
    }
}

const analyticsController = new AnalyticsController();
export default analyticsController;
