/**
 * Security Utility: Sanitizes URLs for DOM sinks to prevent XSS (CWE-79 / CWE-116)
 * Specifically validates image and asset URLs against trusted protocols.
 */
export function sanitizeImageUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();

  // Explicitly block harmful URI schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/')
  ) {
    return undefined;
  }

  // Allow trusted web URLs, local paths, object URLs, and base64 image data
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('blob:') ||
    lower.startsWith('data:image/') ||
    lower.startsWith('/') ||
    lower.startsWith('./')
  ) {
    return trimmed;
  }

  return undefined;
}
