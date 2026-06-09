import fitz  # PyMuPDF
import io
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class PDFProcessor:
    """Service to process PDF files and extract text"""
    
    @staticmethod
    def extract_text(pdf_bytes: bytes) -> str:
        """
        Extract all text from a PDF file
        
        Args:
            pdf_bytes: PDF file content as bytes
            
        Returns:
            Extracted text from all pages
        """
        try:
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = ""
            
            for page_num, page in enumerate(pdf_doc):
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page.get_text()
            
            pdf_doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise
    
    @staticmethod
    def search_text_with_coordinates(pdf_bytes: bytes, search_text: str) -> List[Dict]:
        """
        Search for text in PDF and return coordinates
        
        Args:
            pdf_bytes: PDF file content as bytes
            search_text: Text to search for
            
        Returns:
            List of dictionaries with page number and coordinates
        """
        try:
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            results = []
            
            for page_num, page in enumerate(pdf_doc):
                text_dict = page.get_text("dict")
                
                for block in text_dict.get("blocks", []):
                    if "lines" not in block:
                        continue
                        
                    for line in block["lines"]:
                        for span in line["spans"]:
                            if search_text.upper() in span["text"].upper():
                                results.append({
                                    "page": page_num,
                                    "text": span["text"],
                                    "bbox": span["bbox"],
                                    "x0": span["bbox"][0],
                                    "y0": span["bbox"][1],
                                    "x1": span["bbox"][2],
                                    "y1": span["bbox"][3]
                                })
            
            pdf_doc.close()
            return results
        except Exception as e:
            logger.error(f"Error searching text in PDF: {str(e)}")
            raise
    
    @staticmethod
    def split_pdf_by_pages(pdf_bytes: bytes, pages_per_document: int = 1) -> List[bytes]:
        """
        Split PDF into multiple documents by page count
        
        Args:
            pdf_bytes: PDF file content as bytes
            pages_per_document: Number of pages per resulting document
            
        Returns:
            List of PDF bytes, one for each split document
        """
        try:
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            result_pdfs = []
            
            total_pages = len(pdf_doc)
            
            for start_page in range(0, total_pages, pages_per_document):
                end_page = min(start_page + pages_per_document, total_pages)
                
                new_pdf = fitz.open()
                for page_num in range(start_page, end_page):
                    new_pdf.insert_pdf(pdf_doc, from_page=page_num, to_page=page_num)
                
                result_pdfs.append(new_pdf.write())
                new_pdf.close()
            
            pdf_doc.close()
            return result_pdfs
        except Exception as e:
            logger.error(f"Error splitting PDF: {str(e)}")
            raise
    
    @staticmethod
    def get_page_count(pdf_bytes: bytes) -> int:
        """Get total number of pages in PDF"""
        try:
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            count = len(pdf_doc)
            pdf_doc.close()
            return count
        except Exception as e:
            logger.error(f"Error getting page count: {str(e)}")
            raise
    
    @staticmethod
    def get_text_from_region(pdf_bytes: bytes, page_num: int, bbox: Tuple) -> str:
        """
        Extract text from a specific region of a page
        
        Args:
            pdf_bytes: PDF file content as bytes
            page_num: Page number (0-indexed)
            bbox: Bounding box (x0, y0, x1, y1)
            
        Returns:
            Text from the specified region
        """
        try:
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            if page_num >= len(pdf_doc):
                raise ValueError(f"Page {page_num} not found in PDF")
            
            page = pdf_doc[page_num]
            rect = fitz.Rect(bbox)
            text = page.get_text("text", clip=rect)
            
            pdf_doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from region: {str(e)}")
            raise
