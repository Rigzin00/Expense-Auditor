# Policy-First AI Expense Auditor

## The Problem
Corporate finance teams spend countless hours manually cross-referencing employee expense receipts against lengthy, complex corporate Travel & Expense policies. This tedious process is highly error-prone and slow, leading to massive reimbursement backlogs, frustrated employees, and "spend leakage" from missed non-compliant claims.

## The Solution
The Policy-First AI Expense Auditor is an intelligent web application that automates the expense review process from ingestion to verdict. Employees simply upload a receipt image or PDF, and the system uses multimodal AI to instantly extract the merchant, date, amount, and currency. A backend AI Auditor then uses strict Retrieval-Augmented Generation (RAG) to aggressively evaluate the receipt data and business justification against the vectorized corporate policy document, automatically categorizing the claim as "Approved", "Flagged", or "Rejected" along with a 1-sentence explanation citing the exact policy rule broken.

## Tech Stack
* **Programming Languages:** TypeScript (Frontend), Python (Backend)
* **Frameworks:** React.js, Vite, Tailwind CSS (Frontend) | FastAPI, SQLAlchemy (Backend)
* **Databases:** SQLite (Relational data), ChromaDB (Vector database for policy rules)
* **APIs & Third-Party Tools:** Google Gemini 2.5 Flash (Multimodal OCR & Reasoning), Google Generative AI Embeddings, LangChain, PyMuPDF

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Rigzin00/Expense-Auditor.git
cd Expense-Auditor


cd backend

# Create and activate a Python virtual environment (Windows)
python -m venv .venv
.\.venv\Scripts\activate
# (On Mac/Linux: source .venv/bin/activate)

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
# Create a `.env` file inside the `backend` directory and add your Google API key:
# GOOGLE_API_KEY="your_gemini_api_key_here"

# Start the Backend server
python -m uvicorn main:app --reload

# Install frontend dependencies
npm install

# Start the local development server
npm run dev
