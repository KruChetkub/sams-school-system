import DOMPurify from 'dompurify';

/**
 * Security Utility: Sanitizes URLs for DOM sinks to prevent XSS (CWE-79 / CWE-116)
 * Uses DOMPurify and strict URI protocol validation conforming to CodeQL / OWASP standards.
 */
export function sanitizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = DOMPurify.sanitize(url.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  if (!cleanUrl) return '';

  // 1. Data URLs must strictly be safe images
  if (cleanUrl.startsWith('data:')) {
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(cleanUrl)) {
      return cleanUrl;
    }
    return '';
  }

  // 2. Blob URLs (for local file previews)
  if (cleanUrl.startsWith('blob:')) {
    try {
      const blobUrl = new URL(cleanUrl);
      if (blobUrl.protocol === 'blob:') {
        return cleanUrl;
      }
    } catch {
      return '';
    }
  }

  // 3. Absolute & Relative Web URLs
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(cleanUrl, origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./')) {
      return cleanUrl;
    }
  }

  return '';
}
