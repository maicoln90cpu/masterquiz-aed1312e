/**
 * IP Address Session Cache
 * Caches IP address in sessionStorage to avoid repeated API calls
 */

const IP_CACHE_KEY = 'mq_cached_ip';
const IP_CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface CachedIP {
  ip: string;
  timestamp: number;
}

/**
 * Get cached IP address from sessionStorage
 * Returns null if not cached or expired
 */
export const getCachedIP = (): string | null => {
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (!cached) return null;

    const data: CachedIP = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > IP_CACHE_TIMEOUT;

    if (isExpired) {
      sessionStorage.removeItem(IP_CACHE_KEY);
      return null;
    }

    return data.ip;
  } catch {
    return null;
  }
};

/**
 * Cache IP address in sessionStorage
 */
export const setCachedIP = (ip: string): void => {
  try {
    const data: CachedIP = {
      ip,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage might be full or disabled
  }
};

/**
 * Fetch IP address with session caching
 * Uses cached value if available, otherwise fetches from API
 */
export const fetchIPWithCache = async (timeoutMs = 3000): Promise<string | null> => {
  // Check cache first
  const cached = getCachedIP();
  if (cached) {
    return cached;
  }

  // Fetch from API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const ip = data.ip;

    // Cache the result
    if (ip) {
      setCachedIP(ip);
    }

    return ip;
  } catch {
    // Timeout or network error
    return null;
  }
};
