/**
 * Action Tailor - Global Client Scripts
 * Centralized helpers, API client, and utilities
 */

console.log('[Action Tailor] Global script initialized.');

/**
 * Universal fetch wrapper for Action Tailor API
 * @param {string} endpoint - API route path
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Network response was not ok');
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Attach utilities to global window object
window.ActionTailor = {
  apiFetch,
  version: '1.0.0',
};

