from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Enums
class ReceiptType(str, Enum):
    NORMAL = "normal"
    AGUINALDO = "aguinaldo"
    RETENCIONES = "retenciones"

class SendStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"

# Request/Response Models
class ProcessPDFRequest(BaseModel):
    """Request to process PDF file"""
    file_name: str
    file_content: bytes  # Base64 encoded file content

class ProcessPDFResponse(BaseModel):
    """Response after processing PDF"""
    file_name: str
    receipt_type: ReceiptType
    period: Optional[str]
    cuil: Optional[str]
    dni: Optional[str]
    total_amount: Optional[float]
    extracted_text: str

class EmployeeMatch(BaseModel):
    """Matched employee data"""
    id: str
    name: str
    email: Optional[str]
    cuil: Optional[str]
    dni: Optional[str]

class PreviewReceipt(BaseModel):
    """Preview of receipt before sending"""
    file_name: str
    receipt_type: ReceiptType
    period: Optional[str]
    cuil: Optional[str]
    dni: Optional[str]
    employee: Optional[EmployeeMatch]
    total_amount: Optional[float]
    status: str = "ready"

class SendReceiptRequest(BaseModel):
    """Request to send receipts"""
    batch_id: str
    receipts: List[dict]  # List of receipt data with employee info
    include_signature: bool = True

class SendReceiptResponse(BaseModel):
    """Response after sending receipts"""
    batch_id: str
    total_sent: int
    total_failed: int
    messages: List[str]

class PayrollSend(BaseModel):
    """Database model for payroll send record"""
    id: Optional[str] = None
    batch_id: str
    payroll_record_id: Optional[str] = None
    employee_id: Optional[str] = None
    email: str
    document_file_path: str
    sent_at: Optional[datetime] = None
    status: SendStatus
    error_message: Optional[str] = None
    attempts: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class BatchHistory(BaseModel):
    """Batch send history"""
    batch_id: str
    created_at: datetime
    total_receipts: int
    sent_count: int
    failed_count: int
    pending_count: int
    status: str

class RetryFailedRequest(BaseModel):
    """Request to retry failed sends"""
    batch_id: str

class RetryFailedResponse(BaseModel):
    """Response after retrying failed sends"""
    batch_id: str
    retried_count: int
    success_count: int
    still_failed_count: int
