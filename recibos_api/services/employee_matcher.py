import logging
from typing import Optional, Dict
import os
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class EmployeeMatcher:
    """Service to match extracted CUIL/DNI with employees in Supabase"""
    
    _supabase_client: Optional[Client] = None
    
    @classmethod
    def _get_supabase(cls) -> Client:
        """Get or create Supabase client"""
        if cls._supabase_client is None:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")
            
            cls._supabase_client = create_client(supabase_url, supabase_key)
        
        return cls._supabase_client
    
    @classmethod
    async def match_by_cuil(cls, cuil: str) -> Optional[Dict]:
        """
        Match employee by CUIL
        
        Args:
            cuil: CUIL string (11 digits)
            
        Returns:
            Employee data if found, None otherwise
        """
        if not cuil:
            return None
        
        try:
            supabase = cls._get_supabase()
            
            # Query employees table
            response = supabase.table("employees").select(
                "id, name, email, phone, cuil, dni"
            ).eq("cuil", cuil).execute()
            
            if response.data and len(response.data) > 0:
                employee = response.data[0]
                logger.info(f"Found employee by CUIL: {employee['id']}")
                return employee
            
            logger.warning(f"No employee found for CUIL: {cuil}")
            return None
            
        except Exception as e:
            logger.error(f"Error matching employee by CUIL: {str(e)}")
            return None
    
    @classmethod
    async def match_by_dni(cls, dni: str) -> Optional[Dict]:
        """
        Match employee by DNI (fallback)
        
        Args:
            dni: DNI string (8 digits)
            
        Returns:
            Employee data if found, None otherwise
        """
        if not dni:
            return None
        
        try:
            supabase = cls._get_supabase()
            
            # Query employees table
            response = supabase.table("employees").select(
                "id, name, email, phone, cuil, dni"
            ).eq("dni", dni).execute()
            
            if response.data and len(response.data) > 0:
                employee = response.data[0]
                logger.info(f"Found employee by DNI: {employee['id']}")
                return employee
            
            logger.warning(f"No employee found for DNI: {dni}")
            return None
            
        except Exception as e:
            logger.error(f"Error matching employee by DNI: {str(e)}")
            return None
    
    @classmethod
    async def match_by_cuil_or_dni(
        cls, 
        cuil: Optional[str] = None, 
        dni: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Match employee by CUIL first, then fallback to DNI
        
        This is the primary method to use for employee matching
        
        Args:
            cuil: CUIL string
            dni: DNI string (fallback)
            
        Returns:
            Employee data if found, None otherwise
        """
        # Try CUIL first
        if cuil:
            employee = await cls.match_by_cuil(cuil)
            if employee:
                return employee
        
        # Fallback to DNI
        if dni:
            employee = await cls.match_by_dni(dni)
            if employee:
                return employee
        
        logger.warning(f"No employee found for CUIL={cuil}, DNI={dni}")
        return None
    
    @classmethod
    async def get_all_employees(cls) -> Optional[list]:
        """
        Get all employees (for debugging/caching purposes)
        
        Returns:
            List of employees or None if error
        """
        try:
            supabase = cls._get_supabase()
            response = supabase.table("employees").select(
                "id, name, email, phone, cuil, dni"
            ).execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching all employees: {str(e)}")
            return None
