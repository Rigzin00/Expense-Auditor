import logging
import os
# Disable noisy ChromaDB telemetry
os.environ["CHROMA_TELEMETRY"] = "false"
os.environ["ANONYMIZED_TELEMETRY"] = "false" 
os.environ["POSTHOG_DISABLED"] = "1"

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate # Better for Chat models

logger = logging.getLogger(__name__)

# Fetch API Key once at the top
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class AuditResult(BaseModel):
    status: str = Field(description="Must be 'Approved', 'Flagged', or 'Rejected'")
    ai_reasoning: str = Field(description="A 1-sentence explanation citing the specific rule")

def ingest_policy_pdf():
    try:
        loader = PyPDFLoader("policy.pdf")
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        splits = text_splitter.split_documents(docs)
        
        # FIX: Pass the API Key explicitly
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=GOOGLE_API_KEY
        )

        vectorstore = Chroma.from_documents(
            documents=splits, 
            embedding=embeddings,
            persist_directory="./chroma_db" 
        )
        logger.info("Successfully ingested policy PDF into ChromaDB.")
        print("Successfully ingested policy PDF into ChromaDB.")
        return vectorstore
    except Exception as e:
        logger.error("Failed to ingest policy PDF: %s", e)
        print(f"Failed to ingest policy PDF: {e}")
        return None

async def evaluate_expense(receipt_data: dict, business_purpose: str) -> dict:
    try:
        # FIX: Pass the API Key explicitly
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001", 
            google_api_key=GOOGLE_API_KEY
        )
        vectorstore = Chroma(
            persist_directory="./chroma_db", 
            embedding_function=embeddings
        )
        
        query = f"Category: {receipt_data.get('category', 'General')} Purpose: {business_purpose}"
        retrieved_docs = vectorstore.similarity_search(query, k=3)
        policy_rules = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        # FIX: Changed gemini-2.5-flash to 1.5-flash (stable)
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            temperature=0,
            google_api_key=GOOGLE_API_KEY
        )
        structured_llm = llm.with_structured_output(AuditResult)
        
        # Using ChatPromptTemplate for better performance
        prompt = f"""
        You are a corporate financial auditor. Evaluate the following expense against the provided policy rules.
        
        Policy Rules:
        {policy_rules}
        
        Receipt Data:
        {receipt_data}
        
        Business Purpose:
        {business_purpose}
        
        Determine if the expense complies with the policy.
        Status must be 'Approved', 'Flagged', or 'Rejected'.
        Reasoning must be a 1-sentence explanation citing the specific rule.
        """
        
        result: AuditResult = structured_llm.invoke(prompt)
        
        return {
            "status": result.status,
            "ai_reasoning": result.ai_reasoning
        }
        
    except Exception as e:
        logger.warning("AI Policy evaluation failed: %s. Falling back to mock decision.", e)
        return {
            "status": "Flagged",
            "ai_reasoning": "AI Audit unavailable, manual auditor review required."
        }