import fitz  # PyMuPDF
from PIL import Image
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class FirmaInjector:
    """Service to inject signature into PDF dynamically"""
    
    @staticmethod
    def embed_signature(
        pdf_bytes: bytes, 
        signature_image_path: str,
        signature_bytes: Optional[bytes] = None,
        search_text: str = "FIRMA DEL EMPLEADOR"
    ) -> bytes:
        """
        Embed signature image into PDF by searching for text dynamically
        
        Args:
            pdf_bytes: PDF file content as bytes
            signature_image_path: Path to signature image file (if not using signature_bytes)
            signature_bytes: Signature image as bytes (if available)
            search_text: Text to search for in PDF
            
        Returns:
            Modified PDF bytes with signature embedded
        """
        try:
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            signature_found = False
            
            # Search for the text in all pages
            for page_num, page in enumerate(pdf_doc):
                text_dict = page.get_text("dict")
                
                for block in text_dict.get("blocks", []):
                    if "lines" not in block:
                        continue
                    
                    for line in block["lines"]:
                        for span in line["spans"]:
                            if search_text.upper() in span["text"].upper():
                                logger.info(
                                    f"Found '{search_text}' on page {page_num + 1}, "
                                    f"embedding signature"
                                )
                                
                                # Get coordinates
                                x0, y0, x1, y1 = span["bbox"]
                                
                                # Position signature below the text
                                # Leave 10 units of space
                                sig_x0 = x0
                                sig_y0 = y1 + 10
                                sig_x1 = x1
                                sig_y1 = y1 + 60  # 50 units height
                                
                                try:
                                    # Load signature image
                                    if signature_bytes:
                                        img = Image.open(io.BytesIO(signature_bytes))
                                    else:
                                        img = Image.open(signature_image_path)
                                    
                                    # Convert to PNG if needed
                                    if img.format != "PNG":
                                        img_converted = Image.new("RGBA", img.size)
                                        img_converted.paste(img)
                                        img = img_converted
                                    
                                    # Save to bytes
                                    img_bytes = io.BytesIO()
                                    img.save(img_bytes, format="PNG")
                                    img_bytes.seek(0)
                                    
                                    # Insert image into PDF
                                    sig_rect = fitz.Rect(sig_x0, sig_y0, sig_x1, sig_y1)
                                    page.insert_image(sig_rect, stream=img_bytes.getvalue())
                                    
                                    signature_found = True
                                    logger.info("Signature embedded successfully")
                                    
                                except Exception as e:
                                    logger.error(f"Error embedding signature: {str(e)}")
                                    raise
            
            # If signature text not found, try last page as fallback
            if not signature_found:
                logger.warning(
                    f"Text '{search_text}' not found in PDF, "
                    f"attempting fallback placement on last page"
                )
                try:
                    last_page = pdf_doc[-1]
                    
                    # Load signature image
                    if signature_bytes:
                        img = Image.open(io.BytesIO(signature_bytes))
                    else:
                        img = Image.open(signature_image_path)
                    
                    # Fallback: place at bottom of last page
                    page_rect = last_page.rect
                    fallback_y = page_rect.height - 100
                    sig_rect = fitz.Rect(50, fallback_y, 200, page_rect.height - 20)
                    
                    img_bytes = io.BytesIO()
                    img.save(img_bytes, format="PNG")
                    img_bytes.seek(0)
                    
                    last_page.insert_image(sig_rect, stream=img_bytes.getvalue())
                    logger.info("Signature embedded at fallback position")
                    
                except Exception as e:
                    logger.error(f"Error embedding signature at fallback position: {str(e)}")
                    # Continue without signature rather than failing
            
            # Write modified PDF
            result_bytes = pdf_doc.write()
            pdf_doc.close()
            
            return result_bytes
            
        except Exception as e:
            logger.error(f"Error in embed_signature: {str(e)}")
            # Return original PDF if signature embedding fails
            return pdf_bytes
    
    @staticmethod
    def find_signature_location(
        pdf_bytes: bytes, 
        search_text: str = "FIRMA DEL EMPLEADOR"
    ) -> Optional[dict]:
        """
        Find location of signature placeholder text in PDF
        
        Args:
            pdf_bytes: PDF file content as bytes
            search_text: Text to search for
            
        Returns:
            Dictionary with page_num and coordinates, or None if not found
        """
        try:
            pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            for page_num, page in enumerate(pdf_doc):
                text_dict = page.get_text("dict")
                
                for block in text_dict.get("blocks", []):
                    if "lines" not in block:
                        continue
                    
                    for line in block["lines"]:
                        for span in line["spans"]:
                            if search_text.upper() in span["text"].upper():
                                pdf_doc.close()
                                
                                return {
                                    "page": page_num,
                                    "text": span["text"],
                                    "x0": span["bbox"][0],
                                    "y0": span["bbox"][1],
                                    "x1": span["bbox"][2],
                                    "y1": span["bbox"][3]
                                }
            
            pdf_doc.close()
            logger.warning(f"Signature text '{search_text}' not found in PDF")
            return None
            
        except Exception as e:
            logger.error(f"Error finding signature location: {str(e)}")
            return None
