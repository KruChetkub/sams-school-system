/**
 * Security Utility: Sanitizes URLs for DOM sinks to prevent XSS (CWE-79 / CWE-116)
 * Specifically validates image and asset URLs against trusted protocols (http, https, blob, data:image/).
 */
export function sanitizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs must strictly be safe images
  if (trimmed.startsWith('data:')) {
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
      return trimmed;
    }
    return '';
  }

  // 2. Blob URLs (for object previews)
  if (trimmed.startsWith('blob:')) {
    try {
      const blobUrl = new URL(trimmed);
      if (blobUrl.protocol === 'blob:') {
        return trimmed;
      }
    } catch {
      return '';
    }
  }

  // 3. Absolute & Relative Web URLs
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(trimmed, origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
      return trimmed;
    }
  }

  return '';
}
