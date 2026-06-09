import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
import os
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

class GmailProvider:
    """Service to send emails via Gmail SMTP with App Password"""
    
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.gmail_user = os.getenv("GMAIL_USER")
        self.gmail_password = os.getenv("GMAIL_APP_PASSWORD")
        
        if not self.gmail_user or not self.gmail_password:
            logger.warning(
                "Gmail credentials not configured. "
                "Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables."
            )
    
    async def send_receipt(
        self,
        recipient_email: str,
        pdf_bytes: bytes,
        employee_name: str,
        subject: Optional[str] = None,
        body_text: Optional[str] = None,
        filename: Optional[str] = None
    ) -> tuple[bool, str]:
        """
        Send payroll receipt via email
        
        Args:
            recipient_email: Recipient email address
            pdf_bytes: PDF file content as bytes
            employee_name: Employee name for personalization
            subject: Email subject (optional)
            body_text: Email body text (optional)
            filename: PDF filename (optional)
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            if not self.gmail_user or not self.gmail_password:
                return False, "Gmail credentials not configured"
            
            # Set defaults
            if not subject:
                subject = f"Recibo de Sueldo - {employee_name}"
            
            if not body_text:
                body_text = (
                    f"Estimado/a {employee_name},\n\n"
                    f"Adjunto encontrará su recibo de sueldo.\n\n"
                    f"Saludos cordiales"
                )
            
            if not filename:
                filename = f"{employee_name.replace(' ', '_')}.pdf"
            
            # Create message
            msg = MIMEMultipart()
            msg["From"] = self.gmail_user
            msg["To"] = recipient_email
            msg["Subject"] = subject
            
            # Add body
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
            
            # Attach PDF
            part = MIMEBase("application", "octet-stream")
            part.set_payload(pdf_bytes)
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}"
            )
            msg.attach(part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.gmail_user, self.gmail_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {recipient_email}")
            return True, f"Email sent to {recipient_email}"
            
        except smtplib.SMTPAuthenticationError:
            msg = "Gmail authentication failed. Check GMAIL_USER and GMAIL_APP_PASSWORD"
            logger.error(msg)
            return False, msg
        except smtplib.SMTPException as e:
            msg = f"SMTP error: {str(e)}"
            logger.error(msg)
            return False, msg
        except Exception as e:
            msg = f"Error sending email: {str(e)}"
            logger.error(msg)
            return False, msg
    
    async def send_batch(
        self,
        recipients: List[dict],
        batch_id: str
    ) -> dict:
        """
        Send multiple emails (batch operation)
        
        Args:
            recipients: List of dicts with 'email', 'pdf_bytes', 'name' keys
            batch_id: Batch ID for logging
            
        Returns:
            Dictionary with results
        """
        results = {
            "batch_id": batch_id,
            "total": len(recipients),
            "sent": 0,
            "failed": 0,
            "failures": []
        }
        
        for recipient in recipients:
            try:
                email = recipient.get("email")
                pdf_bytes = recipient.get("pdf_bytes")
                name = recipient.get("name", "Employee")
                
                if not email or not pdf_bytes:
                    results["failed"] += 1
                    results["failures"].append({
                        "email": email,
                        "reason": "Missing email or PDF"
                    })
                    continue
                
                success, message = await self.send_receipt(
                    email, pdf_bytes, name
                )
                
                if success:
                    results["sent"] += 1
                    logger.info(f"Batch {batch_id}: Sent to {email}")
                else:
                    results["failed"] += 1
                    results["failures"].append({
                        "email": email,
                        "reason": message
                    })
                    logger.error(f"Batch {batch_id}: Failed to send to {email} - {message}")
                    
            except Exception as e:
                results["failed"] += 1
                results["failures"].append({
                    "email": recipient.get("email", "unknown"),
                    "reason": str(e)
                })
                logger.error(f"Batch {batch_id}: Exception processing recipient: {str(e)}")
        
        return results
