# 🚀 Configuración de Supabase para Cádiz Bar de Tapas

## 📋 Pasos para configurar la base de datos real

### 1. **Crear cuenta en Supabase**

1. Ve a [supabase.com](https://supabase.com)
2. Regístrate o inicia sesión
3. Clic en "New Project"
4. Elige nombre: `cadiz-bar-tapas`
5. Región: `South America (São Paulo)` para menor latencia
6. Espera que se cree (2-3 minutos)

### 2. **Obtener credenciales**

1. En el dashboard del proyecto, ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJ...`

### 3. **Configurar variables de entorno**

1. Crea archivo `.env.local` en la raíz del proyecto:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. **Crear las tablas**

1. En Supabase, ve a **SQL Editor**
2. Copia todo el contenido del archivo `database/schema.sql`
3. Pégalo en el editor y ejecuta (botón **Run**)
4. Verifica que se crearon las tablas en **Table Editor**

### 5. **Migrar datos existentes**

Los datos mock actuales se migrarán automáticamente. El sistema detectará si hay datos en Supabase y los usará, sino usará los datos mock.

### 6. **Configurar autenticación (opcional)**

Para autenticación avanzada:

1. Ve a **Authentication** → **Settings**
2. Habilita **Email confirmations**
3. Configura **SMTP settings** si quieres emails reales

---

## 🏗️ **Arquitectura Escalable**

### **Estructura actual:**

```
Frontend (React)
    ↓
useEmployees Hook
    ↓
EmployeeService (Interface)
    ↓
SupabaseEmployeeService (Implementación)
    ↓
Supabase (PostgreSQL)
```

### **Migración futura a backend propio:**

```
Frontend (React)
    ↓ [NO CAMBIA]
useEmployees Hook
    ↓ [NO CAMBIA]
EmployeeService (Interface)
    ↓ [SOLO CAMBIAR IMPLEMENTACIÓN]
NodeJSEmployeeService (Nueva implementación)
    ↓
API REST Custom
    ↓
PostgreSQL/MySQL
```

---

## 🔄 **Cómo migrar a backend propio después**

### **Paso 1:** Crear nuevo servicio

```typescript
export class NodeJSEmployeeService implements IEmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    const response = await fetch("/api/employees");
    return response.json();
  }
  // ... resto de métodos igual
}
```

### **Paso 2:** Cambiar factory

```typescript
export const createEmployeeService = (): IEmployeeService => {
  if (process.env.VITE_USE_API === "true") {
    return new NodeJSEmployeeService(); // ← Cambio aquí
  }
  return new SupabaseEmployeeService();
};
```

### **Paso 3:** El frontend NO cambia

- Los componentes siguen usando `useEmployees()`
- Los hooks siguen iguales
- Las interfaces siguen iguales
- **CERO cambios en React components**

---

## 📊 **Base de datos**

### **Tablas creadas:**

- ✅ `employees` - Empleados
- ✅ `payroll_records` - Liquidaciones
- ✅ `vacation_requests` - Solicitudes de vacaciones
- ✅ `users` - Usuarios del sistema
- ✅ `files` - Archivos/documentos
- ✅ `audit_log` - Auditoría de cambios

### **Características:**

- ✅ **Triggers automáticos** - Cálculo de sueldo diario y vacaciones
- ✅ **Row Level Security** - Permisos por rol
- ✅ **Auditoría completa** - Trazabilidad de cambios
- ✅ **Validaciones** - Integridad de datos
- ✅ **Índices optimizados** - Performance

### **Datos iniciales:**

- ✅ 5 empleados de ejemplo (mismos del mock)
- ✅ 4 usuarios del sistema con roles
- ✅ Vacaciones calculadas por antigüedad real

---

## 🛠️ **Testing**

### **Para probar la integración:**

1. Configura las variables de entorno
2. Ejecuta el schema SQL
3. Reinicia el servidor: `npm run dev`
4. Los datos aparecerán automáticamente

### **Fallback automático:**

Si hay problemas con Supabase, el sistema usa automáticamente los datos mock sin romperse.

---

## 🚀 **Próximos pasos**

1. **Configurar Supabase** (30 minutos)
2. **Migrar empleados** ✅ (ya está)
3. **Migrar liquidaciones** (próximo)
4. **Migrar vacaciones** (próximo)
5. **Autenticación real** (próximo)

---

## 💡 **Ventajas de esta arquitectura**

✅ **Escalable** - Fácil migración a backend propio  
✅ **Testeable** - Interfaces bien definidas  
✅ **Mantenible** - Separación de responsabilidades  
✅ **Flexible** - Cambiar provider sin tocar frontend  
✅ **TypeScript** - Tipado fuerte en toda la app  
✅ **Real-time** - Supabase soporta subscripciones  
✅ **Backup automático** - Supabase maneja backups  
✅ **Escalamiento automático** - Sin configuración adicional

---

**¿Listo para empezar con datos reales? ¡Sigue los pasos y en 30 minutos tendrás todo funcionando!** 🎉
