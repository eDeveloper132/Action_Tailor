/**
 * Action Tailor - Customer Frontend API Client
 * Type-safe fetch wrapper with JWT header injection and cookie credentials
 */

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !window.location.pathname.includes('signin.html') && !window.location.pathname.includes('signup.html')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin.html';
      }
      throw new Error(data.message || data.error || 'Network request failed');
    }

    return data;
  } catch (error) {
    console.error(`[Customer API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Global attachment for compatibility with existing inline calls
(window as any).ActionTailor = {
  apiFetch,
  version: '1.0.0',
};

export default apiFetch;

