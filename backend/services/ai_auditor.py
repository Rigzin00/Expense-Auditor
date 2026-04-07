import logging
import os

# Disable noisy ChromaDB telemetry MUST happen before imports
os.environ["CHROMA_TELEMETRY"] = "false"
os.environ["ANONYMIZED_TELEMETRY"] = "false" 
os.environ["POSTHOG_DISABLED"] = "1"

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma

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
        
        # Multi-query retrieval for stricter context checks
        queries = [
            f"Category limits and rules for: {receipt_data.get('category', 'General')}",
            f"Prohibited expenses, alcohol, gifts, and weekend spending rules",
            f"General receipt amount limits and purpose: {business_purpose}",
            f"Rules for merchant: {receipt_data.get('merchant_name', 'Unknown')}"
        ]
        
        retrieved_docs = []
        for q in queries:
            retrieved_docs.extend(vectorstore.similarity_search(q, k=2))
            
        # Deduplicate to avoid context window bloating
        unique_contents = list(set([doc.page_content for doc in retrieved_docs]))
        policy_rules = "\n\n".join(unique_contents)
        
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
        2. Validate constraints thoroughly: check regional/category amount limits, specific prohibitions (like alcohol or personal gifts), team building consistencies, and day-of-week logic (e.g. weekend spending).
        3. If the expense violates ANY rule (e.g. amounts exceed limits, prohibited items), status must be 'Rejected'.
        4. If it is borderline, lacks sufficient context, or explicitly requires manager approval, status is 'Flagged'.
        5. If it complies fully with all limits and rules, status is 'Approved'.
        6. Provide a concise 1-sentence reasoning citing the specific rule checked (e.g. "Rejected: Expense of $100 exceeds the daily meal limit of $50 per section 3.A.").
        7. Return ONLY a raw JSON object string with no markdown formatting or markdown ticks. The JSON must have exactly these keys: {{"status": "Approved"|"Flagged"|"Rejected", "ai_reasoning": "..."}}
        """
        
        response = llm.invoke(final_prompt)
        
        import json
        import re
        response_text = response.content.strip()
        # Clean up markdown code blocks if the model still adds them despite instructions
        response_text = re.sub(r'^```(?:json)?|```$', '', response_text, flags=re.MULTILINE).strip()
            
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {
                "status": "Flagged",
                "ai_reasoning": "Failed to parse AI output reliably. Manual review strongly recommended."
            }
        
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