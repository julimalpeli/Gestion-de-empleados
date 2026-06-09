import re
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class PeriodNormalizer:
    """Service to normalize payroll period formats"""
    
    MONTH_NAMES = {
        "enero": 1, "january": 1, "jan": 1,
        "febrero": 2, "february": 2, "feb": 2,
        "marzo": 3, "march": 3, "mar": 3,
        "abril": 4, "april": 4, "apr": 4,
        "mayo": 5, "may": 5,
        "junio": 6, "june": 6, "jun": 6,
        "julio": 7, "july": 7, "jul": 7,
        "agosto": 8, "august": 8, "aug": 8,
        "septiembre": 9, "september": 9, "sep": 9, "sept": 9,
        "octubre": 10, "october": 10, "oct": 10,
        "noviembre": 11, "november": 11, "nov": 11,
        "diciembre": 12, "december": 12, "dec": 12,
    }
    
    @classmethod
    def normalize(cls, period_str: Optional[str]) -> Optional[str]:
        """
        Normalize period string to YYYY-MM format
        
        Supports formats like:
        - "mayo 2026" -> "2026-05"
        - "05/2026" -> "2026-05"
        - "202605" -> "2026-05"
        - "2026-05" -> "2026-05"
        - "may 2026" -> "2026-05"
        
        Args:
            period_str: Period string to normalize
            
        Returns:
            Normalized period in YYYY-MM format, or None if not found
        """
        if not period_str:
            return None
        
        period_str = period_str.strip().lower()
        
        # Try format: YYYY-MM (already normalized)
        if re.match(r"^\d{4}-\d{2}$", period_str):
            return period_str
        
        # Try format: YYYYMM (e.g., "202605")
        match = re.search(r"(\d{4})(\d{2})", period_str)
        if match:
            year, month = match.groups()
            try:
                month_int = int(month)
                if 1 <= month_int <= 12:
                    return f"{year}-{month:0>2}"
            except ValueError:
                pass
        
        # Try format: MM/YYYY or MM-YYYY (e.g., "05/2026")
        match = re.search(r"(\d{1,2})[/-](\d{4})", period_str)
        if match:
            month, year = match.groups()
            try:
                month_int = int(month)
                if 1 <= month_int <= 12:
                    return f"{year}-{int(month):0>2}"
            except ValueError:
                pass
        
        # Try format: month name + year (e.g., "mayo 2026")
        for month_name, month_num in cls.MONTH_NAMES.items():
            pattern = rf"{month_name}\s+(\d{{4}})"
            match = re.search(pattern, period_str)
            if match:
                year = match.group(1)
                return f"{year}-{month_num:0>2}"
        
        logger.warning(f"Could not normalize period: {period_str}")
        return None
    
    @classmethod
    def extract_period_from_text(cls, text: str) -> Optional[str]:
        """
        Extract period from text and normalize it
        
        Args:
            text: Text that may contain a period
            
        Returns:
            Normalized period in YYYY-MM format, or None if not found
        """
        if not text:
            return None
        
        # Look for common patterns in payroll receipts
        patterns = [
            r"(?:periodo|period|mes|month)[:\s]+([^\n]+)",
            r"(\d{1,2})/(\d{4})",  # MM/YYYY
            r"([a-záéíóú]+)\s+(\d{4})",  # month name + year
            r"(\d{6})",  # YYYYMM
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                period_candidate = match.group(0)
                normalized = cls.normalize(period_candidate)
                if normalized:
                    return normalized
        
        return None
