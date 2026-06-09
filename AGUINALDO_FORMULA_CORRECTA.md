# 📋 Fórmula Correcta de Cálculo de Aguinaldo

## ✅ Reglas Confirmadas

### 1. Conceptos Incluibles (y NO incluibles)

**INCLUIR en el cálculo:**
- ✅ Sueldo Base (`whiteAmount`)
- ✅ Bonificación por Feriados (`holidayBonus`)
- ✅ Horas Extras (`overtimeAmount`)

**NO INCLUIR:**
- ❌ Antigüedad (se maneja por separado en aumentos)
- ❌ Adicional Asistencia
- ❌ Complemento de Servicio
- ❌ Adicional Zonal
- ❌ Presentismo
- ❌ Bonificaciones generales
- ❌ Aguinaldo anterior

### 2. Cálculo del "Mejor Sueldo"

**Método:** Tomar el **máximo** de los 3 conceptos incluibles durante el semestre

```
Mejor Sueldo = MAX(
  (Sueldo Base + Feriados + Horas Extras) de enero,
  (Sueldo Base + Feriados + Horas Extras) de febrero,
  ...
  (Sueldo Base + Feriados + Horas Extras) de junio
)
```

**NO es promedio, es el mes de mayor remuneración.**

### 3. Períodos de Cálculo

- **Semestre 1:** 01 Enero - 30 Junio (pago en Junio)
- **Semestre 2:** 01 Julio - 31 Diciembre (pago en Diciembre)

### 4. Fórmula de Cálculo Final

#### Empleado con antigüedad completa (6+ meses):
```
Aguinaldo = (Mejor Sueldo / 12) × 6
```

#### Empleado proporcional (< 6 meses):
```
Aguinaldo = (Mejor Sueldo / 12) × (Días Trabajados / 30)
```

**Umbral:** Se considera proporcional si tiene menos de 180 días de antigüedad en el semestre

---

## 🔍 Ejemplos Prácticos

### Ejemplo 1: Empleado con antigüedad completa

**Empleado:** PORRAS, DAINA AYELEN  
**Ingreso:** 01/08/2023  
**Período:** Semestre 1-2026 (Junio 2026)

**Cálculo:**
- Meses en semestre: 6/6 (Enero - Junio 2026) ✅ Completo
- Sueldo Base (mayo 2026): $492.394,50
- Feriados (mayo 2026): $0
- Horas Extras (mayo 2026): $0
- **Mejor Sueldo = $492.394,50**

```
Aguinaldo = (492.394,50 / 12) × 6
          = 41.032,88 × 6
          = $246.197,28
```

---

### Ejemplo 2: Empleado proporcional (nuevo)

**Empleado:** AMPRIMO  
**Ingreso:** 01/02/2026  
**Período:** Semestre 1-2026 (Junio 2026)

**Cálculo:**
- Días trabajados en semestre:
  - Febrero: 28 días (del 01 al 28)
  - Marzo a Junio: 31+30+31+30 = 122 días
  - **Total: ~150 días** (< 180 días) → PROPORCIONAL ✅

- **Mejor Sueldo:** Máximo de (Feb + Mar + Abr + May + Jun)

```
Aguinaldo = (Mejor Sueldo / 12) × (150 / 30)
          = (Mejor Sueldo / 12) × 5
```

---

### Ejemplo 3: Gutierrez (necesita datos reales)

**Empleado:** GUTIERREZ, JAVIER  
**Ingreso:** 13/05/2025 (NO 19/12/2025)  
**Período:** Semestre 1-2026 (Junio 2026)

**Cálculo:**
- Días trabajados desde ingreso hasta 30/06/2026:
  - Mayo 2025: ~18 días (del 13 al 31)
  - Junio a Dic 2025: 30+31+31+30+31+30+31 = 214 días
  - Enero a Junio 2026: 31+28+31+30+31+30 = 181 días
  - **Total: ~413 días** (> 180 días) → COMPLETO ✅

```
Aguinaldo = (Mejor Sueldo / 12) × 6
```

**Nota:** Para Gutierrez, el "mejor sueldo" se busca en los registros de Enero-Junio 2026, no en meses anteriores.

---

## 📊 Implementación en Código

### Cambios en `src/utils/aguinaldo.ts`

```typescript
// ✅ FÓRMULA CORRECTA
const baseAmount = payroll.whiteAmount || 0;              // Sueldo Base
const holidayBonusAmount = payroll.holidayBonus || 0;    // Feriados
const overtimeAmount = payroll.overtimeAmount || 0;      // Horas Extras

const adjustedSalary = baseAmount + holidayBonusAmount + overtimeAmount;
```

**Excluidas automáticamente:**
- Antigüedad (no está en estos 3 campos)
- Presentismo (campo separado)
- Adicionales (no capturados)

---

## 🧪 Validación

**Para verificar que funciona correctamente:**

1. Crear payroll para un empleado en mayo 2026:
   - Sueldo Base: $500.000
   - Feriados: $50.000
   - Horas Extras: $10.000
   - Presentismo: $25.000 (NO debe incluirse)
   - Antigüedad: $30.000 (NO debe incluirse)

2. Calcular aguinaldo para semestre 1-2026

3. Resultado esperado:
   ```
   Mejor Sueldo = $500.000 + $50.000 + $10.000 = $560.000
   Aguinaldo = (560.000 / 12) × 6 = $280.000
   ```

   **NO debe incluir los $25.000 de presentismo ni los $30.000 de antigüedad**

---

## ⚠️ Casos Especiales

### Empleado sin registros en el semestre

**Situación:** Empleado activo pero sin payroll en enero-junio 2026

**Acción:** Usar `sueldo_base` de la tabla `employees`

**Código:**
```typescript
if (relevantPayrolls.length === 0) {
  bestSalary = employee.sueldoBase || 0;
  bestSalaryPeriod = "Sueldo base (sin registros en semestre)";
}
```

---

## 🔄 Cambios de Período de Cálculo

**¿Qué sucede si:**

### Caso A: Empleado entra el 15/01/2026 (mitad del semestre 1)
- Días: ~166 días (del 15/01 al 30/06)
- < 180 días → **PROPORCIONAL**

### Caso B: Empleado entra el 13/05/2025 (varias meses antes)
- Para semestre 1-2026: tiene 181 días completos
- >= 180 días → **COMPLETO**

### Caso C: Empleado entra el 01/07/2025 (primer día semestre 2-2025)
- Para semestre 1-2026: tiene 181 días
- >= 180 días → **COMPLETO**

---

## 📋 Resumen

| Parámetro | Valor |
|-----------|-------|
| **Conceptos incluibles** | Base + Feriados + Horas Extras SOLAMENTE |
| **Método de mejor sueldo** | Máximo del semestre |
| **Proporcional si** | < 180 días en el semestre |
| **Período semestral** | Enero-Junio (1) y Julio-Diciembre (2) |
| **Fallback sin registros** | Usar `sueldoBase` del empleado |

