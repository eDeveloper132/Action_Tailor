/**
 * Action Tailor - ReDoS-Safe Regex Utility
 * Escapes special regular expression characters from user-controlled input
 */
export function escapeRegExp(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

