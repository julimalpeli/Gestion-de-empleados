# Documentación Técnica - Sistema de Gestión de RRHH

## Cádiz Bar de Tapas

---

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Desarrollado con:** React + TypeScript + Supabase

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
4. [Arquitectura Frontend](#arquitectura-frontend)
5. [Servicios y APIs](#servicios-y-apis)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Gestión de Estado](#gestión-de-estado)
8. [Componentes y UI](#componentes-y-ui)
9. [Despliegue e Infraestructura](#despliegue-e-infraestructura)
10. [Performance y Optimización](#performance-y-optimización)
11. [Monitoreo y Logs](#monitoreo-y-logs)
12. [Mantenimiento](#mantenimiento)

---

## Arquitectura del Sistema

### Patrón Arquitectónico

El sistema implementa una **arquitectura cliente-servidor con BaaS (Backend as a Service)** utilizando Supabase como backend principal.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase       │    │   Storage       │
│   (React SPA)   │◄──►│   (PostgreSQL)   │◄──►│   (Files)       │
│                 │    │                  │    │                 │
│ - React 18      │    │ - Database       │    │ - Documents     │
│ - TypeScript    │    │ - Auth           │    │ - Receipts      │
│ - Vite          │    │ - Real-time      │    │ - Images        │
│ - Tailwind CSS  │    │ - Row Level Sec  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Principios de Diseño

1. **Separation of Concerns:** Separación clara entre UI, lógica de negocio y datos
2. **Single Responsibility:** Cada componente tiene una responsabilidad específica
3. **DRY (Don't Repeat Yourself):** Reutilización de componentes y lógica
4. **SOLID Principles:** Aplicados en servicios y componentes
5. **Security by Design:** Seguridad implementada desde el diseño

---

## Stack Tecnológico

### Frontend

#### Core Technologies

```typescript
// Package.json dependencies principales
{
  "react": "^18.3.1",                    // Biblioteca de UI
  "typescript": "^5.5.3",               // Tipado estático
  "vite": "^6.2.2",                     // Build tool y dev server
  "react-router-dom": "^6.26.2"         // Enrutamiento SPA
}
```

#### UI Framework y Styling

```typescript
{
  "tailwindcss": "^3.4.11",             // Framework CSS utility-first
  "@radix-ui/react-*": "^1.x.x",        // Componentes base accesibles
  "lucide-react": "^0.462.0",           // Librería de iconos
  "framer-motion": "^12.6.2",           // Animaciones
  "class-variance-authority": "^0.7.1",  // Variants de CSS
  "clsx": "^2.1.1"                      // Concatenación condicional de clases
}
```

#### Forms y Validación

```typescript
{
  "react-hook-form": "^7.53.0",         // Manejo de formularios
  "@hookform/resolvers": "^3.9.0",      // Resolvers para validación
  "zod": "^3.23.8"                      // Schema validation
}
```

#### Data Fetching y Estado

```typescript
{
  "@tanstack/react-query": "^5.56.2",   // Server state management
  "@supabase/supabase-js": "^2.50.2"    // Cliente de Supabase
}
```

#### Utilities

```typescript
{
  "date-fns": "^3.6.0",                 // Manipulación de fechas
  "recharts": "^2.12.7"                 // Gráficos y visualizaciones
}
```

### Backend (Supabase)

#### Database

- **PostgreSQL 15+** - Base de datos relacional principal
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Triggers y Functions** - Lógica de negocio en base de datos
- **Extensions habilitadas:**
  - `uuid-ossp` - Generación de UUIDs
  - `pg_stat_statements` - Estadísticas de queries

#### Authentication

- **Supabase Auth** - Sistema de autenticación JWT
- **Políticas RLS** - Control de acceso granular
- **Session Management** - Gestión de sesiones automática

#### Storage

- **Supabase Storage** - Almacenamiento de archivos
- **Buckets configurados:**
  - `employee-documents` - Documentos de empleados y liquidaciones

### Development Tools

```typescript
{
  "@vitejs/plugin-react-swc": "^3.5.0", // Plugin React para Vite con SWC
  "@types/node": "^22.5.5",             // Tipos de Node.js
  "@types/react": "^18.3.3",            // Tipos de React
  "autoprefixer": "^10.4.20",           // Autoprefixer para CSS
  "prettier": "^3.5.3",                 // Formateador de código
  "vitest": "^3.1.4"                    // Framework de testing
}
```

---

## Estructura de la Base de Datos

### Diagrama ERD

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     users       │    │   employees     │    │ payroll_records │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄──►│ id (PK)         │◄──►│ id (PK)         │
│ email           │    │ name            │    │ employee_id (FK)│
│ role            │    │ dni             │    │ period          │
│ employee_id(FK) │    │ position        │    │ base_days       │
│ created_at      │    │ daily_wage      │    │ net_total       │
│ updated_at      │    │ start_date      │    │ status          │
└─────────────────┘    │ status          │    │ created_at      │
                       │ email           ���    └─────────────────┘
                       │ address         │              │
                       │ phone           │              │
                       │ vacations_taken │              │
                       │ created_at      │              │
                       └─────────────────┘              │
                                │                       │
                                │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │vacation_requests│    │employee_documents│
                       ├─────────────────┤    ├─────────────────┤
                       │ id (PK)         │    │ id (PK)         │
                       │ employee_id(FK) │    │ employee_id(FK) │
                       │ start_date      │    │ payroll_id (FK) │
                       │ end_date        │    │ file_name       │
                       │ days            │    │ original_name   │
                       │ reason          │    │ file_type       │
                       │ status          │    │ file_size       │
                       │ created_at      │    │ category        │
                       └─────────────────┘    │ file_url        │
                                              │ uploaded_at     │
                                              └─────────────────┘
```

### Esquemas Detallados

#### Tabla: `employees`

```sql
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    position VARCHAR(255) NOT NULL,
    daily_wage DECIMAL(10,2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    email VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    vacations_taken INTEGER DEFAULT 0,
    document_type VARCHAR(10) DEFAULT 'DNI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employees_dni ON employees(dni);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_start_date ON employees(start_date);
```

#### Tabla: `payroll_records`

```sql
CREATE TABLE payroll_records (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    period VARCHAR(7) NOT NULL, -- YYYY-MM format
    base_days INTEGER NOT NULL DEFAULT 30,
    holiday_days INTEGER DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    advances DECIMAL(10,2) DEFAULT 0,
    discounts DECIMAL(10,2) DEFAULT 0,
    white_amount DECIMAL(10,2) DEFAULT 0,
    informal_amount DECIMAL(10,2) DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    presentismo_amount DECIMAL(10,2) DEFAULT 0,
    aguinaldo DECIMAL(10,2) DEFAULT 0,
    net_total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending', 'approved', 'processed', 'paid')),
    processed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Campos calculados adicionales
    holiday_bonus DECIMAL(10,2) DEFAULT 0,
    overtime_amount DECIMAL(10,2) DEFAULT 0,

    -- Constraint para período único por empleado
    UNIQUE(employee_id, period)
);

-- Indexes
CREATE INDEX idx_payroll_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_period ON payroll_records(period);
CREATE INDEX idx_payroll_status ON payroll_records(status);
```

#### Tabla: `users`

```sql
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'employee'
        CHECK (role IN ('admin', 'manager', 'employee')),
    employee_id BIGINT REFERENCES employees(id),
    username VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    force_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_username ON users(username);
```

#### Tabla: `employee_documents`

```sql
CREATE TABLE employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    payroll_id BIGINT REFERENCES payroll_records(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('recibo_sueldo', 'sac', 'documentos', 'formularios', 'otros')),
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employee_docs_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_employee_docs_payroll_id ON employee_documents(payroll_id);
CREATE INDEX idx_employee_docs_category ON employee_documents(category);
```

#### Tabla: `vacation_requests`

```sql
CREATE TABLE vacation_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vacation_requests_employee_id ON vacation_requests(employee_id);
CREATE INDEX idx_vacation_requests_status ON vacation_requests(status);
CREATE INDEX idx_vacation_requests_start_date ON vacation_requests(start_date);
```

### Row Level Security (RLS)

#### Políticas de Seguridad

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;

-- Política para empleados: solo admins y managers ven todo
CREATE POLICY "employees_select_policy" ON employees
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'manager')
    )
);

-- Política para documentos: empleados solo ven los suyos
CREATE POLICY "employee_documents_select_policy" ON employee_documents
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (
            users.role IN ('admin', 'manager')
            OR users.employee_id = employee_documents.employee_id
        )
    )
);

-- Política para liquidaciones: empleados solo ven las suyas
CREATE POLICY "payroll_records_select_policy" ON payroll_records
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (
            users.role IN ('admin', 'manager')
            OR users.employee_id = payroll_records.employee_id
        )
    )
);
```

### Triggers y Functions

#### Trigger para sincronización de empleados

```sql
-- Function para sincronizar datos entre employees y users
CREATE OR REPLACE FUNCTION sync_employee_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar datos en tabla users cuando cambia employee
    UPDATE users
    SET name = NEW.name,
        updated_at = NOW()
    WHERE employee_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función
CREATE TRIGGER trigger_sync_employee_user_data
    AFTER UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION sync_employee_user_data();
```

#### Function para cálculo de vacaciones

```sql
CREATE OR REPLACE FUNCTION calculate_vacation_days(
    employee_start_date DATE,
    calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_months INTEGER,
    vacation_days INTEGER,
    eligible_for_vacations BOOLEAN
) AS $$
DECLARE
    months_worked INTEGER;
BEGIN
    -- Calcular meses trabajados
    months_worked := EXTRACT(YEAR FROM AGE(calculation_date, employee_start_date)) * 12
                   + EXTRACT(MONTH FROM AGE(calculation_date, employee_start_date));

    -- Determinar días de vacaciones según antigüedad
    IF months_worked < 6 THEN
        RETURN QUERY SELECT months_worked, 0, false;
    ELSIF months_worked < 60 THEN -- Menos de 5 años
        RETURN QUERY SELECT months_worked, 14, true;
    ELSIF months_worked < 120 THEN -- 5-10 años
        RETURN QUERY SELECT months_worked, 21, true;
    ELSIF months_worked < 240 THEN -- 10-20 años
        RETURN QUERY SELECT months_worked, 28, true;
    ELSE -- Más de 20 años
        RETURN QUERY SELECT months_worked, 35, true;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Arquitectura Frontend

### Estructura de Directorios

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── AppSidebar.tsx  # Navegación principal
│   ├── DocumentManager.tsx
│   ├── VacationManager.tsx
│   ├── ProtectedRoute.tsx
│   └── PermissionGate.tsx
├── pages/              # Páginas principales
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── Payroll.tsx
│   ├── EmployeePortal.tsx
│   ├── Login.tsx
│   └── ...
├── hooks/              # Custom hooks
│   ├── use-auth.tsx    # Autenticación
│   ├── use-employees.tsx
│   ├── use-payroll.tsx
│   ├── use-documents.tsx
│   └── use-permissions.tsx
├── services/           # Servicios de datos
│   ├── employeeService.ts
│   ├── documentService.ts
│   └── interfaces.ts
├── utils/              # Utilidades
│   ├── receiptGenerator.ts
│   └── calculations.ts
├── lib/                # Configuraciones
│   └── supabase.ts
├── App.tsx             # Componente raíz
└── main.tsx           # Entry point
```

### Patrones de Diseño Implementados

#### 1. Custom Hooks Pattern

```typescript
// hooks/use-employees.tsx
export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    // ... más métodos
  };
};
```

#### 2. Service Layer Pattern

```typescript
// services/employeeService.ts
class EmployeeService implements IEmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error) throw error;
    return data.map(this.mapFromSupabase);
  }

  private mapFromSupabase(data: any): Employee {
    return {
      id: data.id,
      name: data.name,
      dni: data.dni,
      // ... mapeo completo
    };
  }
}

export const employeeService = new EmployeeService();
```

#### 3. Compound Component Pattern

```typescript
// components/DocumentManager.tsx
export default function DocumentManager({
  isOpen,
  onClose,
  employee,
  payrollId
}: DocumentManagerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DocumentUploadForm />
        <DocumentList />
        <DocumentActions />
      </DialogContent>
    </Dialog>
  );
}
```

### Gestión de Estado

#### 1. Local State (useState)

```typescript
// Estado local para componentes
const [selectedEmployee, setSelectedEmployee] = useState("");
const [formData, setFormData] = useState<FormData>({});
const [isLoading, setIsLoading] = useState(false);
```

#### 2. Server State (React Query simulado)

```typescript
// Custom hooks para server state
const useEmployees = () => {
  // Simula React Query con useState + useEffect
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch data y cache management
  }, []);

  return { data, isLoading, refetch };
};
```

#### 3. Context API para Auth

```typescript
// hooks/use-auth.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Configurar listeners de Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Componentes de UI

#### Design System basado en Radix UI

```typescript
// components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

---

## Servicios y APIs

### Supabase Client Configuration

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "public",
  },
  storage: {
    // Configuración para storage de documentos
  },
});
```

### Employee Service

```typescript
// services/employeeService.ts
export class SupabaseEmployeeService implements IEmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error) throw error;
    return data.map(this.mapFromSupabase);
  }

  async createEmployee(employee: CreateEmployeeRequest): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .insert([this.mapToSupabase(employee)])
      .select()
      .single();

    if (error) throw error;
    return this.mapFromSupabase(data);
  }

  async updateEmployee(
    id: number,
    updates: Partial<Employee>,
  ): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .update(this.mapToSupabase(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromSupabase(data);
  }

  async toggleEmployeeStatus(id: number): Promise<Employee> {
    // Lógica para cambiar estado activo/inactivo
    const employee = await this.getEmployeeById(id);
    const newStatus = employee.status === "active" ? "inactive" : "active";
    return this.updateEmployee(id, { status: newStatus });
  }

  async calculateVacationDays(
    employeeId: number,
  ): Promise<VacationCalculation> {
    // Llamada a función SQL para cálculo de vacaciones
    const { data, error } = await supabase.rpc("calculate_vacation_days", {
      employee_id: employeeId,
    });

    if (error) throw error;
    return data;
  }

  private mapFromSupabase(data: any): Employee {
    return {
      id: data.id,
      name: data.name,
      dni: data.dni,
      position: data.position,
      dailyWage: Number(data.daily_wage),
      startDate: data.start_date,
      status: data.status,
      email: data.email,
      address: data.address,
      phone: data.phone,
      vacationsTaken: data.vacations_taken || 0,
      documentType: data.document_type || "DNI",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToSupabase(employee: Partial<Employee>): any {
    return {
      name: employee.name,
      dni: employee.dni,
      position: employee.position,
      daily_wage: employee.dailyWage,
      start_date: employee.startDate,
      status: employee.status,
      email: employee.email,
      address: employee.address,
      phone: employee.phone,
      vacations_taken: employee.vacationsTaken,
      document_type: employee.documentType,
    };
  }
}
```

### Document Service

```typescript
// services/documentService.ts
export class DocumentService {
  private readonly BUCKET_NAME = "employee-documents";

  async uploadDocument(
    request: CreateDocumentRequest,
  ): Promise<EmployeeDocument> {
    // 1. Upload file to Supabase Storage
    const fileExt = request.file.name.split(".").pop();
    const fileName = `${request.employeeId}/${Date.now()}_${request.category}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, request.file);

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

    // 3. Save document metadata to database
    const { data, error } = await supabase
      .from("employee_documents")
      .insert([
        {
          employee_id: request.employeeId,
          payroll_id: request.payrollId,
          file_name: fileName,
          original_file_name: request.file.name,
          file_type: request.file.type,
          file_size: request.file.size,
          category: request.category,
          description: request.description,
          file_url: publicUrl,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return this.mapFromSupabase(data);
  }

  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    const { data, error } = await supabase
      .from("employee_documents")
      .select("*")
      .eq("employee_id", employeeId)
      .is("payroll_id", null) // Solo documentos generales
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data.map(this.mapFromSupabase);
  }

  async getPayrollDocuments(payrollId: string): Promise<EmployeeDocument[]> {
    const { data, error } = await supabase
      .from("employee_documents")
      .select("*")
      .eq("payroll_id", payrollId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data.map(this.mapFromSupabase);
  }

  async deleteDocument(id: string): Promise<void> {
    // 1. Get document info
    const { data: doc, error: getError } = await supabase
      .from("employee_documents")
      .select("file_name")
      .eq("id", id)
      .single();

    if (getError) throw getError;

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([doc.file_name]);

    if (storageError) throw storageError;

    // 3. Delete from database
    const { error: dbError } = await supabase
      .from("employee_documents")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;
  }
}
```

### Payroll Service

```typescript
// Implementado dentro de hooks/use-payroll.tsx
export const usePayroll = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  const createPayrollRecord = async (
    record: CreatePayrollRequest,
  ): Promise<PayrollRecord> => {
    const { data, error } = await supabase
      .from("payroll_records")
      .insert([record])
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setPayrollRecords((prev) => [data, ...prev]);
    return data;
  };

  const updatePayrollRecord = async (
    id: number,
    updates: Partial<PayrollRecord>,
  ): Promise<PayrollRecord> => {
    const { data, error } = await supabase
      .from("payroll_records")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setPayrollRecords((prev) =>
      prev.map((record) => (record.id === id ? data : record)),
    );
    return data;
  };

  // ... más métodos
};
```

---

## Autenticación y Seguridad

### Sistema de Autenticación

#### Configuración de Supabase Auth

```typescript
// hooks/use-auth.tsx
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          await handleSignIn(session);
          break;
        case "SIGNED_OUT":
          await handleSignOut();
          break;
        case "PASSWORD_RECOVERY":
          // Handle password recovery
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username, // Using username as email
      password,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    login,
    logout,
    changePassword,
  };
};
```

#### Sistema de Roles

```typescript
// hooks/use-permissions.tsx
export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("role, employee_id")
      .eq("id", user?.id)
      .single();

    if (error) throw error;
    setUserRole(data.role);
  };

  const isAdmin = () => userRole === "admin";
  const isManager = () => userRole === "manager";
  const isEmployee = () => userRole === "employee";

  const canEditModule = (module: string) => {
    switch (module) {
      case "employees":
        return isAdmin() || isManager();
      case "payroll":
        return isAdmin() || isManager();
      case "users":
        return isAdmin();
      default:
        return false;
    }
  };

  const canViewModule = (module: string) => {
    // Todos pueden ver sus propios datos
    return true;
  };

  return {
    userRole,
    isAdmin,
    isManager,
    isEmployee,
    canEditModule,
    canViewModule,
  };
};
```

### Protección de Rutas

```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
  module?: string;
  action?: 'read' | 'write' | 'delete';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  module,
  action = 'read'
}) => {
  const { user, loading } = useAuth();
  const { userRole, canEditModule } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !requiredRole.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (module && action === 'write' && !canEditModule(module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### Row Level Security (RLS)

#### Políticas Implementadas

```sql
-- Política para employees: admins y managers ven todo
CREATE POLICY "employees_admin_manager_all" ON employees
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'manager')
    )
);

-- Política para documentos: empleados solo ven los suyos
CREATE POLICY "documents_employee_own" ON employee_documents
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (
            users.role IN ('admin', 'manager')
            OR users.employee_id = employee_documents.employee_id
        )
    )
);

-- Política para liquidaciones: empleados solo ven las suyas
CREATE POLICY "payroll_employee_own" ON payroll_records
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (
            users.role IN ('admin', 'manager')
            OR users.employee_id = payroll_records.employee_id
        )
    )
);

-- Política para inserción de documentos
CREATE POLICY "documents_upload_policy" ON employee_documents
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'manager')
    )
);
```

### Validación y Sanitización

```typescript
// utils/validation.ts
import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  dni: z.string().regex(/^\d{7,8}$/, "DNI debe tener 7 u 8 dígitos"),
  position: z.string().min(2, "Posición requerida"),
  dailyWage: z.number().positive("Sueldo debe ser positivo"),
  startDate: z.string().refine((date) => {
    const d = new Date(date);
    return d <= new Date();
  }, "Fecha no puede ser futura"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const payrollSchema = z.object({
  employeeId: z.number().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Formato de período inválido"),
  baseDays: z.number().min(1).max(31),
  holidayDays: z.number().min(0).max(31),
  overtimeHours: z.number().min(0).max(200),
  advances: z.number().min(0),
  discounts: z.number().min(0),
  bonusAmount: z.number().min(0),
});
```

---

## Gestión de Estado

### Estado Local vs Estado del Servidor

#### Estado Local (useState)

```typescript
// Para UI state y formularios
const [isOpen, setIsOpen] = useState(false);
const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
const [formData, setFormData] = useState<FormData>({});
const [filters, setFilters] = useState({
  status: "all",
  search: "",
});
```

#### Estado del Servidor (Custom Hooks)

```typescript
// hooks/use-employees.tsx
export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache management
  const [lastFetch, setLastFetch] = useState<number>(0);
  const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

  const fetchEmployees = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Return cached data if recent
      if (!force && employees.length > 0 && now - lastFetch < CACHE_TIME) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await employeeService.getAllEmployees();

        setEmployees(data);
        setLastFetch(now);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [employees.length, lastFetch],
  );

  // Métodos CRUD
  const createEmployee = useCallback(
    async (employee: CreateEmployeeRequest) => {
      try {
        const newEmployee = await employeeService.createEmployee(employee);
        setEmployees((prev) => [newEmployee, ...prev]);
        return newEmployee;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al crear empleado",
        );
        throw err;
      }
    },
    [],
  );

  const updateEmployee = useCallback(
    async (id: number, updates: Partial<Employee>) => {
      try {
        const updatedEmployee = await employeeService.updateEmployee(
          id,
          updates,
        );
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? updatedEmployee : emp)),
        );
        return updatedEmployee;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al actualizar empleado",
        );
        throw err;
      }
    },
    [],
  );

  const deleteEmployee = useCallback(async (id: number) => {
    try {
      await employeeService.deleteEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar empleado",
      );
      throw err;
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetch: () => fetchEmployees(true),
    createEmployee,
    updateEmployee,
    deleteEmployee,
    // Computed values
    activeEmployees: employees.filter((emp) => emp.status === "active"),
    inactiveEmployees: employees.filter((emp) => emp.status === "inactive"),
  };
};
```

### Context API para Estado Global

```typescript
// contexts/AppContext.tsx
interface AppContextType {
  currentUser: User | null;
  permissions: Permissions;
  settings: AppSettings;
  notifications: Notification[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [settings, setSettings] = useState<AppSettings>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Effect para cargar datos iniciales
  useEffect(() => {
    loadUserData();
    loadPermissions();
    loadSettings();
  }, []);

  const value = {
    currentUser,
    permissions,
    settings,
    notifications,
    // Actions
    updateSettings,
    addNotification,
    removeNotification
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
```

---

## Componentes y UI

### Design System

#### Tokens de Diseño

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

#### Variables CSS

```css
/* index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variables */
}
```

### Componentes Base

#### Button Component

```typescript
// components/ui/button.tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

#### Input Component

```typescript
// components/ui/input.tsx
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

### Componentes Compuestos

#### Table Component

```typescript
// components/ui/table.tsx
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
};
```

### Componentes de Negocio

#### Employee Form Component

```typescript
// components/EmployeeForm.tsx
interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: CreateEmployeeRequest) => Promise<void>;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel
}) => {
  const form = useForm<CreateEmployeeRequest>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || {
      name: '',
      dni: '',
      position: '',
      dailyWage: 0,
      startDate: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  const handleSubmit = async (data: CreateEmployeeRequest) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DNI</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ... más campos */}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {employee ? 'Actualizar' : 'Crear'} Empleado
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

---

## Despliegue e Infraestructura

### Configuración de Build

#### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
```

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### Netlify Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_SUPABASE_URL = "https://your-project.supabase.co"
  VITE_SUPABASE_ANON_KEY = "your-anon-key"
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 9;
}
```

### Environment Variables

```bash
# .env.local (development)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# .env.production
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## Performance y Optimización

### Code Splitting

```typescript
// Lazy loading de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Payroll = lazy(() => import('./pages/Payroll'));

// App.tsx
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/payroll" element={<Payroll />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoización

```typescript
// Memoización de componentes costosos
const EmployeeTable = memo(({ employees, onEdit, onDelete }) => {
  return (
    <Table>
      {employees.map(employee => (
        <EmployeeRow
          key={employee.id}
          employee={employee}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Table>
  );
});

// Memoización de cálculos
const usePayrollCalculations = (employee, workDays, overtimeHours) => {
  return useMemo(() => {
    const basePay = employee.dailyWage * workDays;
    const overtimePay = overtimeHours * (employee.dailyWage / 8) * 1.5;
    const total = basePay + overtimePay;

    return { basePay, overtimePay, total };
  }, [employee.dailyWage, workDays, overtimeHours]);
};
```

### Optimización de Imágenes

```typescript
// Lazy loading de imágenes
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} {...props}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  );
};
```

### Bundle Analysis

```json
// package.json
{
  "scripts": {
    "analyze": "npx vite-bundle-analyzer dist"
  }
}
```

---

## Monitoreo y Logs

### Error Handling

```typescript
// utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unknown error occurred');
};

// Error Boundary
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Send to monitoring service
    // logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Logging

```typescript
// utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, meta?: any) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  }

  info(message: string, meta?: any) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, meta);
    }
  }

  warn(message: string, meta?: any) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, meta);
    }
  }

  error(message: string, error?: Error, meta?: any) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, meta);

      // Send to external service in production
      if (import.meta.env.PROD) {
        this.sendToExternalService(message, error, meta);
      }
    }
  }

  private sendToExternalService(message: string, error?: Error, meta?: any) {
    // Implementation for external logging service
    // e.g., Sentry, LogRocket, etc.
  }
}

export const logger = new Logger();
```

### Performance Monitoring

```typescript
// utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();

  console.log(`${name} took ${end - start} milliseconds`);

  // Send to analytics
  if (import.meta.env.PROD) {
    // analytics.track('performance', { name, duration: end - start });
  }
};

export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      measurePerformance(`${componentName} render`, () => {});
    };
  }, [componentName]);
};
```

---

## Mantenimiento

### Scripts de Mantenimiento

```typescript
// scripts/cleanup.ts
import { supabase } from "../src/lib/supabase";

// Limpiar documentos huérfanos
export const cleanupOrphanedDocuments = async () => {
  const { data: orphanedDocs } = await supabase
    .from("employee_documents")
    .select("id, file_name")
    .is("employee_id", null);

  for (const doc of orphanedDocs || []) {
    await supabase.storage.from("employee-documents").remove([doc.file_name]);

    await supabase.from("employee_documents").delete().eq("id", doc.id);
  }
};

// Backup de datos críticos
export const backupCriticalData = async () => {
  const { data: employees } = await supabase.from("employees").select("*");

  const { data: payroll } = await supabase.from("payroll_records").select("*");

  const backup = {
    timestamp: new Date().toISOString(),
    employees,
    payroll,
  };

  // Save to external storage
  // await saveToExternalStorage(backup);
};
```

### Database Migrations

```sql
-- migrations/001_add_phone_to_employees.sql
ALTER TABLE employees
ADD COLUMN phone VARCHAR(50);

-- migrations/002_add_indexes_for_performance.sql
CREATE INDEX CONCURRENTLY idx_payroll_records_period_employee
ON payroll_records(period, employee_id);

CREATE INDEX CONCURRENTLY idx_employee_documents_uploaded_at
ON employee_documents(uploaded_at DESC);
```

### Testing Strategy

```typescript
// tests/services/employeeService.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { employeeService } from "../../src/services/employeeService";

describe("EmployeeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllEmployees", () => {
    it("should return all employees", async () => {
      const mockEmployees = [
        { id: 1, name: "John Doe", dni: "12345678" },
        { id: 2, name: "Jane Smith", dni: "87654321" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockEmployees,
            error: null,
          }),
        }),
      });

      const result = await employeeService.getAllEmployees();

      expect(result).toEqual(mockEmployees);
    });
  });

  describe("createEmployee", () => {
    it("should create a new employee", async () => {
      const newEmployee = {
        name: "New Employee",
        dni: "11111111",
        position: "Developer",
        dailyWage: 1000,
        startDate: "2024-01-01",
      };

      const mockResponse = { id: 3, ...newEmployee };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockResponse,
              error: null,
            }),
          }),
        }),
      });

      const result = await employeeService.createEmployee(newEmployee);

      expect(result).toEqual(mockResponse);
    });
  });
});
```

### Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

echo "🚀 Starting deployment..."

# 1. Install dependencies
npm ci

# 2. Run tests
npm run test

# 3. Type check
npm run typecheck

# 4. Build
npm run build

# 5. Deploy to Vercel
vercel --prod

echo "✅ Deployment completed!"
```

---

## Conclusión

Este sistema de gestión de RRHH representa una solución completa y robusta desarrollada con tecnologías modernas. La arquitectura implementada permite escalabilidad, mantenibilidad y seguridad, cumpliendo con todos los requerimientos del negocio.

### Características Técnicas Destacadas

1. **Arquitectura Moderna**: SPA con React 18 + TypeScript + Supabase
2. **Seguridad Robusta**: RLS, autenticación JWT, validación en múltiples capas
3. **UI/UX Profesional**: Design system consistente con Radix UI + Tailwind
4. **Performance Optimizada**: Code splitting, memoización, lazy loading
5. **Mantenibilidad**: Código limpio, patrones establecidos, testing

### Tecnologías Core

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: Radix UI, Tailwind CSS, Lucide Icons
- **Estado**: Custom hooks + Context API
- **Validación**: Zod + React Hook Form
- **Despliegue**: Vercel/Netlify + Docker

El sistema está preparado para producción y escalamiento futuro.

---

**Documentación Técnica v1.0**  
**Sistema de Gestión de RRHH - Cádiz Bar de Tapas**  
**Diciembre 2024**
