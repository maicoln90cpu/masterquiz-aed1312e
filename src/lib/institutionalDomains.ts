/**
 * Institutional email domain filter.
 * Loaded from `institutional_email_domains` table with 5min in-memory cache.
 * Falls back to a hardcoded list if the network query fails.
 */
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_DOMAINS = [
  "gov.br", "edu.br", "mil.br", "jus.br", "mp.br", "leg.br",
  "gov", "edu", "mil", "int", "ac.uk",
];

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { domains: string[]; expiresAt: number } | null = null;
let inflight: Promise<string[]> | null = null;

async function fetchDomains(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("institutional_email_domains")
      .select("domain")
      .eq("is_active", true);
    if (error) throw error;
    return (data || []).map((r) => r.domain.toLowerCase());
  } catch {
    return FALLBACK_DOMAINS;
  }
}

export async function getInstitutionalDomains(): Promise<string[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.domains;
  if (inflight) return inflight;
  inflight = fetchDomains().then((domains) => {
    cache = { domains, expiresAt: Date.now() + CACHE_TTL_MS };
    inflight = null;
    return domains;
  });
  return inflight;
}

/**
 * Returns true if the email belongs to an institutional/blocked domain.
 * Matches both exact domain (`gov.br`) and subdomain endings (`x.gov.br`).
 */
export async function isInstitutionalEmail(email: string): Promise<boolean> {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const host = email.slice(at + 1).toLowerCase().trim();
  if (!host) return false;
  const domains = await getInstitutionalDomains();
  return domains.some((d) => host === d || host.endsWith("." + d));
}

/** Synchronous variant using whatever is in cache (or fallback). Used in hot paths. */
export function isInstitutionalEmailSync(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const host = email.slice(at + 1).toLowerCase().trim();
  if (!host) return false;
  const domains = cache?.domains ?? FALLBACK_DOMAINS;
  return domains.some((d) => host === d || host.endsWith("." + d));
}

/** Pre-warm the cache. Safe to call on app boot. */
export function preloadInstitutionalDomains(): void {
  void getInstitutionalDomains();
}
