import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Recibos API",
    description="API for automatic payroll receipt sending",
    version="1.0.0"
)

# Configure CORS
# allow_origins=["*"] works for Fly.io + Builder.io cloud environments.
# If ALLOWED_ORIGINS is set (comma-separated), use that list instead.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=origins != ["*"],  # credentials can't be used with wildcard
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "recibos-api"}

# Import routers
from routers import pdf, envio

# Include routers
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF Processing"])
app.include_router(envio.router, prefix="/api/envio", tags=["Sending"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000))
    )
