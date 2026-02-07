import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export interface CountryOption {
  code: string;
  name: string;
  ddi: string;
  flag: string;
  maxLength: number;
}

const countries: CountryOption[] = [
  { code: 'BR', name: 'Brasil', ddi: '55', flag: '🇧🇷', maxLength: 11 },
  { code: 'PT', name: 'Portugal', ddi: '351', flag: '🇵🇹', maxLength: 9 },
  { code: 'US', name: 'Estados Unidos', ddi: '1', flag: '🇺🇸', maxLength: 10 },
  { code: 'ES', name: 'España', ddi: '34', flag: '🇪🇸', maxLength: 9 },
  { code: 'MX', name: 'México', ddi: '52', flag: '🇲🇽', maxLength: 10 },
  { code: 'AR', name: 'Argentina', ddi: '54', flag: '🇦🇷', maxLength: 10 },
  { code: 'CO', name: 'Colombia', ddi: '57', flag: '🇨🇴', maxLength: 10 },
  { code: 'CL', name: 'Chile', ddi: '56', flag: '🇨🇱', maxLength: 9 },
  { code: 'PE', name: 'Perú', ddi: '51', flag: '🇵🇪', maxLength: 9 },
  { code: 'UY', name: 'Uruguay', ddi: '598', flag: '🇺🇾', maxLength: 8 },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
}

export const PhoneInput = ({
  value,
  onChange,
  required = false,
  id = 'phone-input',
  'aria-label': ariaLabel,
}: PhoneInputProps) => {
  const { t } = useTranslation();
  
  // Parse existing value to extract country and local number
  const parseValue = (val: string): { countryCode: string; localNumber: string } => {
    if (!val) return { countryCode: 'BR', localNumber: '' };
    
    // Remove any non-digit characters
    const cleanNumber = val.replace(/\D/g, '');
    
    // Try to match against known DDIs (longest first)
    const sortedCountries = [...countries].sort((a, b) => b.ddi.length - a.ddi.length);
    
    for (const country of sortedCountries) {
      if (cleanNumber.startsWith(country.ddi)) {
        return {
          countryCode: country.code,
          localNumber: cleanNumber.slice(country.ddi.length),
        };
      }
    }
    
    // Default to Brazil if no DDI found
    return { countryCode: 'BR', localNumber: cleanNumber };
  };
  
  const parsed = parseValue(value);
  const [selectedCountry, setSelectedCountry] = useState<string>(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState<string>(parsed.localNumber);
  
  const currentCountry = countries.find(c => c.code === selectedCountry) || countries[0];
  
  // Update parent when country or number changes
  useEffect(() => {
    if (localNumber) {
      const fullNumber = `${currentCountry.ddi}${localNumber}`;
      onChange(fullNumber);
    } else {
      onChange('');
    }
  }, [selectedCountry, localNumber, currentCountry.ddi, onChange]);
  
  // Sync from parent value changes
  useEffect(() => {
    const parsed = parseValue(value);
    if (parsed.countryCode !== selectedCountry || parsed.localNumber !== localNumber) {
      setSelectedCountry(parsed.countryCode);
      setLocalNumber(parsed.localNumber);
    }
  }, [value]);
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '');
    // Limit to country's max length
    const limited = digits.slice(0, currentCountry.maxLength);
    setLocalNumber(limited);
  };
  
  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    // Reset local number when country changes (different max lengths)
    const newCountry = countries.find(c => c.code === code);
    if (newCountry && localNumber.length > newCountry.maxLength) {
      setLocalNumber(localNumber.slice(0, newCountry.maxLength));
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={selectedCountry} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[100px] shrink-0">
          <SelectValue>
            <span className="flex items-center gap-1">
              <span>{currentCountry.flag}</span>
              <span className="text-xs text-muted-foreground">+{currentCountry.ddi}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-xs text-muted-foreground">+{country.ddi}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder={t('login.whatsappPlaceholder', 'Seu número')}
        value={localNumber}
        onChange={handleNumberChange}
        required={required}
        aria-label={ariaLabel || t('login.whatsappLabel')}
        className="flex-1"
        maxLength={currentCountry.maxLength}
      />
    </div>
  );
};
