import re
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class DNIExtractor:
    """Service to extract DNI and CUIL from payroll documents"""
    
    @staticmethod
    def extract_cuil(text: str) -> Optional[str]:
        """
        Extract CUIL (Código Único de Identificación Laboral) from text
        
        CUIL format: XX-XXXXXXXX-X (11 digits total with hyphens)
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            CUIL string without hyphens (11 digits), or None if not found
        """
        if not text:
            return None
        
        # Pattern: XX-XXXXXXXX-X or XXXXXXXXXXX
        patterns = [
            r"CUIL[:\s]+(\d{2}[-\s]?\d{8}[-\s]?\d{1})",
            r"C\.U\.I\.L[:\s]+(\d{2}[-\s]?\d{8}[-\s]?\d{1})",
            r"(\d{2}[-\s]?\d{8}[-\s]?\d{1})(?:\s+CUIL)?",  # Just the number
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                cuil_str = match.group(1)
                # Remove hyphens and spaces
                cuil_clean = re.sub(r"[-\s]", "", cuil_str)
                
                if len(cuil_clean) == 11 and cuil_clean.isdigit():
                    logger.info(f"Extracted CUIL: {cuil_clean}")
                    return cuil_clean
        
        logger.warning("Could not extract CUIL from text")
        return None
    
    @staticmethod
    def extract_dni(text: str) -> Optional[str]:
        """
        Extract DNI (Documento Nacional de Identidad) from text
        
        DNI format: XX.XXX.XXX or XXXXXXXX (8 digits for modern format)
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            DNI string without dots (8 digits), or None if not found
        """
        if not text:
            return None
        
        # Patterns for DNI
        patterns = [
            r"DNI[:\s]+(\d{1,3}\.?\d{1,3}\.?\d{1,3})",
            r"D\.N\.I[:\s]+(\d{1,3}\.?\d{1,3}\.?\d{1,3})",
            r"Documento[:\s]+(\d{1,3}\.?\d{1,3}\.?\d{1,3})",
            r"\b(\d{1,3}\.?\d{1,3}\.?\d{1,3})\b(?:\s+DNI)?",  # Just 8 digits
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                dni_str = match.group(1)
                # Remove dots
                dni_clean = re.sub(r"[.\s]", "", dni_str)
                
                if len(dni_clean) == 8 and dni_clean.isdigit():
                    logger.info(f"Extracted DNI: {dni_clean}")
                    return dni_clean
        
        logger.warning("Could not extract DNI from text")
        return None
    
    @staticmethod
    def extract_both(text: str) -> Dict[str, Optional[str]]:
        """
        Extract both CUIL and DNI from text
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            Dictionary with 'cuil' and 'dni' keys
        """
        return {
            "cuil": DNIExtractor.extract_cuil(text),
            "dni": DNIExtractor.extract_dni(text)
        }
    
    @staticmethod
    def validate_cuil(cuil: str) -> bool:
        """
        Validate CUIL using check digit
        
        CUIL format: XX-XXXXXXXX-X
        The last digit is a check digit calculated from the first 10 digits
        
        Args:
            cuil: CUIL string with 11 digits (no hyphens)
            
        Returns:
            True if CUIL is valid, False otherwise
        """
        if not cuil or len(cuil) != 11 or not cuil.isdigit():
            return False
        
        try:
            # Calculate check digit
            multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
            total = sum(int(cuil[i]) * multipliers[i] for i in range(10))
            check_digit = 11 - (total % 11)
            
            if check_digit == 11:
                check_digit = 0
            elif check_digit == 10:
                # Invalid CUIL
                return False
            
            return check_digit == int(cuil[10])
        except Exception as e:
            logger.error(f"Error validating CUIL: {str(e)}")
            return False
    
    @staticmethod
    def validate_dni(dni: str) -> bool:
        """
        Basic validation for DNI format
        
        Args:
            dni: DNI string with 8 digits (no dots)
            
        Returns:
            True if DNI has correct format
        """
        if not dni or len(dni) != 8 or not dni.isdigit():
            return False
        
        # Additional check: DNI shouldn't be all zeros or all same digit
        return not (dni == "0" * 8 or len(set(dni)) == 1)
