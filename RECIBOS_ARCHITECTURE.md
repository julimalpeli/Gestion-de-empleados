# 🏗️ Arquitectura del Módulo Recibos

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND REACT (Vite)                        │
│                                                                   │
│  src/pages/Recibos.tsx                                           │
│  ├── Tab 1: UploadStep       (Cargar PDFs)                       │
│  ├── Tab 2: SplitStep        (Procesar + detectar tipo)         │
│  ├── Tab 3: PreviewStep      (Revisar datos + empleados)        │
│  ├── Tab 4: ConfirmStep      (Confirmar antes de enviar)        │
│  └── Tab 5: SendStep         (Historial + reintentos)          │
│                                                                   │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP Requests
               ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND FASTAPI (Python 3.11)                       │
│              recibos_api:8000                                    │
│                                                                   │
│  🔧 Routers:                                                    │
│  ├── /api/pdf/procesar-pdf        ← POST múltiples PDFs        │
│  ├── /api/pdf/separar-y-enriquecer ← Procesar + empleados      │
│  ├── /api/pdf/buscar-texto         ← Buscar en PDF             │
│  ├── /api/envio/enviar             ← Enviar recibos             │
│  ├── /api/envio/historial          ← Ver historial              │
│  └── /api/envio/reintentar         ← Reintentar fallidos       │
│                                                                   │
│  📦 Servicios:                                                  │
│  ├── PDFProcessor       ← PyMuPDF                               │
│  ├── PeriodNormalizer   ← Convierte "mayo 2026" → "2026-05"   │
│  ├── ReceiptTypeDetector ← normal/aguinaldo/retenciones       │
│  ├── DNIExtractor       ← CUIL (validado) + DNI                │
│  ├── EmployeeMatcher    ← Supabase: CUIL → empleado            │
│  ├── FirmaInjector      ← Incrusta firma dinámicamente         │
│  ├── GmailProvider      ← SMTP Gmail (App Password)            │
│  └── StorageUploader    ← Supabase Storage                     │
│                                                                   │
└────────┬──────────────────────┬──────────────────────┬──────────┘
         │ Supabase SQL         │ Storage              │ Gmail SMTP
         ↓                      ↓                      ↓
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Supabase DB    │  │ Supabase Storage │  │   Gmail SMTP     │
│  PostgreSQL     │  │ Bucket:          │  │   smtp.gmail.com │
│                 │  │ employee-documents   │   :587           │
│ Table:          │  │                  │  │                  │
│ payroll_sends   │  │ employees/{id}/  │  │ Envía PDFs a     │
│ ├── id          │  │ recibos/{period} │  │ empleados        │
│ ├── batch_id    │  │ /{filename}      │  │                  │
│ ├── employee_id │  │                  │  │ (App Password)   │
│ ├── email       │  │ Características: │  │                  │
│ ├── status      │  │ • Encriptado     │  │                  │
│ ├── file_path   │  │ • URLs temporales│  │                  │
│ └── attempts    │  │ • Versionado     │  │                  │
│                 │  │                  │  │                  │
│ Índices:        │  │                  │  │                  │
│ • batch         │  │                  │  │                  │
│ • employee      │  │                  │  │                  │
│ • status        │  │                  │  │                  │
│ • created_at    │  │                  │  │                  │
│                 │  │                  │  │                  │
│ RLS: ✅         │  │                  │  │                  │
└─────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔄 Flujo de Datos Completo

### 1️⃣ UPLOAD STEP (Paso 1)

```
[Usuario selecciona PDFs]
         ↓
[Drag & drop en UploadStep]
         ↓
[PDFDropzone.tsx muestra preview]
         ↓
[Usuario hace click "Procesar"]
         ↓
[POST /api/pdf/procesar-pdf {files}]
         ↓
Backend:
┌─────────────────────────────────┐
│ PDF Processor.extract_text()    │
│ ↓ PyMuPDF abre cada PDF         │
│ ↓ Extrae todo el texto          │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ ReceiptTypeDetector.detect()    │
│ ↓ Busca palabras clave          │
│ ↓ Detecta: normal/aguinaldo/... │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ PeriodNormalizer.extract()      │
│ ↓ Busca fecha en texto          │
│ ↓ Convierte a YYYY-MM           │
└─────────────────────────────────┘
         ↓
Response: List[ProcessPDFResponse]
{
  "file_name": "recibo_mayo.pdf",
  "receipt_type": "normal",
  "period": "2026-05",
  "cuil": "20123456789",
  "dni": "12345678",
  "total_amount": 50000.0,
  "extracted_text": "..."
}
```

### 2️⃣ SPLIT STEP (Paso 2)

```
[SplitStep recibe resultados]
         ↓
[Muestra tabla con archivos procesados]
├── Nombre del archivo
├── Tipo detectado (icono)
├── Período
├── CUIL/DNI
└── Monto total
         ↓
[Usuario revisa y hace click "Enriquecer"]
         ↓
[POST /api/pdf/separar-y-enriquecer {files}]
         ↓
Backend:
┌──────────────────────────────────┐
│ (Repite pasos anteriores)        │
│ ↓                                │
│ DNIExtractor.extract_both()      │
│ ├── Extrae CUIL (11 dígitos)    │
│ ├── Valida dígito verificador    │
│ └── Extrae DNI como fallback     │
└──────────────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ EmployeeMatcher.match_by_cuil_   │
│ or_dni()                         │
│ ├── Query Supabase tabla         │
│ │   employees WHERE CUIL = ?     │
│ ├── Si no encuentra, intenta DNI │
│ └── Retorna: {id, name, email}   │
└──────────────────────────────────┘
         ↓
Response: List[PreviewReceipt]
{
  "file_name": "recibo_mayo.pdf",
  "receipt_type": "normal",
  "period": "2026-05",
  "cuil": "20123456789",
  "employee": {
    "id": "uuid...",
    "name": "Juan Pérez",
    "email": "juan@company.com",
    "phone": "+54..."
  },
  "total_amount": 50000.0,
  "status": "ready"  // o "no-match"
}
```

### 3️⃣ PREVIEW STEP (Paso 3)

```
[PreviewStep recibe datos enriquecidos]
         ↓
[Muestra tabla profesional con columnas:]
├── Archivo
├── Tipo
├── Período
├── Empleado (nombre + email)
├── CUIL/DNI
├── Monto
└── Estado (ready/no-match)
         ↓
[Usuario revisa datos]
         ↓
[Usuario hace click "Confirmar"]
```

### 4️⃣ CONFIRM STEP (Paso 4)

```
[ConfirmStep muestra resumen]
         ↓
Tabla con:
├── Empleados seleccionados
├── Correos a enviar
├── Opción de agregar firma
└── Botón "Confirmar Envío"
         ↓
[Usuario confirma]
         ↓
[POST /api/envio/enviar {batch_data, signature}]
         ↓
Backend inicia secuencia:
┌──────────────────────────────┐
│ Para cada recibo:            │
├──────────────────────────────┤
│ 1. FirmaInjector.embed_      │
│    signature()               │
│    ├── Busca "FIRMA DEL"     │
│    │   "EMPLEADOR" en PDF    │
│    ├── Obtiene coordenadas   │
│    └── Embebe imagen firma   │
├──────────────────────────────┤
│ 2. StorageUploader.upload_   │
│    receipt()                 │
│    ├── Sube a Supabase       │
│    │   Storage/employees/{id}│
│    └── Retorna file_path     │
├──────────────────────────────┤
│ 3. GmailProvider.send_       │
│    receipt()                 │
│    ├── Conecta SMTP          │
│    ├── Adjunta PDF           │
│    └── Envía email           │
├──────────────────────────────┤
│ 4. Registra en BD:           │
│    INSERT payroll_sends {    │
│      batch_id, employee_id,  │
│      email, file_path,       │
│      status: 'sent'          │
│    }                         │
└──────────────────────────────┘
         ↓
Response: SendReceiptResponse
{
  "batch_id": "uuid...",
  "total_sent": 10,
  "total_failed": 2,
  "messages": [
    "Receipt 0: Sent to juan@...",
    "Receipt 1: Email failed - SMTP error"
  ]
}
```

### 5️⃣ SEND STEP (Paso 5)

```
[SendStep muestra confirmación]
         ↓
Muestra:
├── Resumen de envíos exitosos
├── Alertas si hay fallidos
├── Historial de lotes
│   ├── Batch ID
│   ├── Fecha
│   ├── Estado (completed)
│   ├── Enviados: 10
│   └── Fallidos: 2
└── Botón "Reintentar Fallidos"
         ↓
[Si hay fallidos, usuario puede reintentar]
         ↓
[POST /api/envio/reintentar {batch_id}]
         ↓
Backend:
┌─────────────────────────────┐
│ Busca registros en          │
│ payroll_sends WHERE         │
│ batch_id=? AND status='...' │
│                             │
│ Para cada fallido:          │
│ ├── Obtiene PDF de Storage  │
│ ├── Reintenta envío SMTP    │
│ ├── Actualiza status        │
│ └── Incrementa attempts     │
└─────────────────────────────┘
         ↓
Response: RetryFailedResponse
{
  "batch_id": "uuid...",
  "retried_count": 2,
  "success_count": 1,
  "still_failed_count": 1
}
         ↓
[Frontend actualiza historial]
```

---

## 🏗️ Estructura de Carpetas

```
proyecto-root/
│
├── recibos_api/                          # Backend Python
│   ├── main.py                           # FastAPI app
│   ├── __init__.py
│   ├── requirements.txt
│   ├── Dockerfile
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py                    # Pydantic models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── pdf_processor.py              # Extrae texto
│   │   ├── period_normalizer.py          # Normaliza períodos
│   │   ├── receipt_type_detector.py      # Detecta tipo
│   │   ├── dni_extractor.py              # Extrae CUIL/DNI
│   │   ├── employee_matcher.py           # Busca en Supabase
│   │   ├── firma_injector.py             # Embebe firma
│   │   ├── gmail_provider.py             # Envía emails
│   │   └── storage_uploader.py           # Sube a Storage
│   │
│   └── routers/
│       ├── __init__.py
│       ├── pdf.py                        # POST /api/pdf/*
│       └── envio.py                      # POST /api/envio/*
│
├── src/                                  # Frontend React
│   ├── pages/
│   │   ├── Recibos.tsx                   # Página principal (5 tabs)
│   │   └── ...otros
│   │
│   ├── components/
│   │   ├── PDFDropzone.tsx               # Drag & drop
│   │   ├── steps/
│   │   │   ├── UploadStep.tsx
│   │   │   ├── SplitStep.tsx
│   │   │   ├── PreviewStep.tsx
│   │   │   ├── ConfirmStep.tsx
│   │   │   └── SendStep.tsx
│   │   └── ...otros
│   │
│   ├── services/
│   │   ├── recibosService.ts             # Cliente HTTP
│   │   └── ...otros
│   │
│   ├── hooks/
│   │   ├── useRecibosWorkflow.ts         # Gestión de estado
│   │   └── ...otros
│   │
│   ├── types/
│   │   ├── recibos.ts                    # Tipos TS
│   │   └── ...otros
│   │
│   └── App.tsx                           # Router principal
│
├── database/
│   ├── create_payroll_sends_table.sql    # Tabla
│   └── setup_rls_payroll_sends.sql       # RLS policies
│
├── docker-compose.yml                    # Orquestación
├── .env.example                          # Variables template
├── .env.local                            # Variables locales
├── RECIBOS_QUICKSTART.md                 # Setup guide
├── RECIBOS_ARCHITECTURE.md               # Este archivo
├── RECIBOS_IMPLEMENTATION_SUMMARY.md    # Resumen
└── package.json
```

---

## 🔌 Integración: Frontend ↔ Backend

### HTTP Headers
```javascript
// Frontend envía:
{
  "Content-Type": "multipart/form-data",  // Para archivos
  "Authorization": "Bearer {jwt_token}"   // Para usuarios autenticados
}

// Backend responde con:
{
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "http://localhost:5173"
}
```

### Base URL
```typescript
// Frontend (src/services/recibosService.ts)
const API_BASE = import.meta.env.VITE_RECIBOS_API_URL || "http://localhost:8000";

export const recibosService = {
  procesarPDFs: (files) => 
    fetch(`${API_BASE}/api/pdf/procesar-pdf`, { ... }),
  
  enviarRecibos: (batchData, signature?) =>
    fetch(`${API_BASE}/api/envio/enviar`, { ... }),
    
  // ... más métodos
};
```

---

## 📊 Estados Posibles

### Por Archivo
```
[No cargado]
    ↓
[Cargado en UI]
    ↓
[Enviando a backend]
    ↓
[Procesado: error | success]
    ↓
[Si success] → [Enriqueciendo con empleados]
    ↓
[Preview listo: ready | no-match]
```

### Por Lote (Batch)
```
pending
    ↓
in_progress (durante envío)
    ↓
completed
    ├── sent: 10
    ├── failed: 2
    └── pending: 0
```

### Por Envío Individual
```
pending → [envío SMTP] → sent
       ↘              ↗
        failed → [reintento] → sent
```

---

## 🔒 Flujo de Seguridad

```
1. Usuario autentica en login
   ↓
2. Frontend obtiene JWT de Supabase
   ↓
3. Frontend envía JWT en Authorization header
   ↓
4. Backend valida JWT (si lo requiere)
   ↓
5. Supabase RLS filtra datos automáticamente
   ├── INSERT/SELECT/UPDATE/DELETE
   └── Restricción: solo datos de su empresa
   ↓
6. Archivos subidos a Storage encriptado
   ↓
7. Emails enviados via SMTP autenticado
```

---

## ⚡ Performance

### Optimizaciones Implementadas

1. **Índices en DB** — Búsquedas O(log n)
   - batch_id
   - employee_id
   - status
   - created_at

2. **Lazy Loading** — Carga bajo demanda
   - PDFs procesados bajo demanda
   - Empleados obtenidos al enriquecer

3. **Batch Processing** — Múltiples archivos a la vez
   - No procesa uno por uno
   - Parallelizable en futuro

4. **Caching** (Futuro)
   - Cache de empleados en frontend
   - TTL: 5 minutos

---

## 🚨 Manejo de Errores

### En Backend

```python
try:
    pdf_text = PDFProcessor.extract_text(pdf_bytes)
except Exception as e:
    logger.error(f"Error: {str(e)}")
    return {"error": "Could not process PDF"}
```

### En Frontend

```typescript
try {
  const response = await recibosService.procesarPDFs(files);
  // Procesar respuesta
} catch (error) {
  toast.error("Error procesando PDFs");
  logger.error(error);
}
```

### Reintentos Automáticos

- Email fallido → Se registra en BD
- Usuario ve en SendStep
- Botón "Reintentar" → POST /api/envio/reintentar
- Intenta nuevamente

---

## 📈 Escalabilidad

### Para Crecer:

1. **Base de Datos**
   - Tabla `payroll_sends` soporta millones de registros
   - RLS asegura que usuario solo ve sus datos

2. **Storage**
   - Supabase Storage auto-escalable
   - Sin límite de archivos

3. **Email**
   - SMTP no tiene rate limits estrictos
   - Posible implementar queue (RabbitMQ/Celery) en futuro

4. **Backend**
   - FastAPI soporta async/await
   - Posible agregar workers para procesamiento

5. **Frontend**
   - React fragmenta componentes
   - Lazy loading de rutas

---

## 🎯 Conclusión

La arquitectura está diseñada para:
- ✅ **Seguridad** — RLS, Auth, Encriptación
- ✅ **Escalabilidad** — Índices, Async, Cloud
- ✅ **Mantenibilidad** — Servicios separados, Logging
- ✅ **User Experience** — 5 pasos claros, Reintentos
- ✅ **Confiabilidad** — Validaciones, Error handling

**Status:** Listo para producción ✨
