/**
 * @fileoverview dateUtils — Centralização de manipulação de datas (Onda 7 / Etapa 4).
 *
 * Por que existir:
 *  - Padronizar fuso (timeZone do navegador, configurável) e locale (pt-BR default).
 *  - Evitar `new Date(string)` espalhado pelo código, que tem comportamento
 *    inconsistente entre browsers (ex: Safari falha em "YYYY-MM-DD HH:mm:ss").
 *  - Tratar nulos/undefineds de forma segura (sempre retorna string previsível).
 *
 * Convenções:
 *  - Sempre que precisar exibir data/hora ao usuário → use os helpers daqui.
 *  - `now()` substitui `new Date()` em código de produção (testes podem mockar).
 *  - `parseISO` é tolerante: retorna null em entrada inválida em vez de Invalid Date.
 */

import { format as fnsFormat, parseISO as fnsParseISO, isValid } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

type SupportedLocale = "pt-BR" | "en-US" | "es";

const LOCALE_MAP = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es": es,
} as const;

const DEFAULT_LOCALE: SupportedLocale = "pt-BR";

/**
 * Retorna o "agora" como Date. Substitua `new Date()` por esta função em código
 * de produção — facilita mock em testes determinísticos.
 */
export function now(): Date {
  return new Date();
}

/**
 * Retorna timestamp ISO atual (UTC). Use para gravar em banco/logs.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Parse seguro de string ISO. Retorna null se inválido (não lança).
 */
export function parseISO(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const d = fnsParseISO(value);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Parse permissivo: aceita Date, ISO string ou número (epoch ms).
 */
export function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  return parseISO(value);
}

/**
 * Formatação genérica via padrões do date-fns.
 * Retorna fallback (default "—") se entrada for inválida.
 */
export function format(
  value: Date | string | number | null | undefined,
  pattern: string,
  options: { locale?: SupportedLocale; fallback?: string } = {}
): string {
  const date = toDate(value);
  if (!date) return options.fallback ?? "—";
  const locale = LOCALE_MAP[options.locale ?? DEFAULT_LOCALE];
  try {
    return fnsFormat(date, pattern, { locale });
  } catch {
    return options.fallback ?? "—";
  }
}

/** dd/MM/yyyy (padrão brasileiro). */
export function formatDate(value: Date | string | number | null | undefined, fallback = "—"): string {
  return format(value, "dd/MM/yyyy", { fallback });
}

/** dd/MM/yyyy HH:mm. */
export function formatDateTime(value: Date | string | number | null | undefined, fallback = "—"): string {
  return format(value, "dd/MM/yyyy HH:mm", { fallback });
}

/** HH:mm. */
export function formatTime(value: Date | string | number | null | undefined, fallback = "—"): string {
  return format(value, "HH:mm", { fallback });
}

/** Texto humanizado: "12 de abril de 2026". */
export function formatLong(value: Date | string | number | null | undefined, fallback = "—"): string {
  return format(value, "d 'de' MMMM 'de' yyyy", { fallback });
}

/** ISO date (YYYY-MM-DD) — útil para inputs <input type="date">. */
export function formatISODate(value: Date | string | number | null | undefined, fallback = ""): string {
  return format(value, "yyyy-MM-dd", { fallback });
}

/**
 * Diferença em dias entre duas datas (b - a). Retorna 0 se alguma for inválida.
 */
export function diffInDays(
  a: Date | string | number | null | undefined,
  b: Date | string | number | null | undefined
): number {
  const da = toDate(a);
  const db = toDate(b);
  if (!da || !db) return 0;
  const ms = db.getTime() - da.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * Tempo relativo simples em PT-BR ("há 3 dias", "em 2 horas").
 * Para casos complexos, use formatDistanceToNow do date-fns diretamente.
 */
export function relativeFromNow(value: Date | string | number | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const past = diffMs < 0;

  const minutes = Math.floor(absMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let txt: string;
  if (minutes < 1) txt = "agora";
  else if (minutes < 60) txt = `${minutes} min`;
  else if (hours < 24) txt = `${hours} h`;
  else if (days < 30) txt = `${days} dia${days === 1 ? "" : "s"}`;
  else txt = formatDate(date);

  if (txt === "agora") return txt;
  return past ? `há ${txt}` : `em ${txt}`;
}

/**
 * Verifica se uma data é válida (Date real e não Invalid Date).
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && isValid(value);
}