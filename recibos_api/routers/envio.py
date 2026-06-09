from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import List, Optional
import uuid
from datetime import datetime
import logging

from services.firma_injector import FirmaInjector
from services.storage_uploader import StorageUploader
from services.gmail_provider import GmailProvider
from models.schemas import (
    SendReceiptRequest, SendReceiptResponse, 
    RetryFailedRequest, RetryFailedResponse,
    BatchHistory, PayrollSend, SendStatus
)

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory storage for batch history (should use database in production)
batch_history = {}
batch_records = {}

@router.post("/enviar", response_model=SendReceiptResponse)
async def enviar_recibos(
    batch_id: Optional[str] = Form(None),
    include_signature: bool = Form(True),
    signature_file: Optional[UploadFile] = File(None),
    receipt_data: str = Form(...)  # JSON string with receipt data
):
    """
    Send receipts to employees via email
    
    Process:
    1. Receive list of receipts with employee data
    2. Optionally inject signature if provided
    3. Upload to Supabase Storage
    4. Send via Gmail SMTP
    5. Record in payroll_sends table
    """
    import json
    
    if not batch_id:
        batch_id = str(uuid.uuid4())
    
    try:
        # Parse receipt data
        receipts = json.loads(receipt_data)
        if not isinstance(receipts, list):
            receipts = [receipts]
        
        logger.info(f"Starting send operation for batch {batch_id} with {len(receipts)} receipts")
        
        # Load signature if provided
        signature_bytes = None
        if signature_file and include_signature:
            signature_bytes = await signature_file.read()
            logger.info(f"Signature file loaded: {signature_file.filename}")
        
        # Gmail provider
        gmail = GmailProvider()
        
        # Process each receipt
        total_sent = 0
        total_failed = 0
        messages = []
        
        for idx, receipt in enumerate(receipts):
            try:
                employee_id = receipt.get("employee_id")
                employee_email = receipt.get("email")
                employee_name = receipt.get("employee_name", "Employee")
                period = receipt.get("period")
                pdf_bytes = receipt.get("pdf_bytes")
                
                if not employee_id or not employee_email:
                    logger.warning(f"Receipt {idx}: Missing employee_id or email")
                    total_failed += 1
                    messages.append(f"Receipt {idx}: Missing employee info")
                    continue
                
                if not pdf_bytes:
                    # In production, retrieve from storage
                    logger.warning(f"Receipt {idx}: No PDF bytes provided")
                    total_failed += 1
                    messages.append(f"Receipt {idx}: Missing PDF data")
                    continue
                
                # Optionally inject signature
                if include_signature and signature_bytes:
                    try:
                        pdf_bytes = FirmaInjector.embed_signature(
                            pdf_bytes,
                            signature_image_path=None,
                            signature_bytes=signature_bytes
                        )
                        logger.info(f"Receipt {idx}: Signature embedded")
                    except Exception as e:
                        logger.warning(f"Receipt {idx}: Could not embed signature: {str(e)}")
                        # Continue without signature
                
                # Upload to storage
                filename = f"{employee_name.replace(' ', '_')}_{period or 'receipt'}.pdf"
                success, file_path = await StorageUploader.upload_receipt(
                    pdf_bytes,
                    employee_id,
                    period,
                    filename
                )
                
                if not success:
                    logger.error(f"Receipt {idx}: Failed to upload to storage: {file_path}")
                    total_failed += 1
                    messages.append(f"Receipt {idx}: Storage upload failed")
                    continue
                
                # Send email
                success, message = await gmail.send_receipt(
                    employee_email,
                    pdf_bytes,
                    employee_name
                )
                
                if success:
                    total_sent += 1
                    messages.append(f"Receipt {idx}: Sent to {employee_email}")
                    
                    # Record in batch history
                    record = {
                        "batch_id": batch_id,
                        "employee_id": employee_id,
                        "employee_name": employee_name,
                        "email": employee_email,
                        "period": period,
                        "file_path": file_path,
                        "status": "sent",
                        "sent_at": datetime.now().isoformat(),
                        "attempts": 1
                    }
                    
                    if batch_id not in batch_records:
                        batch_records[batch_id] = []
                    batch_records[batch_id].append(record)
                    
                    logger.info(f"Receipt {idx}: Email sent successfully")
                else:
                    total_failed += 1
                    messages.append(f"Receipt {idx}: Email failed - {message}")
                    
                    # Record failed send
                    record = {
                        "batch_id": batch_id,
                        "employee_id": employee_id,
                        "employee_name": employee_name,
                        "email": employee_email,
                        "period": period,
                        "file_path": file_path,
                        "status": "failed",
                        "error_message": message,
                        "attempts": 1
                    }
                    
                    if batch_id not in batch_records:
                        batch_records[batch_id] = []
                    batch_records[batch_id].append(record)
                    
                    logger.error(f"Receipt {idx}: Email send failed")
                
            except Exception as e:
                total_failed += 1
                messages.append(f"Receipt {idx}: Exception - {str(e)}")
                logger.error(f"Receipt {idx}: Exception during processing: {str(e)}")
        
        # Record batch history
        batch_history[batch_id] = {
            "batch_id": batch_id,
            "created_at": datetime.now().isoformat(),
            "total_receipts": len(receipts),
            "sent_count": total_sent,
            "failed_count": total_failed,
            "pending_count": 0,
            "status": "completed"
        }
        
        logger.info(
            f"Batch {batch_id} completed: "
            f"{total_sent} sent, {total_failed} failed"
        )
        
        return SendReceiptResponse(
            batch_id=batch_id,
            total_sent=total_sent,
            total_failed=total_failed,
            messages=messages
        )
        
    except Exception as e:
        logger.error(f"Error in enviar_recibos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historial")
async def get_historial(batch_id: Optional[str] = None):
    """
    Get batch sending history
    
    If batch_id provided, return details for that batch
    Otherwise return list of all batches
    """
    try:
        if batch_id:
            if batch_id not in batch_history:
                raise HTTPException(status_code=404, detail="Batch not found")
            
            return {
                "batch": batch_history[batch_id],
                "records": batch_records.get(batch_id, [])
            }
        else:
            return {
                "batches": list(batch_history.values()),
                "total_batches": len(batch_history)
            }
            
    except Exception as e:
        logger.error(f"Error getting historial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reintentar", response_model=RetryFailedResponse)
async def reintentar_fallidos(request: RetryFailedRequest):
    """
    Retry sending failed receipts from a batch
    
    Looks for all records with status='failed' in the batch
    and attempts to send them again
    """
    try:
        batch_id = request.batch_id
        
        if batch_id not in batch_records:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        # Find failed records
        failed_records = [
            r for r in batch_records[batch_id]
            if r.get("status") == "failed"
        ]
        
        if not failed_records:
            logger.info(f"No failed records found for batch {batch_id}")
            return RetryFailedResponse(
                batch_id=batch_id,
                retried_count=0,
                success_count=0,
                still_failed_count=0
            )
        
        logger.info(f"Retrying {len(failed_records)} failed records for batch {batch_id}")
        
        gmail = GmailProvider()
        retried_count = 0
        success_count = 0
        still_failed_count = 0
        
        for record in failed_records:
            try:
                retried_count += 1
                
                # In production, retrieve PDF from storage
                # For now, just attempt email send
                success, message = await gmail.send_receipt(
                    record.get("email"),
                    b"dummy_pdf",  # In production, fetch from storage
                    record.get("employee_name", "Employee")
                )
                
                if success:
                    success_count += 1
                    record["status"] = "sent"
                    record["attempts"] = record.get("attempts", 0) + 1
                    record["sent_at"] = datetime.now().isoformat()
                    logger.info(f"Retry successful for {record.get('email')}")
                else:
                    still_failed_count += 1
                    record["error_message"] = message
                    record["attempts"] = record.get("attempts", 0) + 1
                    logger.warning(f"Retry still failed for {record.get('email')}")
                    
            except Exception as e:
                still_failed_count += 1
                record["error_message"] = str(e)
                record["attempts"] = record.get("attempts", 0) + 1
                logger.error(f"Exception retrying {record.get('email')}: {str(e)}")
        
        return RetryFailedResponse(
            batch_id=batch_id,
            retried_count=retried_count,
            success_count=success_count,
            still_failed_count=still_failed_count
        )
        
    except Exception as e:
        logger.error(f"Error in reintentar_fallidos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
