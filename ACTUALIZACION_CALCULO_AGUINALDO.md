# ✅ ACTUALIZACIÓN: Cálculo de Aguinaldo Correcto

## 🎯 Cambios Implementados

### ✨ Fórmula Corregida

**ANTES (INCORRECTO):**
```typescript
const totalPaid = depositoAmount + efectivoAmount;  // Incluía TODOS los conceptos
const excludedConcepts = presentismoAmount + aguinaldoAmount;
const adjustedSalary = Math.max(totalPaid - excludedConcepts, 0);
```

**DESPUÉS (CORRECTO):**
```typescript
const baseAmount = payroll.whiteAmount || 0;           // ✅ Sueldo Base
const holidayBonusAmount = payroll.holidayBonus || 0; // ✅ Feriados
const overtimeAmount = payroll.overtimeAmount || 0;   // ✅ Horas Extras

const adjustedSalary = baseAmount + holidayBonusAmount + overtimeAmount;
```

## 📋 Lo que AHORA se incluye/excluye

### ✅ INCLUÍDOS en SAC:
1. **Sueldo Base** (`whiteAmount`)
2. **Bonificación por Feriados** (`holidayBonus`)
3. **Horas Extras** (`overtimeAmount`)

### ❌ EXCLUÍDOS de SAC:
1. **Antigüedad** (se maneja por separado en aumentos)
2. **Adicional Asistencia**
3. **Complemento de Servicio**
4. **Adicional Zonal**
5. **Presentismo** (no remunerativo)
6. **Bonificaciones generales**
7. **Aguinaldo anterior**

---

## 🔍 Ejemplo de Cálculo Correcto

### Scenario: Empleado en Mayo 2026

**Nómina registrada:**
- Sueldo Base: $492.394,50
- Feriados: $0
- Horas Extras: $0
- Antigüedad: $9.847,89 ❌ NO INCLUIR
- Adicional Asistencia: $49.239,45 ❌ NO INCLUIR
- Complemento de Servicio: $59.087,34 ❌ NO INCLUIR
- Adicional Zonal: $49.239,45 ❌ NO INCLUIR

**Mejor Sueldo para SAC:**
```
Base + Feriados + Horas Extras = 492.394,50 + 0 + 0 = $492.394,50
```

**Aguinaldo (6 meses completos):**
```
SAC = (492.394,50 / 12) × 6 = $246.197,25
```

**NO es:**
- ~~(659.808,63 / 12) × 6 = $329.904~~ ← Incluye adicionales (INCORRECTO)

---

## 🧮 Casos de Test

### Test 1: Empleado con horas extras

**Nómina:**
- Sueldo Base: $500.000
- Feriados: $50.000
- Horas Extras: $25.000
- Presentismo: $30.000 ← NO contar
- Antigüedad: $15.000 ← NO contar

**Mejor Sueldo:**
```
500.000 + 50.000 + 25.000 = $575.000
```

**SAC:**
```
(575.000 / 12) × 6 = $287.500
```

---

### Test 2: Empleado proporcional (AMPRIMO - entrada 01/02/2026)

**Semestre 1-2026:** 01/01 - 30/06

**Días trabajados:**
- 01/02 a 30/06 = ~149 días
- < 180 días → **PROPORCIONAL** ✅

**Mejor Sueldo en Feb-Jun:**
```
MAX(Feb, Mar, Abr, May, Jun) de (Base + Feriados + Horas Extras)
= Supongamos $500.000
```

**SAC Proporcional:**
```
(500.000 / 12) × (149 / 30)
= 41.666,67 × 4,97
= $207.083,33
```

---

### Test 3: Gutierrez (entrada 13/05/2025)

**Para Semestre 1-2026:** 01/01 - 30/06

**Antigüedad en semestre:**
- Desde 13/05/2025 hasta 30/06/2026 = ~414 días
- Para semestre 1-2026 específicamente: 01/01 a 30/06 = 181 días
- > 180 días → **COMPLETO** ✅

**Mejor Sueldo en Ene-Jun 2026:**
```
MAX(Ene, Feb, Mar, Abr, May, Jun) de (Base + Feriados + Horas Extras)
```

**SAC Completo:**
```
(Mejor Sueldo / 12) × 6
```

---

## 📊 Impacto de los Cambios

| Empleado | Antes (Incorrecto) | Después (Correcto) | Diferencia |
|----------|-------------------|------------------|-----------|
| PORRAS | $329.904 | $246.197 | -$83.707 (-25%) |
| TABLAR | $327.442 | Depende de payroll | ? |
| ROA | $264.473 | Depende de payroll | ? |
| CARCAMO | $325.557 | Depende de payroll | ? |
| GUTIERREZ | ~$224.240 | ~$246.197+ | +? |
| AMPRIMO | N/A | ~$200.000-250.000 (prop) | Nuevo |

**Los valores correctos dependen de los registros reales en el sistema de:**
- Base (`whiteAmount`)
- Feriados (`holidayBonus`)
- Horas Extras (`overtimeAmount`)

---

## 🔧 Validación en Consola

Cuando se calcula aguinaldo, en la consola verás:

```javascript
🔍 Aguinaldo debug para PORRAS, DAINA AYELEN:
{
  period: "2026-05",
  baseAmount: 492394.50,
  holidayBonusAmount: 0,
  overtimeAmount: 0,
  bestSalaryForAguinaldo: 492394.50,
  formula: "SOLO: sueldo base + feriados + horas extras",
  excluded: "antigüedad, presentismo, adicionales, bonificaciones"
}
```

Esto permite verificar que el cálculo es correcto.

---

## ✅ Checklist

- [x] Cambio de fórmula a: Base + Feriados + Horas Extras
- [x] Exclusión de antigüedad, presentismo, adicionales
- [x] Método de "máximo" (no promedio)
- [x] Fallback a sueldo base si no hay payrolls
- [x] Debug en consola para verificar
- [ ] Validar con datos reales de GUTIERREZ (entrada 13/05/2025)
- [ ] Validar con datos reales de AMPRIMO (entrada 01/02/2026)

---

## 📌 Próximos Pasos

1. **Verificar datos en sistema:**
   - Confirmar fechas de ingreso: GUTIERREZ (13/05/2025), AMPRIMO (01/02/2026)
   - Revisar payrolls de Jan-Jun 2026 para estos empleados

2. **Calcular aguinaldos reales:**
   - Usar Reportes → Calculadora de Aguinaldos
   - Seleccionar Semestre 1-2026 (Junio)
   - Verificar que los montos sean correctos

3. **Comparar con cálculo manual:**
   - Toma un empleado
   - Busca su mejor sueldo en el semestre (Base + Feriados + Horas Extras)
   - Aplica fórmula: (Mejor Sueldo / 12) × 6 (o × días/30 si proporcional)
   - Verifica que coincida con el sistema

4. **Auditoría de aguinaldos pagados:**
   - Si ya pagaste SAC en liquidaciones: ¿coinciden con esta fórmula?
   - Si no: documentar la diferencia y política anterior

---

## 🎓 Referencia Legal Argentina

El SAC (Sueldo Anual Complementario) se calcula según:
- **Ley 23.041** (crear el SAC)
- **Decreto 1.078/84** (reglamentar)
- **Convenciones colectivas** (pueden tener particularidades)

La fórmula estándar es:
```
SAC = (Mejor Remuneración / 12) × (Meses o Días según antigüedad)
```

Donde "mejor remuneración" generalmente significa sueldo ordinario sin conceptos extraordinarios.

En este caso, se confirmó que son:
- ✅ Sueldo base
- ✅ Feriados trabajados
- ✅ Horas extras ordinarias

Y excluye:
- ❌ Antigüedad (beneficio separado)
- ❌ Conceptos extraordinarios o adicionales
