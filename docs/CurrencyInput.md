# Componente CurrencyInput

## Descripción

Componente de entrada especializado para valores de moneda argentina (ARS) que:

- ✅ Elimina las flechas de incremento/decremento
- ✅ Formatea automáticamente con símbolo peso ($)
- ✅ Usa puntos para miles y comas para decimales
- ✅ Formato de moneda argentina estándar

## Uso Básico

```tsx
import { CurrencyInput } from "@/components/ui/currency-input";

// Uso simple
<CurrencyInput
  placeholder="$ 0"
  value={amount}
  onChange={(value) => setAmount(value)}
/>;
```

## Props

| Prop          | Tipo                      | Descripción                     |
| ------------- | ------------------------- | ------------------------------- |
| `value`       | `string \| number`        | Valor actual del campo          |
| `onChange`    | `(value: string) => void` | Callback cuando cambia el valor |
| `placeholder` | `string`                  | Texto placeholder (ej: "$ 0")   |
| `disabled`    | `boolean`                 | Si el campo está deshabilitado  |
| `className`   | `string`                  | Clases CSS adicionales          |
| `id`          | `string`                  | ID del elemento                 |
| `name`        | `string`                  | Nombre del campo                |
| `required`    | `boolean`                 | Si el campo es requerido        |

## Ejemplos de Uso

### En formularios de empleados

```tsx
<div className="space-y-2">
  <Label htmlFor="sueldoBase">Sueldo Base</Label>
  <CurrencyInput
    id="sueldoBase"
    placeholder="$ 0"
    value={employee.sueldoBase}
    onChange={(value) =>
      setEmployee({
        ...employee,
        sueldoBase: value,
      })
    }
  />
</div>
```

### En formularios de liquidaciones

```tsx
<div className="space-y-2">
  <Label htmlFor="bonusAmount">Bono Libre</Label>
  <CurrencyInput
    id="bonusAmount"
    placeholder="$ 0"
    value={bonusAmount}
    onChange={(value) => setBonusAmount(value)}
    disabled={isReadOnly}
  />
</div>
```

## Características

### Formateo Automático

- **Entrada**: Usuario escribe "50000"
- **Visualización**: Se muestra como "$ 50.000"
- **Salida**: El onChange recibe "50000" como string

### Manejo de Focus

- **Al hacer focus**: Selecciona todo el texto para fácil edición
- **Al perder focus**: Reformatea con símbolo de moneda

### Validación

- Solo acepta números, comas y puntos
- Convierte comas a puntos para parsing
- Maneja valores vacíos correctamente

## Migración desde Input type="number"

### Antes

```tsx
<Input
  type="number"
  placeholder="0"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
/>
```

### Después

```tsx
<CurrencyInput
  placeholder="$ 0"
  value={amount}
  onChange={(value) => setAmount(value)}
/>
```

## CSS Global

Se agregó CSS global para eliminar flechas de cualquier input número restante:

```css
/* En src/index.css */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
```

## Ubicaciones Actualizadas

Los siguientes formularios han sido actualizados para usar CurrencyInput:

### Página de Empleados (`src/pages/Employees.tsx`)

- ✅ Formulario crear empleado: sueldo base, presentismo
- ✅ Formulario editar empleado: sueldo base, presentismo

### Página de Liquidaciones (`src/pages/Payroll.tsx`)

- ✅ Formulario liquidación: bono libre, adelantos, descuentos, sueldo depósito

### Campos NO cambiados (no son moneda)

- Días trabajados (cantidad)
- Días feriados (cantidad)
- Horas extra (tiempo)

## Formato de Salida

El componente siempre devuelve el valor como string numérico (sin formato) para facilitar cálculos:

```tsx
// El usuario ve: $ 123.456,78
// onChange recibe: "123456.78"
// Para usar en cálculos: parseFloat(value)
```

## Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Móviles (inputMode="decimal")
- ✅ Accesibilidad (aria-labels, keyboard navigation)
- ✅ Funciona con formularios controlados y no controlados
