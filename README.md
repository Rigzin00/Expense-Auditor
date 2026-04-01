# Policy-First Expense Auditor

## The Problem
Corporate finance teams manually cross-reference employee expense receipts against lengthy Travel & Expense Policies. This process is slow and error-prone due to complex regional rules and ambiguous receipts, leading to massive reimbursement backlogs and "Spend Leakage" from non-compliant claims.

## The Solution
The Policy-First Expense Auditor is an intelligent system that eliminates manual cross-referencing by simultaneously reading expense receipts and the company policy document. Key features include:

* A digital ingestion portal that uses OCR to automatically extract Merchant Name, Date, Total Amount, and Currency from uploaded receipts.
* An automated Policy Cross-Reference Engine that searches the policy rules based on expense categories.
* An AI auditor that evaluates regional limits and constraints, automatically categorizing every claim as Approved, Flagged, or Rejected with a clear 1-sentence explanation citing the specific rule.
Key features include:
* [cite_start]A digital ingestion portal that uses OCR to automatically extract Merchant Name, Date, Total Amount, and Currency from uploaded receipts[cite: 114, 117].
* [cite_start]An automated Policy Cross-Reference Engine that searches the policy rules based on expense categories[cite: 120, 122].
* [cite_start]An AI auditor that evaluates regional limits and constraints, automatically categorizing every claim as Approved, Flagged, or Rejected with a clear 1-sentence explanation citing the specific rule[cite: 123, 128].

## Tech Stack
* **Frontend:** React, Tailwind CSS
* **Backend:** Python (FastAPI) or Node.js (Express)
* **AI/OCR:** Google Cloud Vision API (for receipt extraction), LangChain & OpenAI/Gemini (for Policy RAG evaluation)
* **Database:** PostgreSQL (with pgvector for policy embeddings)

## Setup Instructions
1. **Clone the repository:**
   `git clone https://github.com/yourusername/policy-first-expense-auditor.git`
2. **Install Frontend Dependencies:**
   `cd frontend`
   `npm install`
3. **Run the Frontend locally:**
   `npm start`
4. **Install Backend Dependencies:**
   `cd backend`
   `pip install -r requirements.txt`
5. **Run the Backend locally:**
   `uvicorn main:app --reload`
