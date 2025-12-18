# Instrucciones de Rollback - Pago de Aguinaldo Dividido

## ⚠️ IMPORTANTE
Si esta funcionalidad no funciona como esperabas, puedes hacer rollback completo siguiendo estos pasos.

## Archivos de Backup

Los archivos originales están respaldados en:
```
/tmp/backup_aguinaldo_20241218/
```

Contiene:
- `Payroll.tsx` - Página de liquidaciones (original)
- `interfaces.ts` - Interfaces TypeScript (original)
- `use-payroll.tsx` - Hook de payroll (original)

## Opción 1: Rollback Manual (Recomendado)

### Paso 1: Restaurar archivos desde backup
```bash
cp /tmp/backup_aguinaldo_20241218/Payroll.tsx src/pages/Payroll.tsx
cp /tmp/backup_aguinaldo_20241218/interfaces.ts src/services/interfaces.ts
cp /tmp/backup_aguinaldo_20241218/use-payroll.tsx src/hooks/use-payroll.tsx
```

### Paso 2: Eliminar campos de la base de datos
Ejecutar en Supabase SQL Editor:
```sql
ALTER TABLE payroll_records 
DROP COLUMN IF EXISTS aguinaldo_pago_efectivo,
DROP COLUMN IF EXISTS aguinaldo_pago_deposito;

DROP INDEX IF EXISTS idx_payroll_aguinaldo_periods;
```

### Paso 3: Revertir el normalizador
```bash
# Editar manualmente src/hooks/normalizers/normalizePayrollRecord.ts
# Eliminar las líneas que contienen:
# - aguinaldoPagoEfectivo
# - aguinaldoPagoDeposito
```

### Paso 4: Eliminar archivos nuevos
```bash
rm database/add_aguinaldo_payment_split.sql
rm ROLLBACK_AGUINALDO_SPLIT.md
```

## Opción 2: Rollback por Git (Si hay repositorio)

Si el proyecto está en git:
```bash
git log --oneline  # Buscar el commit "checkpoint: before implementing aguinaldo payment split feature"
git revert <commit-hash>  # Revertir todos los cambios
```

## Verificación Post-Rollback

Después del rollback, verificar que:
1. ✅ La página de Liquidaciones carga sin errores
2. ✅ No aparecen campos de aguinaldo en el formulario
3. ✅ Los reportes funcionan correctamente
4. ✅ Se pueden crear liquidaciones normalmente

## Archivos Modificados (para referencia)

En caso de necesitar rollback selectivo:

### Interfaces y Types
- `src/services/interfaces.ts` - Agregó `aguinaldoPagoEfectivo` y `aguinaldoPagoDeposito`

### Normalización de datos
- `src/hooks/normalizers/normalizePayrollRecord.ts` - Agregó normalización de nuevos campos

### Hook de Payroll
- `src/hooks/use-payroll.tsx` - Agregó nuevos campos en create/update

### UI Principal
- `src/pages/Payroll.tsx`:
  - Estados nuevos (línea ~118-119)
  - Creación con nuevos campos (línea ~528-529)
  - Reset de formulario (línea ~551-552)
  - UI condicional (línea ~1293-1357)

### Migración de BD
- `database/add_aguinaldo_payment_split.sql` - Nueva migración

## Contacto

Si tienes problemas con el rollback, contacta al desarrollador que implementó esta funcionalidad.

---
**Fecha de implementación**: 18/12/2024
**Versión**: 1.0.0
