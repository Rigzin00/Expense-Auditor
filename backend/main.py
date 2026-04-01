from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import uuid

from database import engine, SessionLocal, Base
import models
import schemas
from services.ocr_service import process_receipt_image
from services.ai_auditor import evaluate_expense

# Create all database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Policy-First Expense Auditor API",
    description="Backend API for the React frontend.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------------
# 1. Employee Portal
# ---------------------------------------------------------------------------------

@app.post("/api/v1/expenses")
async def submit_expense(
    file: UploadFile = File(...),
    businessPurpose: str = Form(...),
    db: Session = Depends(get_db)
):
    if "fail" in businessPurpose.lower():
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "code": "VALIDATION_FAILED",
                "message": "The date on the receipt does not match the claimed expense date. Please review."
            }
        )

    # Extract data from the image dynamically
    extracted_data = await process_receipt_image(file)

    # Evaluate the policy via LangChain RAG
    ai_eval = await evaluate_expense(extracted_data, businessPurpose)

    # Generate a random string ID
    expense_id = f"exp_{uuid.uuid4().hex[:8]}"

    # Use the dynamically extracted OCR mapping for the Database object!
    new_expense = models.Expense(
        id=expense_id,
        employee_name="Temporary User",
        expense_date=extracted_data["date"],
        amount=extracted_data["total_amount"],
        category=extracted_data["category"],
        business_purpose=businessPurpose,
        risk_level=ai_eval.get("status", "Flagged"),
        ai_reasoning=ai_eval.get("ai_reasoning", f"Flagged based on {extracted_data['merchant_name']} logic. Needs review."),
        receipt_image_url=f"https://storage.provider.com/receipts/{expense_id}.jpg"
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return JSONResponse(
        status_code=202,
        content={
            "status": "success",
            "message": "Receipt securely sent to AI Auditor",
            "expenseId": expense_id,
            "data": schemas.ExpenseResponse.model_validate(new_expense).model_dump(by_alias=True)
        }
    )

# ---------------------------------------------------------------------------------
# 2. Finance Dashboard
# ---------------------------------------------------------------------------------

@app.get("/api/v1/expenses")
async def get_pending_claims(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Expense)
    if status is not None:
        query = query.filter(models.Expense.risk_level == status)
    
    expenses = query.all()
    
    return {
        "data": [schemas.ExpenseResponse.model_validate(e).model_dump(by_alias=True) for e in expenses],
        "meta": {
            "totalCount": len(expenses)
        }
    }

# ---------------------------------------------------------------------------------
# 3. Audit Detail View
# ---------------------------------------------------------------------------------

@app.get("/api/v1/expenses/{expense_id}")
async def get_expense_details(expense_id: str, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return {
        "id": expense.id,
        "receiptImageUrl": expense.receipt_image_url,
        "extractedData": {
            "merchantName": "Uber",
            "date": expense.expense_date,
            "totalAmount": expense.amount,
            "currency": "USD"
        },
        "aiAudit": {
            "status": expense.risk_level,
            "reasoning": expense.ai_reasoning
        },
        "businessPurpose": expense.business_purpose
    }

class DecisionRequest(BaseModel):
    action: str
    auditorComments: str

@app.post("/api/v1/expenses/{expense_id}/decision")
async def make_decision(expense_id: str, decision: DecisionRequest, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if decision.action.upper() == "APPROVE":
        expense.risk_level = "Approved"
    elif decision.action.upper() == "REJECT":
        expense.risk_level = "Rejected"

    db.commit()
    db.refresh(expense)

    return {
        "status": "success",
        "message": "Claim decision recorded successfully.",
        "data": schemas.ExpenseResponse.model_validate(expense).model_dump(by_alias=True)
    }

# ---------------------------------------------------------------------------------
# 4. Global Navigation & Notifications
# ---------------------------------------------------------------------------------

@app.get("/api/v1/notifications")
async def get_notifications():
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
