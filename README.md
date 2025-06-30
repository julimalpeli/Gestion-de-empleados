# Sistema de Gestión de Recursos Humanos - Cádiz Bar de Tapas

Un sistema completo de gestión de recursos humanos desarrollado con React, TypeScript y Supabase, diseñado específicamente para la gestión de empleados, liquidaciones de sueldos, vacaciones y documentos laborales.

## 🚀 Características Principales

### 👥 Gestión de Empleados

- **CRUD completo** de empleados con validación de datos
- **Estados de empleado** (activo/inactivo) con sincronización automática
- **Campos personalizados**: DNI, dirección, email, teléfono, fecha de ingreso
- **Cálculo automático** de antigüedad y elegibilidad para vacaciones
- **Restricciones de edición** en campos críticos como DNI

### 💰 Sistema de Liquidaciones

- **Liquidación de sueldos** con cálculos automáticos
- **Período actual vs historial** con filtros avanzados
- **Conceptos incluidos**: sueldo base, horas extras, feriados, presentismo, aguinaldo, adelantos, descuentos
- **Estados de liquidación**: borrador, pendiente, aprobada, procesada, pagada
- **Generación de recibos** en PDF y Excel con datos de la empresa
- **Gestión de permisos** por rol de usuario

### 📄 Gestión de Documentos

- **Documentos por empleado** y **por liquidación específica**
- **Categorías**: recibos de sueldo, SAC, documentos generales, formularios
- **Validación de archivos**: tipos permitidos (PDF, imágenes, Word, Excel) y tamaño máximo (10MB)
- **Acceso controlado** con Row Level Security (RLS)
- **Almacenamiento seguro** en Supabase Storage

### 🏖️ Sistema de Vacaciones

- **Regla de 6 meses** de antigüedad mínima
- **Cálculo automático** de días disponibles según antigüedad
- **Historial de solicitudes** con estados (pendiente, aprobada, rechazada)
- **Advertencias de elegibilidad** para empleados nuevos

### 👨‍💼 Portal del Empleado

- **Interfaz dedicada** para consulta personal
- **Información personal**: datos, antigüedad, estado
- **Historial de liquidaciones** con descarga de recibos
- **Estado de vacaciones** y saldo disponible
- **Acceso a documentos** propios únicamente

### 🔐 Sistema de Autenticación y Permisos

- **Autenticación segura** con Supabase Auth
- **Roles de usuario**: Admin, Manager, Employee
- **Permisos granulares** por módulo
- **Protección de rutas** según permisos
- **Forzar cambio de contraseña** en primer login

### 📊 Reportes y Dashboards

- **Dashboard ejecutivo** con métricas clave
- **Reportes de liquidaciones** por período
- **Filtros avanzados** por empleado, estado, fecha
- **Visualización de datos** con gráficos y tablas

## 🛠️ Tecnologías Utilizadas

### Frontend

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de construcción y desarrollo
- **Tailwind CSS** - Framework de CSS
- **Radix UI** - Componentes de interfaz accesibles
- **Lucide React** - Iconografía
- **React Router DOM** - Enrutamiento
- **React Hook Form** - Manejo de formularios
- **Recharts** - Gráficos y visualizaciones

### Backend y Base de Datos

- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Supabase Auth** - Autenticación
- **Supabase Storage** - Almacenamiento de archivos

### Librerías de Utilidad

- **date-fns** - Manipulación de fechas
- **clsx** - Concatenación condicional de clases CSS
- **zod** - Validación de esquemas
- **framer-motion** - Animaciones

## 📋 Requisitos Previos

- **Node.js** 18.x o superior
- **npm** o **yarn**
- **Cuenta de Supabase** configurada
- **Variables de entorno** configuradas

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd hr-management-system
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configurar Base de Datos

Ejecutar scripts SQL en orden desde la carpeta `/database/`:

```bash
# Scripts principales
schema.sql
create_payroll_records_table.sql
create_employee_documents_table.sql
setup_storage_employee_documents.sql
add_payroll_id_to_documents.sql
```

### 5. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

#### `employees`

- Información completa de empleados
- Cálculos automáticos de vacaciones
- Estados activo/inactivo

#### `users`

- Autenticación y permisos
- Roles de sistema
- Sincronización con empleados

#### `payroll_records`

- Registros de liquidaciones
- Todos los conceptos salariales
- Estados de procesamiento

#### `employee_documents`

- Documentos por empleado y liquidación
- Categorización automática
- Metadatos de archivos

#### `vacation_requests`

- Solicitudes de vacaciones
- Estados de aprobación
- Historial completo

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base de UI
│   ├── DocumentManager.tsx
│   ├── VacationManager.tsx
│   └── ...
├── pages/              # Páginas principales
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── Payroll.tsx
│   ├── EmployeePortal.tsx
│   └── ...
├── hooks/              # Hooks personalizados
│   ├── use-employees.tsx
│   ├── use-payroll.tsx
│   ├── use-auth.tsx
│   └── ...
├── services/           # Servicios de datos
│   ├── employeeService.ts
│   ├── documentService.ts
│   └── interfaces.ts
├── utils/              # Utilidades
│   └── receiptGenerator.ts
└── lib/                # Configuraciones
    └── supabase.ts
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run test` - Ejecutar pruebas
- `npm run format.fix` - Formatear código
- `npm run typecheck` - Verificar tipos TypeScript

## 🚀 Despliegue

### Vercel (Recomendado)

```bash
npm run build
vercel --prod
```

### Netlify

```bash
npm run build
# Subir carpeta dist/ a Netlify
```

Asegurar configurar las variables de entorno en la plataforma de despliegue.

## 🔒 Seguridad

- **RLS habilitado** en todas las tablas críticas
- **Validación de permisos** en frontend y backend
- **Sanitización de datos** en todos los formularios
- **Encriptación** de contraseñas con Supabase Auth
- **Tokens JWT** para autenticación de sesiones

## 📝 Funcionalidades Destacadas

### Cálculo Automático de Liquidaciones

```typescript
// Ejemplo de cálculo automático
const calculatePayroll = (employee, period) => {
  const basePay = employee.dailyWage * workDays;
  const overtimePay = overtimeHours * (hourlyRate * 1.5);
  const holidayPay = holidayDays * employee.dailyWage * 2;
  // ... más cálculos
  return totalCalculation;
};
```

### Generación de Recibos

- **PDF profesional** con datos de la empresa
- **Excel/CSV** para procesamiento adicional
- **Datos completos** de liquidación y empleado

### Sistema de Permisos

```typescript
// Ejemplo de verificación de permisos
const canEditPayroll = isAdmin() || canEditModule("payroll");
const canViewEmployeeData = hasPermission("employees", "read");
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:

- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación técnica

## 🔄 Actualizaciones

### Versión Actual: 1.0.0

- ✅ Sistema completo de empleados
- ✅ Liquidaciones automáticas
- ✅ Gestión de documentos
- ✅ Portal del empleado
- ✅ Sistema de vacaciones
- ✅ Reportes y dashboards

### Roadmap Futuro

- 🔄 Módulo de evaluaciones de desempeño
- 🔄 Integración con sistemas contables
- 🔄 Notificaciones automáticas
- 🔄 App móvil nativa
- 🔄 Análisis avanzado con IA

---

**Desarrollado con ❤️ para Cádiz Bar de Tapas**
