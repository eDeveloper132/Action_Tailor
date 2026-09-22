/**
 * Open Redirect Protection Utility
 * Ensures redirect targets are relative, internal application URLs
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback = '/index.html'): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return fallback;
  }

  // Reject protocol-relative URLs (//example.com), schemes (http:, javascript:, data:), or Windows drive paths
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('\\\\') ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return fallback;
  }

  // Must begin with a single slash
  if (!trimmed.startsWith('/') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  return trimmed;
}

export default getSafeRedirectUrl;

