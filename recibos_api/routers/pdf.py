from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List
import base64
import logging

from services.pdf_processor import PDFProcessor
from services.period_normalizer import PeriodNormalizer
from services.receipt_type_detector import ReceiptTypeDetector
from services.dni_extractor import DNIExtractor
from services.employee_matcher import EmployeeMatcher
from models.schemas import ProcessPDFResponse, PreviewReceipt, ReceiptType

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/procesar-pdf", response_model=List[ProcessPDFResponse])
async def procesar_pdf(files: List[UploadFile] = File(...)):
    """
    Process one or multiple PDF files to extract information
    
    Returns information about each PDF including:
    - Receipt type (normal, aguinaldo, retenciones)
    - Period (normalized to YYYY-MM)
    - CUIL and DNI
    - Total amount
    - Extracted text
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    results = []
    
    for file in files:
        try:
            # Read file
            file_content = await file.read()
            
            # Extract text
            text = PDFProcessor.extract_text(file_content)
            
            # Detect receipt type and extract amount
            receipt_info = ReceiptTypeDetector.get_receipt_info(text)
            
            # Extract period
            period = PeriodNormalizer.extract_period_from_text(text)
            
            # Extract CUIL and DNI
            identifiers = DNIExtractor.extract_both(text)
            
            result = ProcessPDFResponse(
                file_name=file.filename,
                receipt_type=receipt_info["receipt_type"],
                period=period,
                cuil=identifiers["cuil"],
                dni=identifiers["dni"],
                total_amount=receipt_info["total_amount"],
                extracted_text=text[:1000]  # Limit text for response
            )
            
            results.append(result)
            logger.info(f"Processed {file.filename}: {result.receipt_type}")
            
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Error processing {file.filename}: {str(e)}"
            )
    
    return results


@router.post("/separar-y-enriquecer")
async def separar_y_enriquecer(files: List[UploadFile] = File(...)):
    """
    Process PDFs and enrich with employee data from Supabase
    
    For each receipt, attempts to match with employee by CUIL/DNI
    and returns enriched preview data
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    results = []
    
    for file in files:
        try:
            # Read file
            file_content = await file.read()
            
            # Extract text
            text = PDFProcessor.extract_text(file_content)
            
            # Detect receipt type and extract amount
            receipt_info = ReceiptTypeDetector.get_receipt_info(text)
            
            # Extract period
            period = PeriodNormalizer.extract_period_from_text(text)
            
            # Extract CUIL and DNI
            identifiers = DNIExtractor.extract_both(text)
            
            # Try to match employee
            employee = None
            if identifiers["cuil"] or identifiers["dni"]:
                employee = await EmployeeMatcher.match_by_cuil_or_dni(
                    identifiers["cuil"],
                    identifiers["dni"]
                )
            
            # Create preview
            preview = PreviewReceipt(
                file_name=file.filename,
                receipt_type=ReceiptType(receipt_info["receipt_type"]),
                period=period,
                cuil=identifiers["cuil"],
                dni=identifiers["dni"],
                employee=employee,
                total_amount=receipt_info["total_amount"],
                status="ready" if employee else "no-match"
            )
            
            results.append(preview)
            logger.info(
                f"Enriched {file.filename}: "
                f"Type={preview.receipt_type}, "
                f"Status={preview.status}"
            )
            
        except Exception as e:
            logger.error(f"Error enriching {file.filename}: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Error processing {file.filename}: {str(e)}"
            )
    
    return results


@router.post("/buscar-texto")
async def buscar_texto(
    file: UploadFile = File(...),
    search_text: str = "FIRMA"
):
    """
    Search for specific text in PDF and return coordinates
    
    Useful for testing signature location detection
    """
    try:
        file_content = await file.read()
        
        results = PDFProcessor.search_text_with_coordinates(
            file_content,
            search_text
        )
        
        return {
            "file_name": file.filename,
            "search_text": search_text,
            "matches": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching text: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
