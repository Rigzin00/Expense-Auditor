import logging
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma

# Disable noisy ChromaDB telemetry
os.environ["CHROMA_TELEMETRY"] = "false"
os.environ["ANONYMIZED_TELEMETRY"] = "false" 
os.environ["POSTHOG_DISABLED"] = "1"

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class AuditResult(BaseModel):
    status: str = Field(description="Must be 'Approved', 'Flagged', or 'Rejected'")
    ai_reasoning: str = Field(description="A 1-sentence explanation citing the specific rule")

def ingest_policy_pdf():
    """Reads policy.pdf and prepares the vector database."""
    if not GOOGLE_API_KEY:
        print("ERROR: GOOGLE_API_KEY is not set. Check your .env file.")
        return None

    try:
        if not os.path.exists("policy.pdf"):
            print("ERROR: policy.pdf not found in backend directory.")
            return None

        loader = PyPDFLoader("policy.pdf")
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        splits = text_splitter.split_documents(docs)
        
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=GOOGLE_API_KEY
        )

        vectorstore = Chroma.from_documents(
            documents=splits, 
            embedding=embeddings,
            persist_directory="./chroma_db" 
        )
        print("Successfully ingested policy PDF into ChromaDB.")
        return vectorstore
    except Exception as e:
        print(f"Failed to ingest policy PDF: {e}")
        return None

async def evaluate_expense(receipt_data: dict, business_purpose: str) -> dict:
    """Uses RAG to evaluate an expense against the policy."""
    try:
        if not GOOGLE_API_KEY:
            raise ValueError("API Key is missing")

        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
        )
        
        # Load the existing database
        vectorstore = Chroma(
            persist_directory="./chroma_db", 
            embedding_function=embeddings
        )
        
        # Search for rules related to the category or purpose
        query = f"Category: {receipt_data.get('category', 'General')} Business Purpose: {business_purpose}"
        retrieved_docs = vectorstore.similarity_search(query, k=4)
        policy_rules = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY
        )
        
        final_prompt = f"""
        You are a corporate financial auditor. Analyze the following expense against the company policy rules provided.
        
        [POLICY RULES EXTRACTED FROM PDF]
        {policy_rules}
        
        [RECEIPT DATA]
        Merchant: {receipt_data.get('merchant_name', 'Unknown')}
        Amount: {receipt_data.get('total_amount', 'Unknown')}
        Currency: {receipt_data.get('currency', 'USD')}
        Date: {receipt_data.get('date', 'Unknown')}
        Category: {receipt_data.get('category', 'General')}
        
        [USER JUSTIFICATION]
        Business Purpose: {business_purpose}
        
        [INSTRUCTIONS]
        1. Compare the Justification and Receipt Data against the Policy Rules.
        2. If the expense violates a rule (e.g., alcohol, personal gifts, missing receipts), status is 'Rejected'.
        3. If it is unclear or requires higher approval, status is 'Flagged'.
        4. If it complies fully, status is 'Approved'.
        5. Provide a 1-sentence reasoning citing the specific policy rule.
        6. Return ONLY a raw JSON object with no markdown formatting. The JSON must have exactly these keys: {{"status": "Approved/Flagged/Rejected", "ai_reasoning": "Your 1-sentence explanation"}}
        """
        
        response = llm.invoke(final_prompt)
        
        import json
        response_text = response.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        result = json.loads(response_text.strip())
        
        return {
            "status": result.get("status", "Flagged"),
            "ai_reasoning": result.get("ai_reasoning", "Audit complete."),
            "policy_snippet": policy_rules
        }
        
    except Exception as e:
        logger.warning("AI Policy evaluation failed: %s", e)
        return {
            "status": "Flagged",
            "ai_reasoning": "AI Audit unavailable, manual auditor review required.",
            "policy_snippet": ""   # FIX Gap 4: always include policy_snippet key
        }