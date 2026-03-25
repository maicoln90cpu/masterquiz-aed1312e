/**
 * Mapa centralizado de fontes disponíveis no sistema.
 * Usado em AppearanceConfigStep, BlockPropertiesPanel e QuizBlockPreview.
 */

export interface FontOption {
  value: string;
  label: string;
  family: string; // CSS font-family value
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'sans', label: 'Sans-serif (padrão)', family: 'ui-sans-serif, system-ui, sans-serif' },
  { value: 'serif', label: 'Serif (clássica)', family: 'Georgia, "Times New Roman", serif' },
  { value: 'mono', label: 'Monospace (técnica)', family: '"Courier New", Courier, monospace' },
  { value: 'poppins', label: 'Poppins', family: '"Poppins", sans-serif' },
  { value: 'inter', label: 'Inter', family: '"Inter", sans-serif' },
  { value: 'roboto', label: 'Roboto', family: '"Roboto", sans-serif' },
  { value: 'montserrat', label: 'Montserrat', family: '"Montserrat", sans-serif' },
  { value: 'lato', label: 'Lato', family: '"Lato", sans-serif' },
  { value: 'open-sans', label: 'Open Sans', family: '"Open Sans", sans-serif' },
  { value: 'playfair', label: 'Playfair Display', family: '"Playfair Display", serif' },
  { value: 'space-grotesk', label: 'Space Grotesk', family: '"Space Grotesk", sans-serif' },
];

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeno (14px)', px: '14px' },
  { value: 'medium', label: 'Médio (16px)', px: '16px' },
  { value: 'large', label: 'Grande (18px)', px: '18px' },
  { value: 'xl', label: 'Extra Grande (20px)', px: '20px' },
] as const;

export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centralizado' },
  { value: 'right', label: 'Direita' },
] as const;

/** Resolve font value to CSS font-family string */
export function resolveFontFamily(value?: string): string | undefined {
  if (!value || value === 'sans') return undefined;
  const found = FONT_OPTIONS.find(f => f.value === value);
  return found?.family;
}

/** Resolve font size value to CSS px string */
export function resolveFontSize(value?: string): string | undefined {
  if (!value || value === 'medium') return undefined;
  const found = FONT_SIZE_OPTIONS.find(f => f.value === value);
  return found?.px;
}
