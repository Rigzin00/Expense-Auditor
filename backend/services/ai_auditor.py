import logging
import os
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["ANONYMIZED_TELEMETRY"] = "False"  # Disable noisy ChromaDB telemetry

from pydantic import BaseModel, Field
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)

class AuditResult(BaseModel):
    status: str = Field(description="Must be 'Approved', 'Flagged', or 'Rejected'")
    ai_reasoning: str = Field(description="A 1-sentence explanation citing the specific rule")

def ingest_policy_pdf():
    """
    Loads 'policy.pdf', splits it into chunks of 500 characters,
    and stores the embeddings in a local Chroma vector store.
    """
    try:
        # FIX 1: Use PyPDFLoader to correctly parse the PDF
        loader = PyPDFLoader("policy.pdf")
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        splits = text_splitter.split_documents(docs)
        
        # FIX 2: Consistently use gemini-embedding-001
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        # FIX 3: Explicitly persist the database to the disk so evaluate_expense can find it
        vectorstore = Chroma.from_documents(
            documents=splits, 
            embedding=embeddings,
            persist_directory="./chroma_db" 
        )
        logger.info("Successfully ingested policy PDF into ChromaDB.")
        return vectorstore
    except Exception as e:
        logger.error("Failed to ingest policy PDF: %s", e)
        return None

async def evaluate_expense(receipt_data: dict, business_purpose: str) -> dict:
    """
    Evaluates the expense against the policy rules stored in ChromaDB
    and returns a structured status and reasoning using an LLM.
    """
    try:
        # FIX 4: Use the EXACT same embedding model to read the database!
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        vectorstore = Chroma(
            persist_directory="./chroma_db", 
            embedding_function=embeddings
        )
        
        # Determine strict relevant context
        query = f"Category: {receipt_data.get('category', 'General')} Purpose: {business_purpose}"
        retrieved_docs = vectorstore.similarity_search(query, k=3)
        policy_rules = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        # Initialize Google GenAI model (using newer flash available on this key)
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
        structured_llm = llm.with_structured_output(AuditResult)
        
        prompt_template = PromptTemplate.from_template("""
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
        """)
        
        prompt = prompt_template.format(
            policy_rules=policy_rules,
            receipt_data=receipt_data,
            business_purpose=business_purpose
        )
        
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