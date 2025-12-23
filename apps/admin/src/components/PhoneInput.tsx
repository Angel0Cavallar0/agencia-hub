import { Input } from "@/components/ui/input";
import { formatPhoneDisplay, formatPhoneStorage } from "@/lib/phoneUtils";
import { useState, useEffect } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput = ({ value, onChange, placeholder, className, disabled }: PhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    setDisplayValue(formatPhoneDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneDisplay(inputValue);
    setDisplayValue(formatted);
    
    // Envia para o onChange o valor formatado para storage
    onChange(formatPhoneStorage(inputValue));
  };

  return (
    <Input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder || "+55 (XX) XXXXX-XXXX"}
      className={className}
      disabled={disabled}
    />
  );
};
