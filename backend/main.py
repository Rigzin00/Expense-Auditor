from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
import uuid
import os

from database import engine, SessionLocal, Base
import models
import schemas
from services.ocr_service import process_receipt_image
from services.ai_auditor import evaluate_expense, ingest_policy_pdf

# Create uploads directory if it doesn't exist
UPLOADS_DIR = "./uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)


def ensure_expenses_schema_compatibility():
    """Add missing nullable columns for existing local SQLite databases."""
    inspector = inspect(engine)
    if "expenses" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("expenses")}
    compatibility_columns = {
        "merchant_name": "VARCHAR",
        "currency": "VARCHAR",
        "policy_snippet": "VARCHAR",
        "auditor_comments": "VARCHAR",
    }

    missing_columns = {
        name: column_type
        for name, column_type in compatibility_columns.items()
        if name not in existing_columns
    }

    if not missing_columns:
        return

    with engine.begin() as conn:
        for name, column_type in missing_columns.items():
            conn.execute(text(f"ALTER TABLE expenses ADD COLUMN {name} {column_type}"))

    print(f"Applied schema compatibility updates: added {', '.join(missing_columns.keys())}")

# Create all database tables on startup
models.Base.metadata.create_all(bind=engine)
ensure_expenses_schema_compatibility()

app = FastAPI(
    title="Policy-First Expense Auditor API",
    description="Backend API for the React frontend.",
    version="1.0.0"
)

# Serve uploaded receipt images as static files
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.on_event("startup")
async def startup_event():
    print("Initializing AI components...")
    ingest_policy_pdf()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", # Vite (Default)
        "http://localhost:5174", # Vite (Backup)
        "http://localhost:3000", # Standard React
    ],
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
# In-memory notification store (persists for the lifetime of the server process)
# ---------------------------------------------------------------------------------
_notifications: list[dict] = []

def _push_notification(notif_type: str, title: str, message: str):
    """Push a real notification event into the in-memory store."""
    _notifications.insert(0, {
        "id": f"notif_{uuid.uuid4().hex[:8]}",
        "type": notif_type,
        "title": title,
        "message": message,
        "isRead": False,
        "createdAt": __import__("datetime").datetime.utcnow().isoformat() + "Z"
    })


# ---------------------------------------------------------------------------------
# 1. Employee Portal
# ---------------------------------------------------------------------------------

@app.post("/api/v1/expenses")
async def submit_expense(
    file: UploadFile = File(...),
    businessPurpose: str = Form(...),
    expenseDate: str = Form(...),
    employeeName: str = Form(...),
    db: Session = Depends(get_db)
):
    # Read file content once for OCR
    file_content = await file.read()
    await file.seek(0)

    # Extract data from the image dynamically
    extracted_data = await process_receipt_image(file)

    # 1. Automated Validation check for blurry / unreadable receipts
    ocr_date = extracted_data.get("date", "Unknown")
    ocr_merchant = extracted_data.get("merchant_name", "Unknown")
    ocr_total = extracted_data.get("total_amount", 0.0)

    if ocr_merchant == "Unknown" and ocr_total == 0.0:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "code": "VALIDATION_FAILED",
                "message": "The receipt is blurry or unreadable. Please upload a clearer image."
            }
        )

    # 2. Automated Validation check based on Date (Flexible Y-M-D matching)
    if ocr_date != "Unknown":
        ocr_parts = set(ocr_date.split("-"))
        exp_parts = set(expenseDate.split("-"))
        
        # Check if the parts are just swapped around (e.g. 06/07 vs 07/06)
        if ocr_parts != exp_parts:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "code": "VALIDATION_FAILED",
                    "message": f"The date on the receipt ({ocr_date}) does not match the claimed expense date ({expenseDate}). Please review."
                }
            )

    # Evaluate the policy via LangChain RAG
    ai_eval = await evaluate_expense(extracted_data, businessPurpose)

    # Generate a unique ID for this expense
    expense_id = f"exp_{uuid.uuid4().hex[:8]}"

    # --- BUG 2 FIX: Save the uploaded receipt image to disk ---
    file_extension = os.path.splitext(file.filename or "receipt.jpg")[1] or ".jpg"
    saved_filename = f"{expense_id}{file_extension}"
    saved_path = os.path.join(UPLOADS_DIR, saved_filename)
    with open(saved_path, "wb") as f:
        f.write(file_content)
    receipt_url = f"http://127.0.0.1:8000/uploads/{saved_filename}"

    # Store the expense in DB with real merchant_name and currency
    new_expense = models.Expense(
        id=expense_id,
        employee_name=employeeName,
        merchant_name=extracted_data.get("merchant_name", "Unknown"),   # BUG 1 FIX
        expense_date=extracted_data["date"],
        amount=extracted_data["total_amount"],
        category=extracted_data["category"],
        currency=extracted_data.get("currency", "USD"),
        business_purpose=businessPurpose,
        risk_level=ai_eval.get("status", "Flagged"),
        ai_reasoning=ai_eval.get("ai_reasoning", f"Flagged based on {extracted_data.get('merchant_name')} logic. Needs review."),
        receipt_image_url=receipt_url,                                  # BUG 2 FIX
        policy_snippet=ai_eval.get("policy_snippet", "")
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    # Push a real notification for the employee
    risk = ai_eval.get("status", "Flagged")
    if risk == "Approved":
        _push_notification("success", "Expense Approved", f"Your {extracted_data.get('category', 'expense')} claim from {extracted_data.get('merchant_name', 'merchant')} has been automatically approved.")
    elif risk == "Rejected":
        _push_notification("error", "Expense Rejected", f"Your claim from {extracted_data.get('merchant_name', 'merchant')} was rejected: {ai_eval.get('ai_reasoning', '')}")
    else:
        _push_notification("info", "Expense Under Review", f"Your {extracted_data.get('category', 'expense')} claim from {extracted_data.get('merchant_name', 'merchant')} requires manual review.")

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
            "merchantName": expense.merchant_name or "Unknown",   # BUG 1 FIX: real value from DB
            "date": expense.expense_date,
            "totalAmount": expense.amount,
            "currency": expense.currency or "USD",
            "category": expense.category or "General"
        },
        "aiAudit": {
            "status": expense.risk_level,
            "reasoning": expense.ai_reasoning,
            "policySnippet": expense.policy_snippet
        },
        "auditorComments": expense.auditor_comments,
        "businessPurpose": expense.business_purpose,
        "employeeName": expense.employee_name
    }

class DecisionRequest(BaseModel):
    action: str
    auditorComments: str

@app.post("/api/v1/expenses/{expense_id}/decision")
async def make_decision(expense_id: str, decision: DecisionRequest, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    previous_status = expense.risk_level

    if decision.action.upper() == "APPROVE":
        expense.risk_level = "Approved"
    elif decision.action.upper() == "REJECT":
        expense.risk_level = "Rejected"

    db.commit()
    db.refresh(expense)

    # Push notification for the employee on auditor decision
    merchant = expense.merchant_name or expense.category or "expense"
    if decision.action.upper() == "APPROVE":
        _push_notification("success", "Claim Approved ✓", f"Your '{merchant}' expense claim has been approved by the Finance team. Reimbursement is being processed.")
    else:
        comment_suffix = f" Reason: {decision.auditorComments}" if decision.auditorComments else ""
        _push_notification("error", "Claim Requires Clarification", f"Your '{merchant}' expense was rejected by the Finance team.{comment_suffix}")

    return {
        "status": "success",
        "message": "Claim decision recorded successfully.",
        "data": schemas.ExpenseResponse.model_validate(expense).model_dump(by_alias=True)
    }

# ---------------------------------------------------------------------------------
# 4. Notifications
# ---------------------------------------------------------------------------------

@app.get("/api/v1/notifications")
async def get_notifications():
    """Returns real notification events generated by expense submissions and decisions."""
    return {"data": _notifications}

@app.post("/api/v1/notifications/mark-read")
async def mark_notifications_read():
    """Marks all notifications as read."""
    for n in _notifications:
        n["isRead"] = True
    return {"status": "success"}