import re
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ReceiptTypeDetector:
    """Service to detect type of payroll receipt"""
    
    # Keywords for different receipt types
    AGUINALDO_KEYWORDS = [
        "aguinaldo", "sac", "salario anual complementario",
        "bono navideño", "bono anual", "bonus"
    ]
    
    RETENCIONES_KEYWORDS = [
        "retención", "impuesto", "aporte", "descuento",
        "aportes", "contribución", "withholding", "tax"
    ]
    
    @classmethod
    def detect(cls, text: str) -> str:
        """
        Detect receipt type from text content
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            Receipt type: "normal", "aguinaldo", or "retenciones"
        """
        if not text:
            return "normal"
        
        text_lower = text.lower()
        
        # Check for aguinaldo
        for keyword in cls.AGUINALDO_KEYWORDS:
            if keyword in text_lower:
                logger.info(f"Detected aguinaldo receipt (keyword: {keyword})")
                return "aguinaldo"
        
        # Check for retenciones/impuestos
        retenciones_count = sum(
            1 for keyword in cls.RETENCIONES_KEYWORDS 
            if keyword in text_lower
        )
        
        if retenciones_count >= 2:
            logger.info(f"Detected retenciones receipt ({retenciones_count} keywords found)")
            return "retenciones"
        
        # Default to normal
        logger.info("Detected normal receipt")
        return "normal"
    
    @classmethod
    def extract_total_amount(cls, text: str) -> Optional[float]:
        """
        Extract total amount from receipt text
        
        Looks for patterns like:
        - "Total: 50000.00"
        - "Neto: $50000.00"
        - "Importe: $50000"
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            Total amount as float, or None if not found
        """
        if not text:
            return None
        
        patterns = [
            r"(?:total|neto|importe|amount)[:\s]+\$?[\s]*([\d.,]+)",
            r"\$\s*([\d.,]+)(?:\s*$)",  # Dollar amount at end of line
            r"([\d.,]+)\s*(?:pesos|$)",  # Pesos notation
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                amount_str = match.group(1)
                # Clean up the amount
                amount_str = amount_str.replace(".", "").replace(",", ".")
                
                try:
                    amount = float(amount_str)
                    if amount > 0:
                        logger.info(f"Extracted amount: {amount}")
                        return amount
                except ValueError:
                    continue
        
        logger.warning("Could not extract total amount from receipt")
        return None
    
    @classmethod
    def get_receipt_info(cls, text: str) -> dict:
        """
        Extract receipt information including type and amount
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            Dictionary with receipt_type and total_amount
        """
        return {
            "receipt_type": cls.detect(text),
            "total_amount": cls.extract_total_amount(text)
        }
