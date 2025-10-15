/**
 * Anomaly Detector
 * Detects pricing and compliance anomalies in invoices
 */

import { FinGuardAPI } from '../core/api.js';
import { getRiskLevel } from '../utils/helpers.js';

/**
 * Anomaly Detector class
 */
export class AnomalyDetector {
    constructor() {
        this.thresholds = {
            priceVariance: 20, // 20% variance threshold
            quantityVariance: 30, // 30% variance threshold
            duplicateMatch: 95, // 95% similarity threshold
        };
    }

    /**
     * Detect anomalies in invoice
     * @param {Object} invoiceData - Invoice data
     * @returns {Promise<Object>} Anomaly detection result
     */
    async detectAnomalies(invoiceData) {
        try {
            const result = await FinGuardAPI.detectAnomaly(invoiceData);
            return this.parseAnomalyResult(result);
        } catch (error) {
            console.error('Anomaly detection error:', error);
            return this.getDefaultResult();
        }
    }

    /**
     * Parse anomaly detection result
     * @param {Object} result - API result
     * @returns {Object} Parsed result
     */
    parseAnomalyResult(result) {
        const anomalies = [];
        let riskScore = 0;

        // Price anomalies
        if (result.price_anomalies && result.price_anomalies.length > 0) {
            result.price_anomalies.forEach(anomaly => {
                anomalies.push({
                    type: 'price',
                    severity: anomaly.severity || 'medium',
                    message: anomaly.message,
                    details: anomaly.details,
                });
                riskScore += anomaly.score || 10;
            });
        }

        // Duplicate detection
        if (result.duplicate_detected) {
            anomalies.push({
                type: 'duplicate',
                severity: 'high',
                message: 'Potential duplicate invoice detected',
                details: result.duplicate_details,
            });
            riskScore += 30;
        }

        // Compliance issues
        if (result.compliance_issues && result.compliance_issues.length > 0) {
            result.compliance_issues.forEach(issue => {
                anomalies.push({
                    type: 'compliance',
                    severity: issue.severity || 'medium',
                    message: issue.message,
                    details: issue.details,
                });
                riskScore += issue.score || 15;
            });
        }

        // HSN/SAC validation
        if (result.hsn_sac_issues && result.hsn_sac_issues.length > 0) {
            result.hsn_sac_issues.forEach(issue => {
                anomalies.push({
                    type: 'hsn_sac',
                    severity: 'low',
                    message: issue.message,
                    details: issue.details,
                });
                riskScore += 5;
            });
        }

        // Calculate final risk
        riskScore = Math.min(riskScore, 100);
        const riskLevel = getRiskLevel(riskScore);

        return {
            hasAnomalies: anomalies.length > 0,
            anomalies,
            riskScore,
            riskLevel: riskLevel.level,
            riskColor: riskLevel.color,
            recommendation: this.getRecommendation(riskScore),
        };
    }

    /**
     * Get default result (when detection fails)
     * @returns {Object} Default result
     */
    getDefaultResult() {
        return {
            hasAnomalies: false,
            anomalies: [],
            riskScore: 0,
            riskLevel: 'LOW',
            riskColor: '#10b981',
            recommendation: 'No anomalies detected',
        };
    }

    /**
     * Get recommendation based on risk score
     * @param {number} riskScore - Risk score
     * @returns {string} Recommendation
     */
    getRecommendation(riskScore) {
        if (riskScore < 30) {
            return 'Low risk - Approve with standard review';
        } else if (riskScore < 70) {
            return 'Medium risk - Requires additional verification';
        } else {
            return 'High risk - Detailed investigation required before approval';
        }
    }

    /**
     * Check for duplicate invoices
     * @param {string} invoiceNumber - Invoice number
     * @param {string} vendorGST - Vendor GST
     * @returns {Promise<Object>} Duplicate check result
     */
    async checkDuplicate(invoiceNumber, vendorGST) {
        try {
            const result = await FinGuardAPI.checkDuplicate(invoiceNumber, vendorGST);
            return {
                isDuplicate: result.duplicate_found,
                matchPercentage: result.match_percentage || 0,
                matches: result.matches || [],
            };
        } catch (error) {
            console.error('Duplicate check error:', error);
            return {
                isDuplicate: false,
                matchPercentage: 0,
                matches: [],
            };
        }
    }
}

export default new AnomalyDetector();
