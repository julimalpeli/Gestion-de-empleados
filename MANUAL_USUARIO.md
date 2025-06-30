# Manual de Usuario - Sistema de Gestión de RRHH

## Cádiz Bar de Tapas

---

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Destinado a:** Administradores, Gerentes y Empleados

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Dashboard Principal](#dashboard-principal)
4. [Gestión de Empleados](#gestión-de-empleados)
5. [Sistema de Liquidaciones](#sistema-de-liquidaciones)
6. [Gestión de Documentos](#gestión-de-documentos)
7. [Sistema de Vacaciones](#sistema-de-vacaciones)
8. [Portal del Empleado](#portal-del-empleado)
9. [Gestión de Usuarios](#gestión-de-usuarios)
10. [Reportes](#reportes)
11. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

El Sistema de Gestión de Recursos Humanos de Cádiz Bar de Tapas es una plataforma completa diseñada para administrar eficientemente todos los aspectos relacionados con el personal: desde la gestión de empleados hasta las liquidaciones de sueldos, vacaciones y documentos laborales.

### Características Principales

- **Gestión integral de empleados** con información detallada
- **Liquidaciones automáticas** con cálculos precisos
- **Portal dedicado para empleados** con acceso a información personal
- **Sistema de documentos** organizado por categorías
- **Gestión de vacaciones** con reglas de elegibilidad
- **Reportes y estadísticas** en tiempo real

---

## Acceso al Sistema

### Página de Login

Al ingresar al sistema, se presenta la pantalla de autenticación:

**Elementos de la pantalla:**

- Logo de Cádiz Bar de Tapas
- Campo "Usuario" (DNI del empleado)
- Campo "Contraseña"
- Botón "Iniciar Sesión"

**Proceso de login:**

1. Ingrese su DNI en el campo "Usuario"
2. Ingrese su contraseña en el campo correspondiente
3. Haga clic en "Iniciar Sesión"

**Primer acceso:**

- Los nuevos usuarios deben cambiar su contraseña en el primer login
- Se mostrará un formulario para establecer una nueva contraseña segura

**Recuperación de contraseña:**

- Contacte al administrador del sistema si olvida su contraseña
- Solo los administradores pueden resetear contraseñas

---

## Dashboard Principal

El dashboard es la pantalla principal del sistema y muestra información clave de un vistazo.

### Elementos del Dashboard

**1. Tarjetas de Resumen (parte superior):**

- **Total Empleados:** Cantidad total de empleados registrados
- **Empleados Activos:** Empleados con estado activo
- **Total a Pagar:** Suma de liquidaciones pendientes del período actual
- **Liquidaciones:** Cantidad de liquidaciones procesadas

**2. Gráfico de Empleados por Estado:**

- Visualización circular (pie chart) mostrando:
  - Empleados activos (verde)
  - Empleados inactivos (gris)

**3. Tabla de Liquidaciones Recientes:**

- Lista de las últimas liquidaciones procesadas
- Columnas: Empleado, Período, Total, Estado
- Estados posibles: Borrador, Pendiente, Aprobada, Procesada, Pagada

**4. Barra de Navegación Lateral:**

- Dashboard
- Empleados
- Liquidaciones
- Reportes
- Gestión de Usuarios
- Roles de Usuario

---

## Gestión de Empleados

La sección de empleados permite administrar toda la información del personal.

### Lista de Empleados

**Funcionalidades principales:**

- Visualización en tabla con información clave
- Filtros por estado (activo/inactivo)
- Búsqueda por nombre
- Ordenamiento por columnas

**Columnas de la tabla:**

- **Nombre:** Nombre completo del empleado
- **DNI:** Documento Nacional de Identidad
- **Posición:** Cargo del empleado
- **Fecha de Ingreso:** Fecha de inicio de trabajo
- **Sueldo Diario:** Salario base por día
- **Estado:** Activo o Inactivo
- **Acciones:** Botones para editar, ver documentos, activar/desactivar

### Agregar Nuevo Empleado

**Pasos para crear un empleado:**

1. Clic en botón "Nuevo Empleado" (+ ícono)
2. Completar formulario con datos obligatorios:
   - **Nombre completo** (requerido)
   - **DNI** (requerido, único)
   - **Posición** (requerido)
   - **Fecha de ingreso** (requerido)
   - **Sueldo diario** (requerido)
   - **Email** (opcional)
   - **Teléfono** (opcional)
   - **Dirección** (opcional)
3. Clic en "Guardar"

**Validaciones:**

- DNI debe ser único en el sistema
- Fecha de ingreso no puede ser futura
- Sueldo diario debe ser mayor a 0
- Email debe tener formato válido

### Editar Empleado

**Campos editables:**

- Nombre completo
- Posición
- Fecha de ingreso
- Sueldo diario
- Email
- Teléfono
- Dirección

**Campos no editables:**

- DNI (protegido para mantener integridad)

**Proceso de edición:**

1. Clic en ícono de edición (lápiz) en la fila del empleado
2. Modificar campos necesarios
3. Clic en "Actualizar Empleado"

### Gestión de Estado

**Activar/Desactivar empleados:**

- Clic en ícono de encendido/apagado
- Confirmación requerida para cambios de estado
- Los empleados inactivos no aparecen en nuevas liquidaciones
- Se mantiene historial completo de empleados inactivos

### Información de Vacaciones

**Cálculo automático:**

- **Antigüedad:** Calculada automáticamente desde fecha de ingreso
- **Elegibilidad:** Requiere mínimo 6 meses de antigüedad
- **Días disponibles:** Basado en antigüedad según legislación

**Estados de elegibilidad:**

- ❌ **No elegible:** Menos de 6 meses de antigüedad
- ✅ **Elegible:** 6 meses o más de antigüedad

---

## Sistema de Liquidaciones

El módulo de liquidaciones es el corazón del sistema, permitiendo gestionar sueldos y pagos.

### Estructura de Liquidaciones

**Pestañas principales:**

1. **Período Actual:** Liquidaciones del mes en curso
2. **Historial:** Liquidaciones de períodos anteriores

### Crear Nueva Liquidación

**Paso 1: Selección de Empleado**

- Dropdown con empleados activos
- Información del empleado seleccionado
- Verificación de liquidación existente para el período

**Paso 2: Datos Básicos**

- **Días trabajados:** Por defecto 30, ajustable
- **Período:** Selección de año y mes
- **Días feriados:** Cantidad de feriados trabajados (pago doble)

**Paso 3: Conceptos Adicionales**

- **Horas extras:** Checkbox para habilitar + campo de horas
- **Presentismo:** Estado (mantiene/perdido)
- **Bono libre:** Monto adicional por bonificaciones
- **Adelantos:** Montos entregados durante el mes
- **Descuentos:** Deducciones aplicables

**Paso 4: Configuración de Pago**

- **Sueldo en blanco:** Monto a depositar
- **Sueldo informal:** Monto en efectivo
- Cálculo automático basado en configuración

### Cálculos Automáticos

**Conceptos incluidos:**

1. **Sueldo base:** Días trabajados × Sueldo diario
2. **Horas extras:** Horas × (Sueldo hora × 1.5)
3. **Feriados:** Días feriados × Sueldo diario × 2
4. **Presentismo:** 8.33% del sueldo base (si mantiene)
5. **Aguinaldo:** Cálculo automático en junio y diciembre
6. **Total bruto:** Suma de todos los conceptos positivos
7. **Deducciones:** Adelantos + Descuentos
8. **Total neto:** Total bruto - Deducciones

### Vista Previa de Liquidación

**Información mostrada:**

- Desglose completo de conceptos
- Cálculos detallados
- Total neto final
- Distribución entre depósito y efectivo

### Estados de Liquidación

1. **Borrador:** Recién creada, editable
2. **Pendiente:** Enviada para revisión
3. **Aprobada:** Aprobada por supervisor
4. **Procesada:** Lista para pago
5. **Pagada:** Pago completado

**Transiciones de estado:**

- Solo administradores pueden cambiar estados
- Liquidaciones pagadas no son editables
- Historial de cambios de estado

### Tabla de Liquidaciones

**Columnas detalladas:**

- **Empleado:** Nombre del empleado
- **Período:** Mes y año de liquidación
- **Días Base:** Días trabajados normales
- **Feriados:** Días feriados trabajados
- **Horas Extras:** Cantidad y monto
- **Bono Libre:** Bonificaciones adicionales
- **Descuentos:** Deducciones aplicadas
- **Aguinaldo:** Monto de aguinaldo (si aplica)
- **Adelantos:** Adelantos descontados
- **En Blanco:** Monto para depósito
- **Informal:** Monto en efectivo
- **Presentismo:** Estado y monto
- **Total Neto:** Total a pagar
- **Estado:** Estado actual de la liquidación
- **Documentos:** Gestión de documentos específicos
- **Acciones:** Editar, generar recibo, eliminar

### Filtros y Búsqueda

**Filtros disponibles:**

- **Por empleado:** Activos, todos, inactivos
- **Por estado:** Todos, borrador, pendiente, aprobada, procesada, pagada

### Generación de Recibos

**Formatos disponibles:**

1. **PDF:** Recibo profesional con logo y datos de empresa
2. **Excel:** Formato de planilla para procesamiento

**Información incluida:**

- Datos completos del empleado
- Datos de la empresa (Cádiz Bar de Tapas)
- Desglose detallado de conceptos
- Totales y neto a pagar
- Período de liquidación

**Proceso de generación:**

1. Clic en ícono de documento en fila de liquidación
2. Seleccionar formato (PDF o Excel)
3. Descarga automática del archivo

---

## Gestión de Documentos

El sistema permite gestionar documentos tanto generales de empleados como específicos de liquidaciones.

### Tipos de Documentos

**Documentos Generales del Empleado:**

- Accesibles desde la gestión de empleados
- No asociados a liquidaciones específicas
- Incluyen documentos personales, contratos, etc.

**Documentos de Liquidación:**

- Asociados a una liquidación específica
- Accesibles desde cada fila de liquidación
- Incluyen recibos, comprobantes, formularios

### Categorías de Documentos

1. **Recibo de Sueldo:** Recibos oficiales de pago
2. **SAC:** Documentos de Sueldo Anual Complementario
3. **Documentos:** Documentos generales del empleado
4. **Formularios:** Formularios legales y administrativos
5. **Otros Documentos:** Categoría general para otros archivos

### Subir Documentos

**Proceso de carga:**

1. Clic en botón "Gestionar Documentos"
2. Clic en "Nuevo Documento"
3. Seleccionar archivo:
   - **Tipos permitidos:** PDF, JPG, PNG, Word, Excel
   - **Tamaño máximo:** 10MB
4. Seleccionar categoría
5. Agregar descripción (opcional)
6. Clic en "Subir Documento"

**Validaciones:**

- Verificación de tipo de archivo
- Control de tamaño máximo
- Verificación de permisos de usuario

### Gestión de Documentos

**Funcionalidades disponibles:**

- **Ver lista:** Tabla con todos los documentos
- **Descargar:** Clic en ícono de descarga
- **Eliminar:** Solo para usuarios autorizados
- **Filtrar:** Por categoría de documento

**Información mostrada:**

- Nombre original del archivo
- Categoría del documento
- Fecha de carga
- Tamaño del archivo
- Usuario que lo subió

### Permisos de Documentos

**Seguridad implementada:**

- Row Level Security (RLS) en base de datos
- Empleados solo ven sus propios documentos
- Administradores acceden a todos los documentos
- Documentos de liquidación solo visibles para empleado relacionado

---

## Sistema de Vacaciones

El módulo de vacaciones gestiona las solicitudes y el balance de días libres.

### Reglas de Elegibilidad

**Regla principal:** Mínimo 6 meses de antigüedad

- Empleados nuevos no pueden solicitar vacaciones
- Cálculo automático de elegibilidad
- Advertencias para empleados no elegibles

### Cálculo de Días de Vacaciones

**Por antigüedad:**

- **6 meses a 5 años:** 14 días
- **5 a 10 años:** 21 días
- **10 a 20 años:** 28 días
- **Más de 20 años:** 35 días

**Cálculo proporcional:**

- Para empleados con menos de un año
- Días proporcionales al tiempo trabajado

### Estados de Solicitudes

1. **Pendiente:** Solicitud recién creada
2. **Aprobada:** Aprobada por supervisor
3. **Rechazada:** Rechazada con motivo

### Información de Vacaciones

**Panel de información:**

- **Días anuales:** Total según antigüedad
- **Días tomados:** Vacaciones ya utilizadas
- **Días disponibles:** Saldo restante
- **Período actual:** Año en curso

### Historial de Vacaciones

**Tabla de historial:**

- Fecha de inicio y fin
- Cantidad de días
- Motivo de la solicitud
- Estado actual
- Fecha de procesamiento

---

## Portal del Empleado

El portal del empleado es una interfaz dedicada para que cada empleado acceda a su información personal.

### Acceso al Portal

**Credenciales:**

- Usuario: DNI del empleado
- Contraseña: Asignada por administrador

**Primera vez:**

- Cambio obligatorio de contraseña
- Configuración de información personal

### Pestañas del Portal

#### 1. Datos Personales

**Información mostrada:**

- Nombre completo
- DNI
- Puesto de trabajo
- Fecha de ingreso
- Antigüedad calculada
- Teléfono y email
- Dirección

**Características:**

- Solo lectura para el empleado
- Cambios deben solicitarse al administrador

#### 2. Liquidaciones

**Historial personal:**

- Solo liquidaciones del empleado actual
- Tabla con información completa:
  - Período liquidado
  - Días trabajados
  - Sueldo bruto
  - Presentismo
  - Aguinaldo (si aplica)
  - Adelantos
  - Total neto
  - Estado de pago

**Generación de recibos:**

- Botón "Recibo" en cada fila
- Misma funcionalidad que en módulo administrativo
- Formatos PDF y Excel disponibles

#### 3. Vacaciones

**Panel de vacaciones:**

- Estado de elegibilidad
- Saldo actual de días
- Historial de solicitudes
- Advertencias si no es elegible

**Información detallada:**

- Días anuales según antigüedad
- Días ya tomados
- Días disponibles restantes
- Período de vigencia

#### 4. Documentos

**Documentos personales:**

- Solo documentos del empleado actual
- Categorías organizadas
- Descarga directa de archivos

**Restricciones:**

- No puede subir documentos
- Solo visualización y descarga
- Documentos de liquidaciones propias

### Navegación del Portal

**Header del portal:**

- Logo de la empresa
- Nombre y puesto del empleado
- Botón de logout

**Características de seguridad:**

- Sesión automática de timeout
- Acceso solo a información propia
- Logs de acceso registrados

---

## Gestión de Usuarios

La gestión de usuarios permite administrar el acceso y permisos del sistema.

### Lista de Usuarios

**Información mostrada:**

- Nombre del usuario
- Username (DNI)
- Email
- Rol asignado
- Estado (activo/inactivo)
- Fecha de último acceso

### Crear Nuevo Usuario

**Proceso de creación:**

1. Clic en "Nuevo Usuario"
2. Completar datos:
   - **Nombre completo**
   - **Username (DNI)**
   - **Email**
   - **Rol:** Admin, Manager, Employee
   - **Empleado asociado** (si aplica)
3. Contraseña temporal generada automáticamente
4. Usuario debe cambiar contraseña en primer login

### Roles del Sistema

#### 1. Administrator (Admin)

**Permisos completos:**

- Gestión de empleados (crear, editar, eliminar)
- Gestión de liquidaciones (todos los estados)
- Gestión de usuarios y roles
- Acceso a todos los reportes
- Gestión de documentos de todos los empleados

#### 2. Manager (Gerente)

**Permisos limitados:**

- Gestión de empleados (crear, editar)
- Liquidaciones (crear, editar hasta estado procesada)
- Visualización de reportes
- Gestión de documentos de empleados a cargo

#### 3. Employee (Empleado)

**Permisos mínimos:**

- Solo acceso al portal del empleado
- Visualización de información personal
- Descarga de recibos propios
- Consulta de vacaciones

### Gestión de Estado de Usuarios

**Activar/Desactivar:**

- Cambio de estado con confirmación
- Usuarios inactivos no pueden acceder
- Mantiene historial de accesos

**Forzar cambio de contraseña:**

- Opción para administradores
- Usuario debe cambiar en próximo login
- Útil para reset de seguridad

---

## Reportes

El módulo de reportes proporciona información analítica del sistema.

### Dashboard de Reportes

**Métricas principales:**

- Total de empleados activos/inactivos
- Liquidaciones por período
- Montos totales de nómina
- Estadísticas de vacaciones

### Reporte de Liquidaciones

**Filtros disponibles:**

- **Por período:** Selección de mes y año
- **Por empleado:** Individual o todos
- **Por estado:** Estado de liquidación

**Información incluida:**

- Listado completo de liquidaciones
- Totales por concepto
- Distribución entre efectivo y depósito
- Resumen ejecutivo

**Formatos de exportación:**

- Excel para análisis detallado
- PDF para reportes ejecutivos

### Visualizaciones

**Gráficos disponibles:**

- Distribución de empleados por estado
- Evolución de nómina por período
- Análisis de conceptos salariales
- Tendencias de liquidaciones

---

## Solución de Problemas

### Problemas Comunes

#### 1. No puedo iniciar sesión

**Posibles causas:**

- Usuario o contraseña incorrectos
- Usuario desactivado
- Problemas de conexión

**Soluciones:**

- Verificar credenciales
- Contactar administrador
- Verificar conexión a internet

#### 2. Error al cargar documentos

**Posibles causas:**

- Archivo muy grande (>10MB)
- Formato no permitido
- Problemas de permisos

**Soluciones:**

- Reducir tamaño del archivo
- Convertir a formato permitido (PDF, JPG, PNG, Word, Excel)
- Verificar permisos de usuario

#### 3. Liquidación no se calcula correctamente

**Verificaciones:**

- Datos del empleado correctos
- Conceptos ingresados apropiadamente
- Verificar reglas de cálculo

**Solución:**

- Revisar configuración del empleado
- Contactar administrador para verificación

#### 4. No veo mis documentos

**Posibles causas:**

- Documentos no subidos
- Problemas de permisos
- Error en el sistema

**Soluciones:**

- Verificar que documentos fueron subidos
- Contactar administrador
- Actualizar página del navegador

### Contacto de Soporte

**Para problemas técnicos:**

- Contactar al administrador del sistema
- Crear reporte de incidente
- Proporcionar detalles del error

**Información a incluir:**

- Descripción del problema
- Pasos realizados antes del error
- Captura de pantalla si es posible
- Usuario y hora del incidente

---

## Mejores Prácticas

### Para Administradores

1. **Backup regular** de datos importantes
2. **Revisión periódica** de permisos de usuarios
3. **Actualización** de información de empleados
4. **Verificación** de cálculos de liquidaciones
5. **Monitoreo** de accesos al sistema

### Para Empleados

1. **Cambiar contraseña** regularmente
2. **Cerrar sesión** al terminar
3. **Verificar información** personal periódicamente
4. **Guardar recibos** descargados
5. **Reportar problemas** inmediatamente

### Seguridad

1. **No compartir** credenciales de acceso
2. **Usar contraseñas seguras** (mínimo 8 caracteres)
3. **Verificar URL** antes de ingresar datos
4. **Cerrar navegador** en computadoras compartidas
5. **Reportar accesos sospechosos**

---

**Manual creado para Cádiz Bar de Tapas**  
**Sistema de Gestión de RRHH v1.0**  
**Diciembre 2024**
