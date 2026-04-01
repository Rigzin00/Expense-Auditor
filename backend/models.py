from sqlalchemy import Column, String, Float
from database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, index=True)
    employee_name = Column(String, index=True)
    expense_date = Column(String)
    amount = Column(Float)
    category = Column(String)
    business_purpose = Column(String)
    risk_level = Column(String)
    ai_reasoning = Column(String)
    receipt_image_url = Column(String)
