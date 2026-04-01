from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class ExpenseBase(BaseModel):
    employee_name: str = Field(..., alias="employeeName")
    expense_date: str = Field(..., alias="date")
    amount: float
    category: str
    business_purpose: Optional[str] = Field(None, alias="businessPurpose")
    risk_level: Optional[str] = Field(None, alias="riskLevel")
    ai_reasoning: Optional[str] = Field(None, alias="aiReasoning")
    receipt_image_url: Optional[str] = Field(None, alias="receiptImageUrl")

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
