# 🔧 FIX: baseAmount vs whiteAmount en Aguinaldo

## ❌ El Problema

El código estaba buscando `whiteAmount` (sueldo en depósito):

```typescript
const baseAmount = payroll.whiteAmount || 0;  // ❌ INCORRECTO
```

Pero los registros de 2026 tienen:
```json
{
  "base_amount": "1200000.00",
  "white_amount": "0.00",      ← Es CERO
  "informal_amount": "1696667.00"
}
```

**Resultado:** El cálculo tomaba `baseAmount = 0` porque `whiteAmount = 0`, ignorando el sueldo base real que está en `base_amount = 1200000`.

---

## ✅ La Solución

Cambiar a usar `baseAmount` que contiene el sueldo base sin importar si se pagó en depósito o efectivo:

```typescript
const baseAmount = payroll.baseAmount || 0;  // ✅ CORRECTO
```

**Por qué funciona:**
- `baseAmount` se normaliza desde `base_amount` en la BD
- Es independiente de cómo se pague (depósito vs efectivo)
- Siempre contiene el sueldo base

---

## 🔍 Explicación de Campos

En la BD existen 3 campos relacionados:

| Campo BD | Normalizado | Significado |
|----------|-------------|-------------|
| `base_amount` | `baseAmount` | Sueldo base (SIEMPRE USAR ESTE) |
| `white_amount` | `whiteAmount` | Porción pagada en depósito |
| `informal_amount` | `informalAmount` | Porción pagada en efectivo |

**Relación:**
```
baseAmount (sueldo base) ≈ whiteAmount + informalAmount
```

---

## 🧮 Ejemplo Real (TABLAR - 2026-06)

### Registro en BD:
```json
{
  "base_amount": "1340000.00",
  "white_amount": "0.00",
  "informal_amount": "2104667.00"
}
```

### ANTES (❌ INCORRECTO):
```typescript
const baseAmount = payroll.whiteAmount || 0;  // = 0
const holidayBonusAmount = 0;
const overtimeAmount = 0;

const adjustedSalary = 0 + 0 + 0 = 0
```

**Resultado:** Aguinaldo = 0 (incorrecto)

### DESPUÉS (✅ CORRECTO):
```typescript
const baseAmount = payroll.baseAmount || 0;  // = 1340000
const holidayBonusAmount = 0;
const overtimeAmount = 0;

const adjustedSalary = 1340000 + 0 + 0 = 1340000
```

**Resultado:** Aguinaldo = (1340000 / 12) × 6 = $670.000 (correcto)

---

## 📊 Impacto en Cálculos

Todos los empleados con registros de 2026 ahora usarán el `baseAmount` correcto:

```
Aguinaldo = (baseAmount + holidayBonus + overtimeAmount / 12) × 6
```

Si hay feriados registrados (como April/Mayo con $89.333):
```
Mejor Sueldo = 1340000 + 89333 + 0 = 1429333
Aguinaldo = (1429333 / 12) × 6 = $714.666,50
```

---

## 🔐 Cambios en Código

**Archivo:** `src/utils/aguinaldo.ts`

**Cambio:**
```diff
- const baseAmount = payroll.whiteAmount || 0;
+ const baseAmount = payroll.baseAmount || 0;
```

**Contexto:**
- Línea ~189
- Dentro de `salaryCalculations.map((payroll) => {...})`
- Afecta solo el cálculo de mejor sueldo para aguinaldo

---

## ✅ Verificación

Abre **Reportes → Calculadora de Aguinaldos → Semestre 1-2026**

Verifica TABLAR:
- **Antes:** Mostraba "sueldo base sin registros en semestre"
- **Después:** Debe mostrar $1.340.000 (o mayor si hay feriados/horas extra)
- **Aguinaldo:** Debe ser ~$670.000 (o mayor si hay feriados)

Otros empleados:
- **Antes:** Todos mostraban "sueldo base" porque whiteAmount = 0
- **Después:** Deben mostrar baseAmount real + feriados + horas extras

---

## 📝 Nota sobre Normalización

El normalizer `normalizePayrollRecord.ts` ya mapea correctamente:
```typescript
const baseAmountSource =
  toOptionalNumber(readField(record, "base_amount", "baseAmount")) ?? ...;

const resolvedBaseAmount =
  baseAmountSource !== undefined ? baseAmountSource : ...;

// En el return:
baseAmount: resolvedBaseAmount,  // ← Esta es la que debemos usar
```

El problema era que el código de aguinaldo no estaba usando este campo normalizado.
