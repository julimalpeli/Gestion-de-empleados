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
      // Remover símbolo de moneda y espacios
      let cleaned = str.replace(/[$\s]/g, "");

      // Si está vacío, retornar 0
      if (!cleaned) return 0;

      // Manejar diferentes formatos de entrada
      // Formato argentino: 123.456,78 (puntos = miles, coma = decimales)
      // También permitir: 123456 o 123456.78 (formato de entrada directa)

      const hasComma = cleaned.includes(",");
      const hasDot = cleaned.includes(".");

      if (hasComma) {
        // Formato argentino con coma decimal
        const parts = cleaned.split(",");
        if (parts.length === 2) {
          const integerPart = parts[0].replace(/\./g, ""); // Remover separadores de miles
          const decimalPart = parts[1].replace(/\./g, ""); // Solo conservar dígitos decimales
          cleaned = integerPart + "." + decimalPart;
        } else {
          // Múltiples comas, usar solo números
          cleaned = cleaned.replace(/[^0-9]/g, "");
        }
      } else if (hasDot) {
        // Podría ser separador de miles o decimal
        const parts = cleaned.split(".");
        if (parts.length === 2 && parts[1].length <= 2) {
          // Probablemente decimal (ej: 123.45)
          cleaned = cleaned;
        } else {
          // Probablemente separadores de miles (ej: 123.456.789)
          cleaned = cleaned.replace(/\./g, "");
        }
      }
      // Si no hay comas ni puntos, usar tal como está

      const parsed = parseFloat(cleaned);
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

      // Debug logging para valores grandes
      if (numericValue > 10000) {
        console.log("CurrencyInput - Large value:", {
          input: inputValue,
          parsed: numericValue,
          formatted: formatCurrency(numericValue),
        });
      }

      // Formatear para display
      const formatted = formatCurrency(numericValue);
      setDisplayValue(formatted);

      // Enviar el valor numérico como string al parent
      onChange?.(numericValue.toString());
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Al hacer focus, seleccionar todo el texto para facilitar edición
      e.target.select();
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
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
