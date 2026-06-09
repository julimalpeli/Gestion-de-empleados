# 🚀 Recibos API — Quick Start Guide

## 1️⃣ Prerequisitos

- Python 3.11+
- Docker & Docker Compose (opcional, pero recomendado)
- Supabase project con acceso
- Gmail account con App Password configurado

---

## 2️⃣ Configurar Variables de Entorno

### Opción A: Variables Globales

```bash
# Copiar y editar
cp .env.example .env.local

# Editar con tus valores:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=eyJ...  # Service Role Key
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Opción B: Docker Compose

```bash
# El archivo docker-compose.yml lee automáticamente .env.local
docker-compose up -d
```

---

## 3️⃣ Instalar Dependencias Python

### Sin Docker

```bash
cd recibos_api
pip install -r requirements.txt
cd ..
```

### Con Docker

```bash
# Docker se encarga de instalar todo
docker-compose build
```

---

## 4️⃣ Crear Tabla en Supabase

1. Ve a tu proyecto Supabase → SQL Editor
2. Copia y ejecuta:

```sql
-- database/create_payroll_sends_table.sql
CREATE TABLE IF NOT EXISTS payroll_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL,
    payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    document_file_path VARCHAR(500) NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_sends_batch 
    ON payroll_sends(batch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_sends_employee 
    ON payroll_sends(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_sends_status 
    ON payroll_sends(status);

ALTER TABLE payroll_sends ENABLE ROW LEVEL SECURITY;
```

3. Luego, ejecuta RLS policies:

```sql
-- database/setup_rls_payroll_sends.sql
CREATE POLICY "View payroll sends for company" 
    ON payroll_sends 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = payroll_sends.employee_id
            AND e.company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ... resto de policies en database/setup_rls_payroll_sends.sql
```

---

## 5️⃣ Iniciar Backend

### Sin Docker

```bash
# Terminal 1: Backend Python
python -m uvicorn recibos_api.main:app --reload --port 8000
```

### Con Docker

```bash
docker-compose up -d
docker-compose logs -f recibos-api
```

**Verificar:**

```bash
curl http://localhost:8000/health
# Debería retornar: {"status":"ok","service":"recibos-api"}
```

---

## 6️⃣ Probar API

### Test 1: Procesar PDF

```bash
curl -X POST http://localhost:8000/api/pdf/procesar-pdf \
  -F "files=@/path/to/recibo.pdf"
```

**Respuesta esperada:**
```json
[
  {
    "file_name": "recibo.pdf",
    "receipt_type": "normal",
    "period": "2026-05",
    "cuil": "20123456789",
    "dni": "12345678",
    "total_amount": 50000.0,
    "extracted_text": "..."
  }
]
```

### Test 2: Buscar Firma

```bash
curl -X POST http://localhost:8000/api/pdf/buscar-texto \
  -F "file=@/path/to/recibo.pdf" \
  -F "search_text=FIRMA DEL EMPLEADOR"
```

**Respuesta esperada:**
```json
{
  "file_name": "recibo.pdf",
  "search_text": "FIRMA DEL EMPLEADOR",
  "matches": [
    {
      "page": 0,
      "text": "FIRMA DEL EMPLEADOR",
      "x0": 100.5,
      "y0": 200.3,
      "x1": 300.5,
      "y1": 220.3
    }
  ],
  "count": 1
}
```

---

## 7️⃣ Configurar Gmail (Sin OAuth)

### Paso 1: Habilitar 2FA en Google Account

- Ve a myaccount.google.com
- Seguridad → 2-Step Verification (si no está activado)

### Paso 2: Crear App Password

- Ve a myaccount.google.com/apppasswords
- Selecciona: Mail + Windows Computer
- Google genera una contraseña de 16 caracteres
- Copia: `xxxx-xxxx-xxxx-xxxx`

### Paso 3: Configurar .env.local

```env
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

---

## 8️⃣ Estructura del Proyecto

```
recibos_api/
├── main.py                 # FastAPI app
├── __init__.py
├── requirements.txt        # Dependencias Python
├── Dockerfile              # Imagen Docker
├── models/
│   ├── __init__.py
│   └── schemas.py          # Pydantic models
├── services/
│   ├── __init__.py
│   ├── pdf_processor.py    # Extrae texto de PDFs
│   ├── period_normalizer.py # Normaliza períodos
│   ├── receipt_type_detector.py # Detecta tipo
│   ├── dni_extractor.py    # Extrae CUIL/DNI
│   ├── employee_matcher.py # Busca empleados en Supabase
│   ├── firma_injector.py   # Incrusta firma en PDF
│   ├── gmail_provider.py   # Envía emails
│   └── storage_uploader.py # Sube a Supabase Storage
└── routers/
    ├── __init__.py
    ├── pdf.py              # POST /api/pdf/*
    └── envio.py            # POST /api/envio/*

database/
├── create_payroll_sends_table.sql
└── setup_rls_payroll_sends.sql

docker-compose.yml
```

---

## 🐛 Debugging

### Logs

```bash
# Con Docker
docker-compose logs -f recibos-api

# Sin Docker, mira la terminal donde ejecutaste uvicorn
```

### Test Endpoints Manualmente

```bash
# Health check
curl http://localhost:8000/health

# Documentación interactiva
# Abre: http://localhost:8000/docs (Swagger UI)
# o: http://localhost:8000/redoc (ReDoc)
```

### Variables de Entorno

```bash
# Verificar que están configuradas
python -c "import os; print(os.getenv('GMAIL_USER'))"
python -c "import os; print(os.getenv('SUPABASE_URL'))"
```

---

## ⚠️ Problemas Comunes

### Error: "Module not found: recibos_api"

**Solución:** Asegúrate de ejecutar desde raíz del proyecto:
```bash
# ❌ Incorrecto
cd recibos_api && python -m uvicorn main:app

# ✅ Correcto
python -m uvicorn recibos_api.main:app
```

### Error: "SUPABASE_KEY not found"

**Solución:** Verifica `.env.local`:
```bash
cat .env.local | grep SUPABASE_KEY
```

Debe tener un valor. Si está vacío:
1. Ve a Supabase → Settings → API
2. Copia el "Service Role Secret"
3. Pégalo en `.env.local`

### Error: "Gmail auth failed"

**Solución:**
1. Verifica que creaste App Password (no contraseña regular)
2. Copia exactamente: `xxxx-xxxx-xxxx-xxxx`
3. No incluyas hyphens al copiar
4. El formato en `.env.local` puede ser con o sin guiones

### Error: "CORS error in browser"

**Solución:** Verifica `docker-compose.yml` tiene `FRONTEND_URL`:
```yml
environment:
  - FRONTEND_URL=http://localhost:5173
```

---

## 📚 Documentación Adicional

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Supabase Python SDK](https://github.com/supabase-community/supabase-py)
- [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/)
- [Gmail SMTP](https://support.google.com/accounts/answer/185833)

---

## ✅ Próximo Paso

Una vez que el backend esté corriendo:

1. Instala dependencias frontend: `npm install`
2. Inicia frontend: `npm run dev`
3. Abre: http://localhost:5173
4. Navega a "Recibos" (cuando esté implementado)

---

**¡Backend listo! 🎉**

Ahora puedes pasar a la FASE 3: Implementar los componentes React.
