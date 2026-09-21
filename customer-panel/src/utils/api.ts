/**
 * Action Tailor - Customer Frontend API Client
 * High-performance fetch client with JWT injection, credentials, in-flight deduplication, and GET micro-caching
 */

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== 'undefined' && (window as any).ACTION_TAILOR_API_URL) ||
  (typeof window !== 'undefined' && localStorage.getItem('api_url')) ||
  (typeof window !== 'undefined' &&
   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
   window.location.port !== '5000'
    ? 'http://localhost:5000'
    : '');

// In-flight request deduplication map (prevents duplicate simultaneous calls to same endpoint)
const inFlightRequests = new Map<string, Promise<any>>();

// Short-lived in-memory cache for GET requests (TTL: 3000ms)
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const getCache = new Map<string, CacheEntry>();

export function clearApiCache(): void {
  getCache.clear();
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const isGet = method === 'GET';

  // If mutation, invalidate GET cache immediately
  if (!isGet) {
    getCache.clear();
  } else {
    // Check GET micro-cache
    const cached = getCache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return JSON.parse(JSON.stringify(cached.data));
    }

    // Check in-flight deduplication
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url)!;
    }
  }

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  const executeFetch = async (): Promise<any> => {
    try {
      const response = await fetch(url, config);

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (_jsonErr) {
          data = null;
        }
      } else {
        try {
          const rawText = await response.text();
          data = { message: rawText };
        } catch (_textErr) {
          data = null;
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('signin.html') && !window.location.pathname.includes('signup.html')) {
            window.location.href = '/signin.html';
            return { status: 'error', message: 'Authentication required' };
          }
        }
        const errorMsg =
          data?.message ||
          data?.error ||
          (response.status === 404
            ? typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
              ? 'Backend API not reachable (404). Please ensure the backend is running and VITE_API_URL is configured.'
              : 'Resource not found'
            : `Request failed with status ${response.status}`);
        throw new Error(errorMsg);
      }

      if (isGet && data) {
        getCache.set(url, {
          data,
          expiresAt: Date.now() + 3000, // 3-second micro-cache
        });
      }

      return data;
    } catch (error) {
      console.error(`[Customer API Error] ${endpoint}:`, error);
      throw error;
    } finally {
      if (isGet) {
        inFlightRequests.delete(url);
      }
    }
  };

  if (isGet) {
    const promise = executeFetch();
    inFlightRequests.set(url, promise);
    return promise;
  }

  return executeFetch();
}

/**
 * Lightweight, zero-dependency debounce utility
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 200): (...args: Parameters<T>) => void {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Lightweight throttle utility
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, ms = 300): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= ms) {
      lastTime = now;
      fn(...args);
    }
  };
}

// Global attachment for compatibility with existing inline calls
(window as any).ActionTailor = {
  apiFetch,
  clearApiCache,
  debounce,
  throttle,
  version: '1.0.0',
};

export default apiFetch;

