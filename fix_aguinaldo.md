# Fix para Problema de Aguinaldo Duplicado

## Problema

En la grilla de liquidaciones, el Total Neto está sumando incorrectamente el aguinaldo dos veces:

- Muestra $100,000 en lugar de $15,000
- El detalle de liquidación muestra el cálculo correcto ($15,000)

## Causa

En las líneas ~1285 y ~1717 del archivo `src/pages/Payroll.tsx`, en la columna "Total Neto" se está calculando:

```typescript
{
  formatCurrency(
    record.netTotal +
      (isAguinaldoPeriod(record.period) ? record.aguinaldo || 0 : 0),
  );
}
```

Pero `record.netTotal` YA incluye el aguinaldo, por lo que se está sumando dos veces.

## Solución

Cambiar ambas líneas a:

```typescript
{
  formatCurrency(record.netTotal);
}
```

## Ubicaciones a corregir:

1. **Tabla Período Actual** (línea ~1285)
2. **Tabla Historial** (línea ~1717)

En ambos casos, en la celda `<TableCell className="font-medium">` de la columna "Total Neto".

## Corrección aplicada

- ✅ Se debe mostrar solo `record.netTotal`
- ✅ Se mantiene el texto informativo "Incluye aguinaldo: $X" debajo del total
- ✅ El aguinaldo se muestra correctamente en su propia columna

## Resultado esperado

- Total Neto: $15,000 (correcto)
- Con nota: "Incluye aguinaldo: $15,000"
- Sin duplicación en el cálculo
