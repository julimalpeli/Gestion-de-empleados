# Sistema de Gestión de Recursos Humanos - Cádiz Bar de Tapas

Aplicación web para administrar el personal de Cádiz Bar de Tapas: empleados, liquidaciones de sueldo, envío de recibos, documentos y reglamentos laborales, vacaciones y un portal de autoconsulta para cada empleado.

**Versión actual:** 1.5.0 (`src/config/version.ts`)

## Módulos

| Módulo | Ruta | Roles con acceso | Descripción |
|---|---|---|---|
| Dashboard | `/` | Admin, Gerente, RRHH, Solo lectura | Resumen de empleados, liquidaciones recientes y montos del período. |
| Empleados | `/empleados` | Admin, Gerente, RRHH | Alta, edición y activación/desactivación de empleados, con documentos asociados. |
| Liquidaciones | `/liquidaciones` | Admin, Gerente, RRHH | Liquidaciones mensuales, aguinaldo, presentismo, estados y recibos PDF/Excel. |
| Reportes | `/reportes` | Admin, Gerente, RRHH, Solo lectura | Reportes de liquidaciones y presentismo por período. |
| Recibos | `/recibos` | Admin, Gerente, RRHH | Carga de PDFs de recibos, revisión, envío por correo e historial de envíos. Incluye adjuntar cada recibo a su liquidación. |
| Documentos y Reglamentos | `/documentos` | Admin, Gerente, RRHH | Reglamentos, vacaciones, contratos y reglas internas, con versiones, historial y firmas de empleados. |
| Roles y Permisos | `/roles` | Admin, Gerente | Consulta de roles y permisos por módulo. |
| Gestión de Usuarios | `/usuarios` | Admin | Alta y administración de usuarios del sistema. |
| Portal del Empleado | `/portal-empleado` | Empleado | Datos personales, liquidaciones propias, vacaciones y documentos propios. |

## Funcionalidades principales

### Empleados

- Alta y edición con validación de datos (documento único, fecha de ingreso no futura, sueldo mayor a cero).
- Indicador "¿Percibe presentismo?" por empleado. Los cambios afectan solo liquidaciones futuras.
- Cálculo automático de antigüedad y elegibilidad para vacaciones (mínimo 6 meses).

### Liquidaciones

- Conceptos: sueldo base, horas extras, feriados, presentismo (Mantiene / Perdido), aguinaldo, bono libre, adelantos y descuentos.
- Pago dividido entre depósito en blanco e importe informal.
- Estados: borrador, pendiente, aprobada, procesada y pagada.
- Generación de recibos en PDF y Excel, y adjuntos de documentos por liquidación.

### Recibos (envío y adjuntos)

- Flujo en cinco pasos: Cargar, Detectar, Revisar, Confirmar e Historial.
- Envío de recibos por correo con historial y reintento de fallidos.
- Botón "Adjuntar a liquidaciones" en la pantalla de revisión: separa un PDF por página, identifica empleado y período, y guarda cada recibo como documento de la liquidación correspondiente. Requiere la API de Recibos desplegada con OCR (ver sección de API).

### Documentos y Reglamentos

- Categorías: Reglamento, Vacaciones, Contrato, Regla interna y Otro.
- Búsqueda por título o descripción y filtro por categoría.
- Cada documento se crea como versión 1. Al reemplazarlo se sube una nueva versión y la anterior queda en el historial.
- Documentos marcados como "Requiere firma" permiten subir, por empleado activo, la copia firmada a mano.
- Archivos permitidos: PDF, Word o imagen (JPG/PNG), hasta 10 MB.
- Acceso restringido a administración y RRHH. Los empleados no ven esta sección.

### Vacaciones

- Elegibilidad a partir de 6 meses de antigüedad.
- Días anuales según antigüedad (14, 21, 28 o 35 días).
- Solicitudes con estados pendiente, aprobada y rechazada.

### Autenticación y permisos

- Autenticación con Supabase Auth y cambio obligatorio de contraseña en el primer ingreso.
- Roles: Administrador, Gerente, Recursos Humanos, Empleado y Solo lectura.
- Permisos por módulo (empleados, liquidaciones, documentos, usuarios, etc.) y protección de rutas en frontend, con Row Level Security en la base de datos.

## Arquitectura

- **Frontend:** aplicación React en `src/`, servida por Vite.
- **Base de datos y archivos:** Supabase (PostgreSQL, Auth, Storage y RLS).
- **API de Recibos:** servicio FastAPI en `recibos_api/`, desplegado en Fly.io. Procesa los PDF de recibos, hace OCR con Tesseract (español) y se comunica con Gmail para los envíos.

## Tecnologías

### Frontend

- React 18 y TypeScript
- Vite 6
- Tailwind CSS y componentes Radix UI
- React Router
- React Hook Form y Zod
- Recharts
- Vitest para pruebas

### Backend

- Supabase (PostgreSQL, Auth, Storage)
- API de Recibos: Python 3.11, FastAPI, PyMuPDF, Pillow, Tesseract OCR con `pytesseract`

## Requisitos previos

- Node.js 18 o superior
- Proyecto de Supabase configurado
- Python 3.11 y Tesseract con idioma español (solo para correr la API de Recibos en local)
- CLI de Fly.io para desplegar la API

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/julimalpeli/Gestion-de-empleados.git
cd Gestion-de-empleados
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear `.env.local` a partir de `.env.example`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_RECIBOS_API_URL=https://recibos-api.fly.dev
```

### 4. Preparar la base de datos

Ejecutar en el SQL Editor de Supabase los scripts de `database/` según la configuración del proyecto. Los principales son:

- `schema.sql`
- `create_payroll_records_table.sql`
- `create_employee_documents_table.sql`
- `setup_storage_employee_documents.sql`
- `add_payroll_id_to_documents.sql`
- `create_company_documents.sql` (módulo Documentos y Reglamentos)

### 5. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## API de Recibos

La API se despliega desde la raíz del repositorio, porque el Dockerfile copia archivos desde `recibos_api/`:

```bash
fly deploy --dockerfile recibos_api/Dockerfile -a recibos-api
```

Después del deploy, `https://recibos-api.fly.dev/docs` lista los endpoints disponibles, incluido `/api/pdf/separar-paginas-recibos` usado por "Adjuntar a liquidaciones".

## Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables y pasos del flujo de Recibos
├── config/              # Configuración de la app (versión)
├── hooks/               # Hooks (permisos, empleados, liquidaciones, documentos, recibos)
├── pages/               # Páginas: Dashboard, Employees, Payroll, Recibos, Documents, etc.
├── services/            # Servicios de datos y de integración con la API de Recibos
├── types/               # Tipos TypeScript
└── lib/                 # Cliente de Supabase
database/                # Scripts SQL de tablas, políticas RLS y storage
recibos_api/             # API de Recibos (FastAPI)
docs/                    # Documentación técnica de seguridad y componentes
```

## Scripts disponibles

- `npm run dev` - Modo desarrollo
- `npm run build` - Build de producción
- `npm run test` - Pruebas con Vitest
- `npm run typecheck` - Verificación de tipos
- `npm run format.fix` - Formateo con Prettier

## Despliegue

- **Frontend:** configuración para Vercel (`vercel.json`) y Netlify (`netlify.toml`). Cargar las variables de entorno en la plataforma de despliegue.
- **API de Recibos:** Fly.io, según la sección anterior.

## Seguridad

- RLS habilitado en las tablas con datos sensibles.
- Validación de permisos en frontend y, para datos, en la base de datos.
- Documentos y archivos en buckets privados, accedidos con URL firmada.
- Autenticación con Supabase Auth.

## Documentación

- `MANUAL_USUARIO.md`: guía funcional para administración, RRHH y empleados.
- `DOCUMENTACION_TECNICA.md`: arquitectura, base de datos, servicios y componentes.
- `RECIBOS_ARCHITECTURE.md`: arquitectura del módulo Recibos.
- `SUPABASE_SETUP.md`: configuración de Supabase.

## Soporte

Para consultas técnicas, crear un issue en GitHub o contactar al equipo de desarrollo.
