/**
 * Chart Renderer
 * Data visualization using vanilla JavaScript and Canvas/SVG
 */

import { formatCurrency, formatDate } from '../utils/formatters.js';
import { CHART_COLORS } from '../utils/constants.js';

/**
 * Chart Renderer class
 */
export class ChartRenderer {
    /**
     * Render bar chart
     * @param {HTMLElement} container - Container element
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     */
    renderBarChart(container, data, options = {}) {
        const { labels, values, colors = CHART_COLORS.PRIMARY } = data;
        const { height = 300, showValues = true } = options;

        const maxValue = Math.max(...values);
        const chartHTML = `
            <div class="chart chart--bar" style="height: ${height}px">
                <div class="chart__bars">
                    ${values.map((value, index) => {
                        const percentage = (value / maxValue) * 100;
                        const color = colors[index % colors.length];
                        return `
                            <div class="chart__bar-wrapper">
                                <div class="chart__bar" style="height: ${percentage}%; background-color: ${color}">
                                    ${showValues ? `<span class="chart__bar-value">${value}</span>` : ''}
                                </div>
                                <span class="chart__bar-label">${labels[index]}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        container.innerHTML = chartHTML;
    }

    /**
     * Render line chart using Canvas
     * @param {HTMLElement} container - Container element
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     */
    renderLineChart(container, data, options = {}) {
        const { labels, datasets } = data;
        const { height = 300, width = container.offsetWidth } = options;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.className = 'chart chart--line';
        
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        this.drawLineChart(ctx, { labels, datasets }, { width, height });
    }

    /**
     * Draw line chart on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} data - Chart data
     * @param {Object} dimensions - Canvas dimensions
     */
    drawLineChart(ctx, data, dimensions) {
        const { labels, datasets } = data;
        const { width, height } = dimensions;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Find max value across all datasets
        const allValues = datasets.flatMap(ds => ds.values);
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues, 0);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw datasets
        datasets.forEach((dataset, datasetIndex) => {
            const color = dataset.color || CHART_COLORS.PRIMARY[datasetIndex];
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            dataset.values.forEach((value, index) => {
                const x = padding + (chartWidth / (labels.length - 1)) * index;
                const y = padding + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // Draw point
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.stroke();
        });

        // Draw labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((label, index) => {
            const x = padding + (chartWidth / (labels.length - 1)) * index;
            ctx.fillText(label, x, height - padding + 20);
        });
    }

    /**
     * Render pie chart
     * @param {HTMLElement} container - Container element
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     */
    renderPieChart(container, data, options = {}) {
        const { labels, values, colors = CHART_COLORS.PRIMARY } = data;
        const { size = 200 } = options;

        const total = values.reduce((sum, val) => sum + val, 0);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        canvas.className = 'chart chart--pie';

        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 10;

        let currentAngle = -Math.PI / 2;

        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const color = colors[index % colors.length];

            // Draw slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            currentAngle += sliceAngle;
        });

        // Add legend
        this.renderLegend(container, labels, colors, values);
    }

    /**
     * Render chart legend
     * @param {HTMLElement} container - Container element
     * @param {Array} labels - Labels
     * @param {Array} colors - Colors
     * @param {Array} values - Values
     */
    renderLegend(container, labels, colors, values) {
        const legend = document.createElement('div');
        legend.className = 'chart__legend';
        legend.innerHTML = labels.map((label, index) => `
            <div class="chart__legend-item">
                <span class="chart__legend-color" style="background-color: ${colors[index % colors.length]}"></span>
                <span class="chart__legend-label">${label}</span>
                <span class="chart__legend-value">${values[index]}</span>
            </div>
        `).join('');

        container.appendChild(legend);
    }

    /**
     * Render progress chart
     * @param {HTMLElement} container - Container element
     * @param {number} percentage - Progress percentage
     * @param {Object} options - Chart options
     */
    renderProgressChart(container, percentage, options = {}) {
        const { color = CHART_COLORS.PRIMARY[0], size = 120, strokeWidth = 10 } = options;
        
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        container.innerHTML = `
            <svg class="chart chart--progress" width="${size}" height="${size}">
                <circle
                    class="chart__progress-bg"
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke="#e5e7eb"
                    stroke-width="${strokeWidth}"
                    fill="none"
                />
                <circle
                    class="chart__progress-fill"
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    fill="none"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    stroke-linecap="round"
                    transform="rotate(-90 ${size / 2} ${size / 2})"
                />
                <text
                    x="${size / 2}"
                    y="${size / 2}"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="chart__progress-text"
                    font-size="24"
                    font-weight="bold"
                    fill="${color}"
                >
                    ${Math.round(percentage)}%
                </text>
            </svg>
        `;
    }
}

export default new ChartRenderer();
