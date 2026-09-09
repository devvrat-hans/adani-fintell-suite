# Adani FinTell Suite

> **Autonomous AI Agent for Enterprise Expense Anomaly Detection, Multi-Stage Compliance, and Three-Way Invoice Matching**  
> Developed for the **Adani Finnovate Hackathon 2025** (IIT Gandhinagar & Adani Enterprises)  
> **Problem Statement #1: "AI Agent for Expense Anomaly & Compliance"**  
> **Result: Runners-Up (Team Leader)**

---

[![Adani Finnovate 2025](https://img.shields.io/badge/Adani%20Finnovate%202025-Runners--Up-1e3a8a?style=flat-square)](https://github.com/devvrat-hans/adani-fintell-suite)
[![Role](https://img.shields.io/badge/Role-Team%20Leader-0284c7?style=flat-square)](https://github.com/devvrat-hans)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%20Vision-475569?style=flat-square)](https://ai.google.dev/)
[![Status](https://img.shields.io/badge/Status-Production%20PoC-059669?style=flat-square)](https://github.com/devvrat-hans/adani-fintell-suite)
[![License](https://img.shields.io/badge/License-MIT-334155?style=flat-square)](LICENSE)

---

## Executive Summary

At **Adani Enterprises & Adani Finance**, thousands of vendor invoices, procurement disbursements, expense claims, and purchase orders are processed monthly across business verticals. Conventional accounting controls rely on manual, reactive sampling, introducing substantial risks of duplicate billing, GST non-compliance, arithmetical discrepancies, and procurement price anomalies.

**Adani FinTell Suite** (originally developed as *FinGuard AI*) provides an end-to-end autonomous audit and compliance architecture. The system ingests raw, unstructured documents (PDF, JPEG, PNG) and converts them into validated, structured ledger records. Driven by **Google Gemini Multimodal Vision**, the platform achieves **greater than 80% extraction accuracy**, performs real-time verification against **government GST portals**, validates statutory **HSN/SAC tax rate slabs**, executes content-based **duplicate invoice detection**, benchmarks unit rates against **AI-grounded market prices**, enforces deterministic **three-way PO matching**, and exposes an interactive **conversational financial analytics assistant**.

---

## Key System Highlights

- **Multimodal Document Extraction:** Structured key-value and tabular extraction from multi-page invoices with >80% accuracy using Google Gemini Vision.
- **Real-Time Government GSTIN Verification:** Live network validation of vendor and billed-company GSTINs directly against statutory tax databases to verify registration validity.
- **Statutory HSN/SAC Tax Rate Verification:** Automatic validation of billed tax percentages (CGST, SGST, IGST) against regulatory rate matrices for declared HSN/SAC codes.
- **Content-Based Duplicate Detection:** Multi-field collision analysis across invoice identifiers, vendor tax records, timestamps, and line-item totals to eliminate double payments.
- **Market Price Anomaly Benchmarking:** AI-grounded price modeling that compares billed line items against historical benchmarks and market reference ranges to surface procurement variances.
- **Three-Way Purchase Order Reconciliation:** Automated matching across Invoices, Purchase Orders (POs), and Vendor Master data to ensure purchase authorization before payment release.
- **Conversational Analytics Copilot:** Natural language interface for CFOs, controllers, and auditors to query invoice statuses, vendor metrics, and anomaly logs directly.

---

## Architecture and Verification Pipeline

```text
[ Raw Invoices / Bulk Batch Upload ]
(PDF, PNG, JPEG up to 50MB / 50 files)
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│           STAGE 1: MULTIMODAL OCR INGESTION             │
│   - Google Gemini Multimodal Vision Pipeline            │
│   - Extraction: Vendor/Buyer GSTIN, Date, Invoice No.   │
│   - Itemization: Descriptions, HSN/SAC, Quantities,     │
│     Unit Rates, Discounts, CGST/SGST/IGST Breakdowns    │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           STAGE 2: COMPLIANCE & VALIDATION ENGINE       │
│                                                         │
│  ├── Check 1: Real-Time Government GST Portal Check     │
│  ├── Check 2: Regulatory HSN/SAC GST Rate Matrix Match  │
│  ├── Check 3: Multi-Key Duplicate Invoice Detection     │
│  ├── Check 4: Arithmetical Integrity (Subtotals & Tax)  │
│  └── Check 5: AI-Grounded Market Price Anomaly Check    │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           STAGE 3: THREE-WAY PO RECONCILIATION          │
│   - Reconcile Invoice vs Purchase Order vs Vendor Master│
│   - Detect Quantity Variances, Over-billing, Unlinked PO│
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           STAGE 4: AUDIT LEDGER & ANALYTICS INTERFACES  │
│   - Interactive Audit Timeline Modal                    │
│   - Centralized Anomalies and Fraud Dashboard           │
│   - Vendor Performance and Risk Directory               │
│   - Conversational AI Financial Assistant (Chatbot)     │
└─────────────────────────────────────────────────────────┘
```

---

## Core Verification Modules

### 1. Multimodal OCR and Structured Parsing
- Supports PDF, JPEG, and PNG invoice formats with single-file and bulk batch processing (up to 50 files / 50 MB per batch).
- Extracts and normalizes structured entities:
  - Header: Invoice Number, Invoice Date, Due Date, Currency
  - Counterparties: Vendor Legal Name, Trade Name, Vendor GSTIN, Billed Entity Name, Billed Entity GSTIN
  - Tabular Line Items: Item Description, HSN/SAC Code, Quantity, Unit Rate, Discount, Taxable Amount
  - Tax Ledger: CGST, SGST, IGST percentages and calculated amounts
  - Totals: Net Taxable Amount, Total Tax, Gross Invoice Amount

### 2. Multi-Stage Compliance Matrix
| Verification Check | Purpose | Methodology |
| :--- | :--- | :--- |
| **GSTIN Registration Status** | Identify non-existent, suspended, or cancelled vendors | Live query against official government GST portal APIs |
| **HSN/SAC Rate Conformance** | Prevent tax under-billing or over-billing liability | Dynamic lookup against statutory tax slabs (0%, 5%, 12%, 18%, 28%) |
| **Duplicate Billing Detection** | Prevent duplicate disbursements across historical batches | Multi-key collision search on Invoice Number, Vendor GSTIN, Date, and Gross Value |
| **Arithmetical Reconciliation** | Catch computational and rounding discrepancies | Independent recalculation of line totals, applicable tax sums, and invoice gross |
| **Price Anomaly Detection** | Flag excessive unit procurement costs | Grounded statistical comparison against historical purchase records and prevailing market prices |

### 3. Three-Way PO Reconciliation Engine
- Binds incoming invoices to authorized Purchase Orders stored in the central ledger.
- Verifies line-item quantities against authorized delivery receipts and agreed contractual rates.
- Automatically flags unlinked invoices, quantity overages, and unauthorized rate adjustments prior to payment clearance.

### 4. Audit Trail and Visual Timeline
- Every processed invoice generates an immutable processing timeline:
  - **Stage Status Identifiers:** Clear pass, fail, or warning states across all validation gates.
  - **Detailed Failure Diagnoses:** Explicit diagnostic messages (e.g., *Vendor GSTIN cancelled on portal*, *HSN 8471 billed at 28% instead of 18%*, *Duplicate record matched against Invoice ID IN00042*).
  - **Raw Payload Inspection:** Auditor access to raw structured JSON payloads for regulatory reporting.

### 5. Conversational Financial Assistant
In-app conversational AI interface allowing auditors and financial controllers to inspect the dataset in natural language:
- Query recent high-risk anomalies: *"Show the last 5 detected invoice anomalies."*
- Audit duplicate submissions: *"List all duplicate invoices flagged this week."*
- Inspect specific records: *"Show compliance validation breakdown for invoice ID IN000000000000042."*
- Price variance analysis: *"List all invoices where unit price deviates by more than 15% from the market benchmark."*

---

## Technical Stack

- **AI and Vision Engine:** Google Gemini Multimodal Vision API, Prompt Grounding, Natural Language Processing
- **Frontend Architecture:** Semantic HTML5, Vanilla JavaScript (ES6+), CSS3 (Responsive Enterprise Dashboard, Glassmorphism, Micro-interactions)
- **Backend and Services:** REST API Architecture, Python / FastAPI endpoints, External Government GST Portal Integrations
- **Data Layer:** In-memory application state, persistent ledger storage, SheetSense tabular spreadsheet ingestion
- **Security and Governance:** Human-in-the-Loop review queues, immutable audit logs, role-based controls

---

## Repository Structure

```text
adani-fintell-suite/
├── index.html                   # Platform Landing and Overview Portal
├── dashboard.html               # Executive Finance and Metrics Dashboard
├── finguard.html                # Compliance and Anomaly Center
├── processed-invoices.html      # Processed Invoice Explorer with Search & Filters
├── anomalies-dashboard.html     # Dedicated Fraud, Price, and GST Anomaly Center
├── bulk-upload.html             # Multi-file batch invoice ingestion portal
├── add-invoice.html             # Single invoice upload and manual entry
├── purchase-order-database.html # Centralized Purchase Order Ledger
├── add-purchase-order.html      # Create and bind Purchase Orders
├── edit-purchase-order.html     # Update PO quantities, rates, and terms
├── vendor-database.html         # Vendor Master Directory with GSTIN status
├── vendor-performance.html      # Vendor compliance ratings and dispute logs
├── vendor-purchase-orders.html  # Vendor-specific PO mapping
├── sheetsense.html              # Spreadsheet ingestion and tabular viewer
├── chatbot.html                 # Fullscreen Financial AI Assistant
├── ai-assistant.html            # Embedded Copilot Workspace
├── reports.html                 # Compliance audit reporting and data export
├── test-timeline-modal.html     # Modal preview and validation timeline
├── invoice-feedback.html        # Auditor approval, rejection, and override queue
├── view-feedback.html           # Auditor feedback review and retraining logs
├── api/                         # Backend API specifications and endpoint handlers
│   ├── image-ocr.txt            # Gemini Vision OCR pipeline specification
│   ├── ocr-pdf.txt              # PDF document extraction engine
│   ├── validate-gst.txt         # Real-time GST portal validation endpoints
│   ├── validate-gst-rate.txt    # HSN/SAC statutory rate matrix validator
│   ├── detect-duplicate.txt     # Duplicate document detection logic
│   ├── price-anomaly.txt        # Market benchmark outlier detection algorithm
│   └── ai-assistant-chat.txt    # Conversational financial copilot endpoints
├── css/                         # Design system, themes, and dashboard stylesheets
├── js/                          # Client-side workflows, verification state, and charts
├── docs/                        # Problem statement, solution briefs, and rubrics
└── solution-summary.txt         # Executive hackathon submission brief
```

---

## Deployment and Local Execution

### Prerequisites
- Modern web browser (Chrome, Edge, Safari, Firefox)
- Local HTTP server (Python `http.server`, Node `serve`, or VS Code Live Server)
- Google Gemini API Key (for live extraction and conversational querying)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devvrat-hans/adani-fintell-suite.git
   cd adani-fintell-suite
   ```

2. **Start the local server:**
   ```bash
   # Using Python 3:
   python3 -m http.server 8000
   ```

3. **Access the platform:**
   Open a browser and navigate to:
   ```text
   http://localhost:8000/dashboard.html
   ```

---

## Engineering Team and Hackathon Details

- **Devvrat Hans** — *Team Leader & System Architect* ([GitHub](https://github.com/devvrat-hans) · [LinkedIn](https://www.linkedin.com/in/devvrathans/))
- Developed for the **Adani Finnovate Hackathon 2025**, organized by **IIT Gandhinagar** in collaboration with **Adani Enterprises**.
- Awarded **Runners-Up** for technical execution, real-time GST portal integration, and automated enterprise compliance architecture.

---

## License

This project is distributed under the [MIT License](LICENSE).
