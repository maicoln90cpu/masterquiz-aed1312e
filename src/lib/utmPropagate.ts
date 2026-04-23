/**
 * Helpers para captura e propagação de parâmetros UTM ao longo da jornada.
 *
 * Fluxo:
 *  1. Landing (`/`) chama `captureUTMsToSession()` no carregamento — só grava
 *     em sessionStorage se `utm_source` estiver presente (não sobrescreve).
 *  2. CTAs da landing usam `appendUTMsToPath('/login')` para propagar a query
 *     string atual no link, garantindo redundância para casos de "abrir em
 *     nova aba" (que perderia o sessionStorage).
 *  3. `Login.tsx` lê primeiro da URL e cai para `readUTMsFromSession()`.
 */

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type UTMKey = (typeof UTM_KEYS)[number];
export type UTMRecord = Partial<Record<UTMKey, string>>;

const STORAGE_KEY = 'mq_utms';

/** Lê os 5 UTMs da query string atual. */
export function readUTMsFromURL(search: string = window.location.search): UTMRecord {
  const params = new URLSearchParams(search);
  const result: UTMRecord = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) result[key] = value;
  }
  return result;
}

/** Lê UTMs persistidos em sessionStorage. */
export function readUTMsFromSession(): UTMRecord {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const result: UTMRecord = {};
    for (const key of UTM_KEYS) {
      if (typeof parsed[key] === 'string' && parsed[key]) {
        result[key] = parsed[key];
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Captura UTMs da URL e persiste em sessionStorage.
 * Só grava se `utm_source` existir (regra: não sobrescrever com vazio).
 */
export function captureUTMsToSession(): void {
  try {
    const utms = readUTMsFromURL();
    if (!utms.utm_source) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
  } catch {
    /* sessionStorage indisponível (SSR / privacy mode) — fail-silent */
  }
}

/**
 * Anexa os UTMs da URL atual ao path informado, se houver `utm_source`.
 * Preserva query string já existente no path.
 */
export function appendUTMsToPath(path: string): string {
  const utms = readUTMsFromURL();
  if (!utms.utm_source) return path;

  const [base, existingQuery = ''] = path.split('?');
  const params = new URLSearchParams(existingQuery);
  for (const key of UTM_KEYS) {
    const value = utms[key];
    if (value && !params.has(key)) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Resolve UTMs com prioridade: URL atual > sessionStorage.
 * Usado pelo Login.tsx no momento do signUp.
 */
export function resolveUTMs(): UTMRecord {
  const fromURL = readUTMsFromURL();
  if (fromURL.utm_source) return fromURL;
  return readUTMsFromSession();
}