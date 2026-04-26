import os
import logging
from dotenv import load_dotenv

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

def run_ingestion():
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not found in environment.")
        return

    if not os.path.exists(DATA_DIR):
        logger.info(f"Creating data directory at {DATA_DIR}")
        os.makedirs(DATA_DIR)

    logger.info(f"Loading documents from {DATA_DIR}")
    # Using TextLoader for simple txt files, can add PDFLoader if needed
    loader = DirectoryLoader(DATA_DIR, glob="**/*.txt", loader_cls=TextLoader)
    docs = loader.load()
    
    if not docs:
        logger.warning(f"No documents found in {DATA_DIR}. Exiting.")
        return
        
    logger.info(f"Loaded {len(docs)} documents. Splitting text...")
    
    # Chunking: 512 tokens, 50 token overlap
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(docs)
    logger.info(f"Split into {len(chunks)} chunks.")

    logger.info("Initializing Google Generative AI Embeddings...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY)
    
    logger.info(f"Storing chunks in ChromaDB at {CHROMA_DIR}...")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )
    
    # We do not need to explicitly call persist() in modern chromadb, but it doesn't hurt if we want to be safe
    logger.info("Ingestion complete. Vector store is ready.")

if __name__ == "__main__":
    run_ingestion()
