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
      if (!str) return 0;

      // Remover símbolo de moneda y espacios
      let cleaned = str.replace(/[$\s]/g, "");

      // Si está vacío después de limpiar, retornar 0
      if (!cleaned) return 0;

      // Manejar formato argentino: la última coma es decimal, los puntos son miles
      const lastCommaIndex = cleaned.lastIndexOf(",");

      if (lastCommaIndex !== -1) {
        // Hay coma, asumir que es decimal
        const integerPart = cleaned
          .substring(0, lastCommaIndex)
          .replace(/\./g, ""); // Remover puntos de miles
        const decimalPart = cleaned.substring(lastCommaIndex + 1);

        // Solo aceptar hasta 2 dígitos decimales
        const limitedDecimals = decimalPart.slice(0, 2);

        cleaned = integerPart + "." + limitedDecimals;
      } else {
        // Sin coma, los puntos podrían ser miles o decimal
        const parts = cleaned.split(".");
        if (
          parts.length === 2 &&
          parts[1].length <= 2 &&
          parts[0].length <= 3
        ) {
          // Probablemente decimal (ej: 123.45)
          cleaned = cleaned;
        } else {
          // Separadores de miles, remover puntos
          cleaned = cleaned.replace(/\./g, "");
        }
      }

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

      // Permitir escritura de números, puntos y comas sin procesar inmediatamente
      // Solo formatear cuando sea un valor válido completo
      setDisplayValue(inputValue);

      // Parsear el valor ingresado solo si parece completo
      const numericValue = parseValue(inputValue);

      // Debug logging
      console.log("CurrencyInput change:", {
        input: inputValue,
        parsed: numericValue,
      });

      // Enviar el valor numérico como string al parent
      onChange?.(numericValue.toString());
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Al hacer focus, seleccionar todo el texto para facilitar edición
      e.target.select();
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Al perder focus, reformatear con moneda
      const inputValue = e.target.value;
      const numValue = parseValue(inputValue);

      console.log("CurrencyInput blur:", {
        input: inputValue,
        parsed: numValue,
        formatted: numValue > 0 ? formatCurrency(numValue) : "",
      });

      if (numValue === 0 && !inputValue) {
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
