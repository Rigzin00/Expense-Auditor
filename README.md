# Policy-First Expense Auditor

## The Problem
Corporate finance teams struggle with manually cross-referencing thousands of employee receipts against complex, lengthy Travel & Expense policies. This manual, repetitive process is highly susceptible to policy ambiguity and scales poorly, resulting in massive spend leakage from non-compliant claims and multi-week delays in employee reimbursements.

## The Solution
The **Policy-First Expense Auditor** automates corporate expense compliance by intelligently cross-referencing digitized receipts against corporate policy documents. It streamlines the entire reimbursement lifecycle through three key pillars:

1. **Digital Receipt & Narrative Ingestion:** A mobile-friendly employee portal that accepts image/PDF uploads, utilizes OCR to extract key transaction data (Merchant, Date, Amount, Currency), and captures the employee's justification.
2. **Automated Policy Cross-Reference Engine:** An intelligent auditor engine that retrieves relevant rules from the company's digitized policy manual (e.g., regional spending limits) and contextually validates the expense business purpose against constraints.
3. **Intelligent Flagging & Dispute Dashboard:** A dedicated dashboard for finance auditors that categorizes claims using a traffic-light system (Approved, Flagged, Rejected) and automatically generates rejection explanations citing specific policy rules, while keeping a human-in-the-loop for final overrides.

## Tech Stack
- **Dependencies (Frontend):** React, TypeScript, Tailwind CSS, Vite
- **Backend Framework:** Python, FastAPI
- **Database:** PostgreSQL
- **APIs & Third-Party Tools:** 
  - OpenAI API / GPT (for intelligent policy retrieval and contextual audits)
  - OCR APIs (e.g., Tesseract, AWS Textract, or DocumentAI for receipt extraction)
  - LangChain / LlamaIndex (for RAG over the 40+ page policy PDFs)

## Setup Instructions

### Prerequisites
- Node.js
- npm (Node Package Manager)

### Install dependencies
1. Clone the repository to your local machine.
2. Navigate to the project directory:
   \\\ash
   cd Expense Auditor
   \\\
3. Install frontend dependencies:
   \\\ash
   npm install
   \\\

### Run the project locally
1. Start the Vite development server:
   \\\ash
   npm run dev
   \\\
2. Open your browser and navigate to the address shown in your terminal (typically http://localhost:5173).
