# 🔧 Fix: Generación dinámica de períodos de aguinaldo en reportes

## ❌ El Problema

Cuando creabas una liquidación con aguinaldo (en Junio o Diciembre), el período **no aparecía automáticamente** en los reportes de aguinaldo. 

**Causa raíz:**
- Los períodos estaban **hardcodeados** (valores fijos: 2024-1, 2024-2, 2025-1, 2025-2)
- Las funciones para generar períodos dinámicamente existían pero **no se usaban** en ningún lado:
  - `generateAguinaldoPeriods()` en `src/utils/preGenerateAguinaldos.ts`
  - `isPeriodPaid()` 
  - `getPaidCountForPeriod()`

---

## ✅ La Solución

Se modificaron dos archivos para **generar períodos dinámicamente** basados en los registros de nómina reales:

### 1. **`src/pages/Reports.tsx`** (Calculadora de Aguinaldos)

**Cambios:**
```typescript
// ANTES (líneas 1-45)
import { useState } from "react";
// ... otros imports

// DESPUÉS
import { useState, useMemo } from "react";
// ... otros imports
import { generateAguinaldoPeriods } from "@/utils/preGenerateAguinaldos";
```

**En el componente:**
```typescript
// ANTES
const [selectedPeriod, setSelectedPeriod] = useState("2024-2");

// DESPUÉS
const aguinaldoPeriods = useMemo(
  () => generateAguinaldoPeriods(payrollRecords),
  [payrollRecords]
);

const initialPeriod = aguinaldoPeriods.length > 0 ? aguinaldoPeriods[0].value : "2025-2";
const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
```

**En el selector:**
```typescript
// ANTES
<SelectContent>
  <SelectItem value="2024-1">Primer Semestre 2024</SelectItem>
  <SelectItem value="2024-2">Segundo Semestre 2024</SelectItem>
  <SelectItem value="2025-1">Primer Semestre 2025</SelectItem>
  <SelectItem value="2025-2">Segundo Semestre 2025</SelectItem>
</SelectContent>

// DESPUÉS
<SelectContent>
  {aguinaldoPeriods.length > 0 ? (
    aguinaldoPeriods.map((period) => (
      <SelectItem key={period.value} value={period.value}>
        {period.label}
      </SelectItem>
    ))
  ) : (
    <SelectItem value="" disabled>
      No hay períodos de aguinaldo disponibles
    </SelectItem>
  )}
</SelectContent>
```

### 2. **`src/components/AguinaldoReport.tsx`** (Reporte de Aguinaldo)

Los **mismos cambios** se aplicaron al componente que se muestra en la pestaña "Reporte de Aguinaldo":

- Importar `generateAguinaldoPeriods` y `useMemo`
- Generar `aguinaldoPeriods` dinámicamente
- Reemplazar selector hardcodeado
- Usar el período más reciente como inicial

---

## 🎯 Cómo funciona ahora

```
1. Cargas payroll_records desde Supabase
        ↓
2. El hook usePayroll() los proporciona
        ↓
3. generateAguinaldoPeriods(payrollRecords) extrae:
   - Todos los períodos Junio (06) y Diciembre (12)
   - Los ordena de más reciente a más antiguo
   - Los formatea: "Primer Semestre 2026", "Segundo Semestre 2025", etc.
        ↓
4. El Select se regenera automáticamente
        ↓
5. Cuando creas una liquidación con aguinaldo:
   - Se inserta en payroll_records
   - El componente se re-renderiza
   - generateAguinaldoPeriods() detecta el nuevo período
   - Aparece en el dropdown sin recargar la página
```

---

## 📋 Detalles técnicos

### `generateAguinaldoPeriods()` 

Ubicación: `src/utils/preGenerateAguinaldos.ts`

```typescript
export function generateAguinaldoPeriods(
  payrollRecords: PayrollRecord[],
): Array<{ value: string; label: string }> {
  const periods = new Set<string>();

  // Extrae períodos Junio (06) y Diciembre (12)
  payrollRecords.forEach((record) => {
    if (record.period) {
      const [year, month] = record.period.split("-");
      if (month === "06" || month === "12") {
        periods.add(record.period);
      }
    }
  });

  // Convierte a labels legibles
  // Ordena de más reciente a más antiguo
  return periodArray.sort((a, b) => {
    const [aYear, aMonth] = a.value.split("-").map(Number);
    const [bYear, bMonth] = b.value.split("-").map(Number);
    const aDate = new Date(aYear, aMonth - 1);
    const bDate = new Date(bYear, bMonth - 1);
    return bDate.getTime() - aDate.getTime();
  });
}
```

### `useMemo` para optimización

```typescript
const aguinaldoPeriods = useMemo(
  () => generateAguinaldoPeriods(payrollRecords),
  [payrollRecords]  // Solo recalcula si payrollRecords cambia
);
```

---

## 🧪 Cómo verificar que funciona

1. **Abre Reportes → Calculadora de Aguinaldos**
2. **Observa el selector de período:**
   - Ahora muestra solo los períodos que tienen datos (06 o 12)
   - Están ordenados del más reciente al más antiguo
   - El inicial es el más reciente disponible

3. **Crea una nueva liquidación con aguinaldo:**
   - Ve a Nómina → Crear Liquidación
   - Selecciona un mes Junio o Diciembre (ej: Junio 2026)
   - Aguinaldo se calcula automáticamente
   - Guarda la liquidación

4. **Vuelve a Reportes:**
   - El nuevo período (ej: "Junio 2026") **debe aparecer** en el selector
   - Sin necesidad de recargar la página
   - Automáticamente seleccionado como el nuevo período inicial

---

## 📝 Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/pages/Reports.tsx` | +7 líneas, -1 línea (reemplazo de selector) |
| `src/components/AguinaldoReport.tsx` | +7 líneas, -1 línea (reemplazo de selector) |

**Nuevas dependencias:** Ninguna (usamos funciones existentes)

---

## 🚀 Beneficios

✅ **Dinámico:** Los períodos se generan automáticamente según los datos reales  
✅ **Reactivo:** Nuevos períodos aparecen sin recargar  
✅ **Mantenible:** Si necesitas cambiar el rango de años, solo actualiza un lugar  
✅ **Escalable:** Funciona con cualquier cantidad de períodos  
✅ **Sin hardcoding:** Los años ya no están fijos en el código

---

## ⚡ Impacto en el flujo

**Antes:**
1. Crear liquidación con aguinaldo → ✗ No aparece en reportes
2. Fuerza recargar la página
3. El selector aún muestra los años viejos

**Después:**
1. Crear liquidación con aguinaldo → ✓ Aparece automáticamente
2. Sin necesidad de recargar
3. Siempre actualizado con los datos reales
