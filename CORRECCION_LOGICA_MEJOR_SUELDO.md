# 🔧 CORRECCIÓN: Mejor Sueldo en Aguinaldo

## ❌ El Problema

El código estaba comparando el máximo calculado con `sueldoBase`:

```typescript
// ❌ INCORRECTO
const baseSalary = employee.sueldoBase || 0;

if (maxSalaryIndex >= 0 && maxHistoricalSalary > baseSalary) {
  bestSalary = maxHistoricalSalary;  // ← Solo si supera sueldoBase
} else {
  bestSalary = baseSalary;  // ← Si no supera, usa sueldoBase
}
```

**Resultado:** Si el máximo de payrolls (Base + Feriados + Horas Extras) es igual o menor que `sueldoBase`, ignoraba los datos reales de los payrolls y usaba el fallback.

### Ejemplo práctico (TABLAR):

**Abril 2026 en sistema:**
- Sueldo Base: $1.340.000
- Feriados: $89.333
- Horas Extras: $0
- **Total en payroll:** $1.429.333

**Configuración del empleado:**
- sueldoBase: $1.340.000

**Lógica anterior:**
```
maxHistoricalSalary = $1.429.333 (de abril)
baseSalary = $1.340.000

¿$1.429.333 > $1.340.000? SÍ ✅ → Usa $1.429.333
```

Pero si todos los meses tienen máximo $1.340.000 (sin feriados), entonces:
```
maxHistoricalSalary = $1.340.000
baseSalary = $1.340.000

¿$1.340.000 > $1.340.000? NO ❌ → Usa sueldoBase ($1.340.000)
```

Esto descarta correctamente los datos reales del payroll si son iguales o menores a sueldoBase, lo cual es incorrecto cuando hay feriados.

---

## ✅ La Solución

**AHORA (CORRECTO):**

```typescript
// ✅ CORRECTO
if (maxSalaryIndex >= 0) {
  // Si hay payrolls en el semestre, SIEMPRE usa el máximo
  bestSalary = maxHistoricalSalary;
  bestSalaryPeriod = relevantPayrolls[maxSalaryIndex].period;
} else {
  // Solo usa sueldoBase si NO hay payrolls
  bestSalary = employee.sueldoBase || 0;
  bestSalaryPeriod = "Sueldo base (sin registros en semestre)";
}
```

**Lógica:**
1. Si hay payrolls en el semestre → Usa el MÁXIMO (que es Base + Feriados + Horas Extras)
2. Si NO hay payrolls → Usa sueldoBase como fallback

No hay comparación innecesaria con sueldoBase.

---

## 🧮 Ejemplo Corregido: TABLAR - Semestre 1-2026 (Junio)

### Payrolls en enero-junio 2026:

| Mes | Sueldo Base | Feriados | Horas Extras | Total |
|-----|-------------|----------|--------------|-------|
| Enero | $1.340.000 | $0 | $0 | $1.340.000 |
| Febrero | $1.340.000 | $0 | $0 | $1.340.000 |
| Marzo | $1.340.000 | $0 | $0 | $1.340.000 |
| Abril | $1.340.000 | $89.333 | $0 | **$1.429.333** ← MÁXIMO |
| Mayo | $1.340.000 | $89.333 | $0 | **$1.429.333** ← MÁXIMO |
| Junio | $1.340.000 | $0 | $0 | $1.340.000 |

### Cálculo:

```
Mejor Sueldo = $1.429.333 (máximo de abril o mayo)
Período: abril 2026 (o mayo 2026, ambos tienen el máximo)

Aguinaldo = ($1.429.333 / 12) × 6
          = $119.111,08 × 6
          = $714.666,50
```

### Antes (INCORRECTO):
```
Sistema reportaba:
"Aguinaldo calculado por sueldo base ($1.340.000)"
```

### Ahora (CORRECTO):
```
Sistema reporta:
"Aguinaldo calculado por mejor sueldo abril 2026 ($1.429.333)"
```

---

## 🔍 Verificación en Reportes

En **Reportes → Calculadora de Aguinaldos → Semestre 1-2026**, verás:

**Para TABLAR:**
```
Mejor Sueldo: $1.429.333 (Abril 2026)
Días Trabajados: 181/181 (Completo)
Tipo: Aguinaldo completo
Monto: $714.666,50
```

**Lo que veriffica la corrección:**
- ✅ Usa el máximo ($1.429.333) NO el sueldo base
- ✅ Identifica el mes correcto (Abril)
- ✅ Incluye los feriados en el cálculo

---

## 📊 Impacto en otros empleados

### PORRAS (sin feriados en max):
- Enero-Junio: $492.394,50 (sin variación)
- Mejor Sueldo: $492.394,50
- **Sin cambio** (ya se usaba correctamente)

### GUTIERREZ (con/sin feriados):
- Depende de si tiene feriados registrados
- Si max es > sueldo base → Ahora se usa correctamente
- Si max es = sueldo base → Ahora se usa correctamente

### AMPRIMO (nuevo, entrada febrero):
- Si tiene feriados en algún mes → Ahora se incluyen
- Cálculo proporcional: (Mejor Sueldo / 12) × (días / 30)

---

## 💾 Cambio de Código

**Archivo:** `src/utils/aguinaldo.ts`

**Antes:**
```typescript
if (maxSalaryIndex >= 0 && maxHistoricalSalary > baseSalary) {
```

**Después:**
```typescript
if (maxSalaryIndex >= 0) {
```

**Impacto:**
- Solo 1 línea cambió
- Lógica ahora más simple y correcta
- Respeta datos reales de payrolls sin comparaciones innecesarias

---

## ✅ Casos Cubiertos

### Caso 1: Empleado con feriados en algunos meses
```
Enero: $1.000 + $0 = $1.000
Febrero: $1.000 + $100 = $1.100 ← MÁXIMO
...
Mejor Sueldo: $1.100 ✅ (incluye feriados)
```

### Caso 2: Empleado sin feriados
```
Enero-Junio: $1.000 + $0 = $1.000
Mejor Sueldo: $1.000 ✅ (sueldo base = máximo)
```

### Caso 3: Empleado con horas extras
```
Enero: $1.000 + $0 + $0 = $1.000
Febrero: $1.000 + $100 + $50 = $1.150 ← MÁXIMO
Mejor Sueldo: $1.150 ✅ (incluye feriados + horas extras)
```

### Caso 4: Sin payrolls en semestre
```
Payrolls: ninguno en ene-jun 2026
Mejor Sueldo: sueldoBase del empleado ✅ (fallback correcto)
```

---

## 🎯 Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| Lógica | Comparaba con sueldoBase | Usa máximo si hay payrolls |
| TABLAR con feriados | Reportaba "sueldo base" ❌ | Reporta máximo correcto ✅ |
| Payroll con datos | Podía ignorarlos ❌ | Siempre los usa ✅ |
| Fallback | Solo si < sueldoBase | Solo si NO hay payrolls ✅ |
| Código | Más complejo | Más simple ✅ |
