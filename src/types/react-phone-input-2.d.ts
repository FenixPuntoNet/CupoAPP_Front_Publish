declare module 'react-phone-input-2' {
  import * as React from 'react';

  interface PhoneInputProps {
    country: string;
    value: string;
    onChange: (value: string, data: any, event: any, formattedValue: string) => void;
    inputStyle?: React.CSSProperties;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    specialLabel?: string | null;
  }

  const PhoneInput: React.FC<PhoneInputProps>;

  export default PhoneInput;
}