import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency as formatCurrencyUtil } from "@/lib/utils";

interface CurrencyInputProps {
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(
  (
    { value, onChange, placeholder = "0", disabled, className, ...props },
    ref,
  ) => {
    const [displayValue, setDisplayValue] = useState("");

    // Función para formatear número a moneda argentina
    const formatCurrency = (num: number): string => {
      if (isNaN(num)) return "";
      return formatCurrencyUtil(num);
    };

    // Función para limpiar el valor y obtener solo números
    const parseValue = (str: string): number => {
      // Remover todo excepto números, comas y puntos
      const cleaned = str.replace(/[^\d,.-]/g, "");

      // Reemplazar coma por punto para parsing
      const normalized = cleaned.replace(",", ".");

      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Actualizar display value cuando cambia el value prop
    useEffect(() => {
      if (value !== undefined) {
        const numValue = typeof value === "string" ? parseValue(value) : value;
        if (numValue === 0 && !value) {
          setDisplayValue("");
        } else {
          setDisplayValue(formatCurrency(numValue));
        }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Si está vacío, limpiar
      if (!inputValue) {
        setDisplayValue("");
        onChange?.("");
        return;
      }

      // Parsear el valor ingresado
      const numericValue = parseValue(inputValue);

      // Formatear para display
      const formatted = formatCurrency(numericValue);
      setDisplayValue(formatted);

      // Enviar el valor numérico como string al parent
      onChange?.(numericValue.toString());
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Al hacer focus, mostrar solo el número para facilitar edición
      const numValue = parseValue(displayValue);
      if (numValue > 0) {
        e.target.select();
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Al perder focus, reformatear con moneda
      const numValue = parseValue(e.target.value);
      if (numValue === 0) {
        setDisplayValue("");
      } else {
        setDisplayValue(formatCurrency(numValue));
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            // Eliminar spinners/flechas
            "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            "[-moz-appearance:textfield]",
            // Estilo personalizado
            "text-right font-mono",
            className,
          )}
          {...props}
        />
        <style jsx>{`
          /* Eliminar spinners en todos los navegadores */
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }

          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}</style>
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
