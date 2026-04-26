"""
Ingestion pipeline — loads documents into ChromaDB vector store.

FIXES:
  - BUG 2: Now supports .pdf, .csv, .md, and .txt files (was .txt only).
           Uses PyPDFLoader for PDF, CSVLoader for CSV, TextLoader for md/txt.
"""

import os
import logging
from dotenv import load_dotenv

from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    CSVLoader,
    DirectoryLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")


def load_documents_from_dir(data_dir: str):
    """
    Load all supported document types from the data directory.
    Supported: .txt, .md, .pdf, .csv
    """
    all_docs = []

    for root, _, files in os.walk(data_dir):
        for filename in files:
            filepath = os.path.join(root, filename)
            ext = os.path.splitext(filename)[1].lower()

            try:
                if ext in (".txt", ".md"):
                    loader = TextLoader(filepath, encoding="utf-8")
                    docs = loader.load()
                    all_docs.extend(docs)
                    logger.info(f"Loaded text file: {filename} ({len(docs)} docs)")

                elif ext == ".pdf":
                    loader = PyPDFLoader(filepath)
                    docs = loader.load()
                    all_docs.extend(docs)
                    logger.info(f"Loaded PDF: {filename} ({len(docs)} pages)")

                elif ext == ".csv":
                    loader = CSVLoader(filepath)
                    docs = loader.load()
                    all_docs.extend(docs)
                    logger.info(f"Loaded CSV: {filename} ({len(docs)} rows)")

                else:
                    logger.debug(f"Skipping unsupported file type: {filename}")

            except Exception as e:
                logger.warning(f"Failed to load {filename}: {e}")

    return all_docs


def run_ingestion():
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not found in environment.")
        return

    if not os.path.exists(DATA_DIR):
        logger.info(f"Creating data directory at {DATA_DIR}")
        os.makedirs(DATA_DIR)

    logger.info(f"Loading documents from {DATA_DIR}")
    docs = load_documents_from_dir(DATA_DIR)

    if not docs:
        logger.warning(f"No supported documents found in {DATA_DIR}. Add .txt, .md, .pdf, or .csv files.")
        return

    logger.info(f"Loaded {len(docs)} document pages/rows total. Splitting into chunks...")

    # 512-token chunks with 50-token overlap (optimal for RAG retrieval)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(docs)
    logger.info(f"Split into {len(chunks)} chunks.")

    logger.info("Initializing Google Generative AI Embeddings...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=GEMINI_API_KEY
    )

    logger.info(f"Storing chunks in ChromaDB at {CHROMA_DIR}...")

    # If ChromaDB already exists, add to it rather than replace
    if os.path.exists(CHROMA_DIR):
        vectorstore = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=embeddings
        )
        vectorstore.add_documents(chunks)
        logger.info(f"Added {len(chunks)} new chunks to existing ChromaDB.")
    else:
        Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMA_DIR
        )
        logger.info("Created new ChromaDB vector store.")

    logger.info("Ingestion complete. Vector store is ready.")


if __name__ == "__main__":
    run_ingestion()