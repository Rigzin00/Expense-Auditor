from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="Policy-First Expense Auditor API",
    description="Backend API for the React frontend.",
    version="1.0.0"
)

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------------
# 1. Employee Portal
# ---------------------------------------------------------------------------------

@app.post("/api/v1/expenses")
async def submit_expense(
    file: UploadFile = File(...),
    businessPurpose: str = Form(...)
):
    """
    1.1 Submit New Expense Claim
    Accepts a receipt file and user justification to be processed by the OCR and AI Policy Auditor.
    """
    # Mock bad request validation if businessPurpose contains the word "fail"
    if "fail" in businessPurpose.lower():
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "code": "VALIDATION_FAILED",
                "message": "The date on the receipt does not match the claimed expense date. Please review."
            }
        )

    # 202 Accepted mock response
    return JSONResponse(
        status_code=202,
        content={
            "status": "success",
            "message": "Receipt securely sent to AI Auditor",
            "expenseId": "exp_12345"
        }
    )

# ---------------------------------------------------------------------------------
# 2. Finance Dashboard
# ---------------------------------------------------------------------------------

@app.get("/api/v1/expenses")
async def get_pending_claims(status: Optional[str] = None):
    """
    2.1 Get Pending Claims List
    Fetches a list of processed expenses to display on the Finance Auditor Dashboard.
    """
    return {
        "data": [
            {
                "id": "exp_12345",
                "employeeName": "John Doe",
                "date": "2026-10-24",
                "amount": 450.00,
                "category": "Lodging",
                "riskLevel": "Rejected"
            },
            {
                "id": "exp_12346",
                "employeeName": "Jane Smith",
                "date": "2026-10-25",
                "amount": 120.50,
                "category": "Meals",
                "riskLevel": "Flagged"
            }
        ],
        "meta": {
            "totalCount": 2
        }
    }

# ---------------------------------------------------------------------------------
# 3. Audit Detail View
# ---------------------------------------------------------------------------------

@app.get("/api/v1/expenses/{expense_id}")
async def get_expense_details(expense_id: str):
    """
    3.1 Get Expense Audit Details
    Fetches detailed extracted OCR data and the AI's reasoning for a specific expense claim.
    """
    return {
        "id": expense_id,
        "receiptImageUrl": f"https://storage.provider.com/receipts/{expense_id}.jpg",
        "extractedData": {
            "merchantName": "Starbucks",
            "date": "2025-10-24",
            "totalAmount": 15.50,
            "currency": "USD"
        },
        "aiAudit": {
            "status": "Flagged",
            "reasoning": "Meal expense on a weekend requires manual review per Policy Section 4.B. (Weekend & Off-Hours Spend)."
        }
    }

class DecisionRequest(BaseModel):
    action: str
    auditorComments: str

@app.post("/api/v1/expenses/{expense_id}/decision")
async def make_decision(expense_id: str, decision: DecisionRequest):
    """
    3.2 Override / Finalize Claim Decision
    Allows the human auditor to approve or reject a claim, overriding or confirming the AI's decision.
    """
    # Simply acknowledge the action
    return {
        "status": "success",
        "message": "Claim decision recorded successfully."
    }

# ---------------------------------------------------------------------------------
# 4. Global Navigation & Notifications
# ---------------------------------------------------------------------------------

@app.get("/api/v1/notifications")
async def get_notifications():
    """
    4.1 Get User Notifications
    Fetches the dropdown notifications for the current user.
    """
    return {
        "data": [
            {
                "id": "notif_001",
                "type": "error",
                "title": "Action Required",
                "message": "Uber receipt is too blurry. Please re-upload.",
                "isRead": False,
                "createdAt": "2026-04-01T10:00:00Z"
            },
            {
                "id": "notif_002",
                "type": "success",
                "title": "Success",
                "message": "Team Lunch expense has been approved.",
                "isRead": False,
                "createdAt": "2026-04-01T09:30:00Z"
            }
        ]
    }