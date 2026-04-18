/**
 * Formatadores de células reutilizáveis para o DataTable universal.
 */

export type DataTableFormat = 'date' | 'datetime' | 'currency' | 'percent' | 'number' | 'text';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numberFmt = new Intl.NumberFormat('pt-BR');

export function formatValue(value: unknown, format?: DataTableFormat): string {
  if (value === null || value === undefined || value === '') return '—';
  try {
    switch (format) {
      case 'date': {
        const d = new Date(value as string);
        return isNaN(d.getTime()) ? String(value) : dateFmt.format(d);
      }
      case 'datetime': {
        const d = new Date(value as string);
        return isNaN(d.getTime()) ? String(value) : dateTimeFmt.format(d);
      }
      case 'currency':
        return currencyFmt.format(Number(value) || 0);
      case 'percent':
        return `${(Number(value) || 0).toFixed(1)}%`;
      case 'number':
        return numberFmt.format(Number(value) || 0);
      default:
        return String(value);
    }
  } catch {
    return String(value);
  }
}

/**
 * Converte rows + columns em CSV (escapando aspas e quebras de linha).
 */
export function rowsToCsv<T>(
  rows: T[],
  columns: { key: keyof T | string; label: string; format?: DataTableFormat; csvValue?: (row: T) => string | number | null | undefined }[],
): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map(c => escape(c.label)).join(',');
  const body = rows.map(r =>
    columns.map(c => {
      const raw = c.csvValue ? c.csvValue(r) : (r as any)[c.key];
      return escape(formatValue(raw, c.format));
    }).join(',')
  ).join('\n');
  return `${header}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
