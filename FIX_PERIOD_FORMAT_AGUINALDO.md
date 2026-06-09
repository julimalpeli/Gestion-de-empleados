# 🔧 FIX: Period Format - Mes vs Semestre

## ❌ El Problema

El selector de períodos devolvía **formato de MES** (ej: "2026-06"), pero `calculateAguinaldo()` espera **formato de SEMESTRE** (ej: "2026-1").

**Resultado:**
```
selectedPeriod = "2026-06" (Junio)
↓
calculateAguinaldo(emp, "2026-06", ...)
↓
const [year, semester] = "2026-06".split("-")
semester = "06" (interpretado como número 6)
↓
currentSemester === 6 → Semestre 2 (Julio-Diciembre) ❌
↓
Busca payrolls en Julio-Diciembre, NO en Enero-Junio
↓
No encuentra registros de Enero-Mayo
↓
Muestra solo Junio o sueldo base
```

---

## ✅ La Solución

Convertir el período de **mes** a **semestre** antes de pasarlo a `calculateAguinaldo()`:

```typescript
// Helper function
const toSemesterPeriod = (monthPeriod: string): string => {
  const [year, month] = monthPeriod.split("-");
  const monthNum = parseInt(month, 10);
  const semester = monthNum <= 6 ? "1" : "2";
  return `${year}-${semester}`;
};

// Usar:
const semesterPeriod = toSemesterPeriod(selectedPeriod);
//   "2026-06"            →      "2026-1"
//   "2026-12"            →      "2026-2"

const aguinaldoResult = calculateAguinaldo(emp, semesterPeriod, payrollRecords);
```

---

## 📊 Ejemplo: TABLAR - Junio 2026

### ANTES (❌ INCORRECTO):
```
Selector: "Junio 2026"
Valor: "2026-06"
↓
calculateAguinaldo(emp, "2026-06", ...)
↓
Busca en semestre 2 (julio-diciembre)
↓
semesterStart: '1/7/2026' (Julio)
↓
Encuentra payrolls de 2025 (2025-07 a 2025-12)
↓
Mejor sueldo: $1.259.623 (de diciembre 2025) ❌
```

### DESPUÉS (✅ CORRECTO):
```
Selector: "Junio 2026"
Valor: "2026-06"
↓
toSemesterPeriod("2026-06") → "2026-1"
↓
calculateAguinaldo(emp, "2026-1", ...)
↓
Busca en semestre 1 (enero-junio)
↓
semesterStart: '1/1/2026' (Enero)
↓
Encuentra payrolls de 2026 (2026-01 a 2026-06)
↓
Mejor sueldo: $1.429.333 (de abril/mayo 2026) ✅
```

---

## 📝 Cambios en Código

### Archivo 1: `src/pages/Reports.tsx`

**Agregado antes de usar `selectedPeriod` en `calculateAguinaldo`:**

```typescript
// Convert monthly period (e.g., "2026-06") to semester period (e.g., "2026-1")
const toSemesterPeriod = (monthPeriod: string): string => {
  const [year, month] = monthPeriod.split("-");
  const monthNum = parseInt(month, 10);
  const semester = monthNum <= 6 ? "1" : "2";
  return `${year}-${semester}`;
};

const semesterPeriod = toSemesterPeriod(selectedPeriod);

const aguinaldoCalculations = activeEmployees.map((emp) => ({
  ...emp,
  aguinaldo: calculateAguinaldo(emp, semesterPeriod, payrollRecords),  // ← usa semesterPeriod
}));
```

**Cambio:**
```diff
- aguinaldo: calculateAguinaldo(emp, selectedPeriod, payrollRecords),
+ aguinaldo: calculateAguinaldo(emp, semesterPeriod, payrollRecords),
```

### Archivo 2: `src/components/AguinaldoReport.tsx`

**Mismo cambio, mismo lugar:**

```typescript
const semesterPeriod = toSemesterPeriod(selectedPeriod);

const reportData: AguinaldoReportRecord[] = employees
  .filter((emp) => emp.status === "active")
  .map((emp) => {
    const aguinaldoResult = calculateAguinaldo(emp, semesterPeriod, payrollRecords);  // ← usa semesterPeriod
```

---

## 🧮 Tabla de Conversiones

| Mes Selector | Valor Period | Semestre | semesterStart | semesterEnd |
|---|---|---|---|---|
| Junio | 2026-06 | 1 | 01/01/2026 | 30/06/2026 |
| Diciembre | 2026-12 | 2 | 01/07/2026 | 31/12/2026 |
| Enero | 2026-01 | 1 | 01/01/2026 | 30/06/2026 |
| Julio | 2026-07 | 2 | 01/07/2026 | 31/12/2026 |

---

## ✅ Verificación

Abre **Reportes → Calculadora de Aguinaldos → Junio 2026**

TABLAR debe mostrar:
- ✅ **Mejor Sueldo:** $1.429.333 (Abril 2026)
- ✅ **Período:** Abril 2026
- ✅ **Aguinaldo:** $714.666,50
- ✅ **Tipo:** Completo (181/181 días)

Otros empleados:
- ✅ Deben mostrar el máximo de enero-junio 2026
- ✅ NO deben mostrar "sueldo base sin registros"

---

## 🔍 Por qué pasó esto

1. `generateAguinaldoPeriods()` extrae períodos de `payroll_records` que tiene formato MES (2026-06)
2. El selector devuelve ese valor tal cual: "2026-06"
3. `calculateAguinaldo()` espera formato SEMESTRE: "2026-1"
4. Sin conversión, interpretaba 06 como semestre 6 en lugar de semestre 1

**La solución:** Convertir en el punto de uso, antes de pasarle a `calculateAguinaldo()`.

---

## 📌 Nota

Esta conversión es necesaria porque:
- **En la BD:** Los períodos se guardan como **mes** (YYYY-MM) en `payroll_records.period`
- **En el cálculo:** Se necesita **semestre** (YYYY-1 o YYYY-2) para agrupar enero-junio vs julio-diciembre

Por eso existe la conversión:
- Del lado de BD: mes (2026-06)
- Del lado de cálculo: semestre (2026-1)
