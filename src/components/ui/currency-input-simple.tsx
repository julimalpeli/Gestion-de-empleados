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

export const CurrencyInputSimple = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(
  (
    { value, onChange, placeholder = "$ 0", disabled, className, ...props },
    ref,
  ) => {
    const [localValue, setLocalValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Función simple para parsear entrada
    const parseInput = (input: string): number => {
      if (!input) return 0;

      // Permitir solo números, comas y puntos
      const cleaned = input.replace(/[^0-9,.]/g, "");

      // Manejar formato argentino: último separador como decimal
      let normalized = cleaned;

      // Si hay comas, la última es decimal
      const lastCommaIndex = cleaned.lastIndexOf(",");
      if (lastCommaIndex !== -1) {
        // Remover puntos antes de la última coma (son separadores de miles)
        const beforeComma = cleaned
          .substring(0, lastCommaIndex)
          .replace(/\./g, "");
        const afterComma = cleaned.substring(lastCommaIndex + 1);
        normalized = beforeComma + "." + afterComma;
      } else {
        // Sin comas, convertir puntos a decimal solo si es el formato correcto
        const parts = cleaned.split(".");
        if (parts.length === 2 && parts[1].length <= 2) {
          // Probablemente decimal
          normalized = cleaned;
        } else {
          // Separadores de miles, remover
          normalized = cleaned.replace(/\./g, "");
        }
      }

      return parseFloat(normalized) || 0;
    };

    // Formatear para mostrar
    const formatForDisplay = (num: number): string => {
      if (num === 0) return "";
      return formatCurrencyUtil(num);
    };

    // Sincronizar con prop value
    useEffect(() => {
      if (value !== undefined && !isFocused) {
        const numValue = typeof value === "string" ? parseInput(value) : value;
        setLocalValue(formatForDisplay(numValue));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setLocalValue(inputValue);

      // Parsear y enviar al parent
      const numericValue = parseInput(inputValue);
      onChange?.(numericValue.toString());

      console.log("Simple input:", {
        input: inputValue,
        parsed: numericValue,
      });
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Mostrar valor sin formato para edición
      if (localValue) {
        const num = parseInput(localValue);
        setLocalValue(num > 0 ? num.toString().replace(".", ",") : "");
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Formatear al perder focus
      const num = parseInput(localValue);
      setLocalValue(formatForDisplay(num));
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "text-right font-mono",
          "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          "[-moz-appearance:textfield]",
          className,
        )}
        {...props}
      />
    );
  },
);

CurrencyInputSimple.displayName = "CurrencyInputSimple";

export default CurrencyInputSimple;
