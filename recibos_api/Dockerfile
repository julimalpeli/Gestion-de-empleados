FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY recibos_api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY recibos_api/ /app/recibos_api/

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "recibos_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
