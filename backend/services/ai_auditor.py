import logging
from pydantic import BaseModel, Field
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader

logger = logging.getLogger(__name__)

class AuditResult(BaseModel):
    status: str = Field(description="Must be 'Approved', 'Flagged', or 'Rejected'")
    ai_reasoning: str = Field(description="A 1-sentence citation of the rule")

def ingest_policy_pdf():
    """
    Loads 'policy.pdf', splits it into chunks of 500 characters,
    and stores the embeddings in a local Chroma vector store.
    """
    try:
        loader = TextLoader("policy.pdf")
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        splits = text_splitter.split_documents(docs)
        
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vectorstore = Chroma.from_documents(
            documents=splits, 
            embedding=embeddings, 
            persist_directory="./chroma_db"
        )
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
        # Load the local Chroma DB with Google embeddings
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vectorstore = Chroma(
            persist_directory="./chroma_db", 
            embedding_function=embeddings
        )
        
        # Determine strict relevant context
        query = f"Category: {receipt_data.get('category')} Purpose: {business_purpose}"
        retrieved_docs = vectorstore.similarity_search(query, k=3)
        policy_rules = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        # Initialize Google GenAI model
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0)
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
