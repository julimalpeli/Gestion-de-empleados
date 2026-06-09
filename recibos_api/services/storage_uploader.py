import os
import logging
from typing import Optional
from datetime import datetime
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class StorageUploader:
    """Service to upload documents to Supabase Storage"""
    
    _supabase_client: Optional[Client] = None
    BUCKET_NAME = "employee-documents"
    
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
    async def upload_receipt(
        cls,
        pdf_bytes: bytes,
        employee_id: str,
        period: Optional[str] = None,
        filename: Optional[str] = None
    ) -> tuple[bool, str]:
        """
        Upload receipt PDF to Supabase Storage
        
        Args:
            pdf_bytes: PDF file content as bytes
            employee_id: Employee ID
            period: Payroll period (e.g., "2026-05")
            filename: Original filename (optional)
            
        Returns:
            Tuple of (success: bool, file_path: str)
        """
        try:
            if not filename:
                filename = "receipt.pdf"
            
            # Create path: employees/{employee_id}/recibos/{period}/{filename}
            if period:
                path = f"employees/{employee_id}/recibos/{period}/{filename}"
            else:
                path = f"employees/{employee_id}/recibos/{filename}"
            
            supabase = cls._get_supabase()
            
            # Upload to storage
            response = supabase.storage.from_(cls.BUCKET_NAME).upload(
                path,
                pdf_bytes,
                {"content-type": "application/pdf"}
            )
            
            logger.info(f"Uploaded receipt to {path}")
            return True, path
            
        except Exception as e:
            logger.error(f"Error uploading to storage: {str(e)}")
            return False, str(e)
    
    @classmethod
    async def get_download_url(
        cls,
        file_path: str,
        expires_in: int = 3600
    ) -> Optional[str]:
        """
        Get temporary download URL for uploaded file
        
        Args:
            file_path: Path to file in storage
            expires_in: Expiration time in seconds (default 1 hour)
            
        Returns:
            Temporary download URL or None if error
        """
        try:
            supabase = cls._get_supabase()
            
            response = supabase.storage.from_(cls.BUCKET_NAME).create_signed_url(
                file_path,
                expires_in
            )
            
            if response and "signedURL" in response:
                return response["signedURL"]
            
            logger.warning(f"Could not create signed URL for {file_path}")
            return None
            
        except Exception as e:
            logger.error(f"Error creating signed URL: {str(e)}")
            return None
    
    @classmethod
    async def list_receipts(
        cls,
        employee_id: str,
        period: Optional[str] = None
    ) -> Optional[list]:
        """
        List receipts for an employee
        
        Args:
            employee_id: Employee ID
            period: Optional period filter
            
        Returns:
            List of files or None if error
        """
        try:
            supabase = cls._get_supabase()
            
            if period:
                path = f"employees/{employee_id}/recibos/{period}/"
            else:
                path = f"employees/{employee_id}/recibos/"
            
            response = supabase.storage.from_(cls.BUCKET_NAME).list(path)
            
            return response if response else []
            
        except Exception as e:
            logger.error(f"Error listing receipts: {str(e)}")
            return None
    
    @classmethod
    async def delete_file(cls, file_path: str) -> tuple[bool, str]:
        """
        Delete a file from storage
        
        Args:
            file_path: Path to file in storage
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            supabase = cls._get_supabase()
            
            response = supabase.storage.from_(cls.BUCKET_NAME).remove([file_path])
            
            logger.info(f"Deleted file: {file_path}")
            return True, f"File deleted: {file_path}"
            
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False, str(e)
