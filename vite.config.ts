import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const securityHeaders = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self)',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'self' 'unsafe-inline'; style-src-elem 'self'; font-src 'self' data:; img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.ipify.org https://router.project-osrm.org; frame-src 'self'; worker-src 'self' blob:; manifest-src 'self'; media-src 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self';",
}

const blockSuspiciousRequests = (req: any, res: any, next: any) => {
  if (req.url) {
    const rawUrl = req.url.split('?')[0].toLowerCase();

    // 1. Block Path Traversal (both Unix '/' and Windows '\') -> Return 400 Bad Request
    const isTraversal =
      req.url.includes('..') ||
      req.url.includes('%2e%2e') ||
      req.url.includes('%2E%2E') ||
      req.url.includes('\\') ||
      req.url.includes('%5c') ||
      req.url.includes('%5C') ||
      req.url.includes('\0') ||
      req.url.includes('%00') ||
      /etc\/passwd/i.test(req.url) ||
      /win\.ini/i.test(req.url) ||
      /[?&]select=[^&]*(?:%2f|\/|%5c|\\|\.\.)/i.test(req.url);

    if (isTraversal) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Bad Request', message: 'Invalid path sequence' }));
      return;
    }

    // 2. Block Hidden Files, Backups, and Scanner Probes with 404 (Avoid SPA Fallback False Positives)
    const isProbed404 =
      rawUrl.startsWith('/.') ||
      /^\/(?:api|rest|ftp|wp-admin|wp-includes|wp-content|cgi-bin)(?:\/|$)/i.test(rawUrl) ||
      /\.(?:env|bak|backup|old|orig|php|xml|sql|yml|yaml|conf|config|ini|tar|gz|zip|log|swp|git)$/i.test(rawUrl);

    if (isProbed404) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
      return;
    }
  }
  next();
};

const stripSensitiveHeadersPlugin = () => ({
  name: 'strip-sensitive-headers',
  configureServer(server: any) {
    server.middlewares.use(blockSuspiciousRequests);
    server.middlewares.use((_req: any, res: any, next: any) => {
      res.removeHeader('x-powered-by');
      const originalSetHeader = res.setHeader;
      res.setHeader = function (name: string, value: any) {
        if (name.toLowerCase() === 'etag' || name.toLowerCase() === 'x-powered-by') {
          return this;
        }
        return originalSetHeader.apply(this, [name, value]);
      };
      next();
    });
  },
  configurePreviewServer(server: any) {
    server.middlewares.use(blockSuspiciousRequests);
    server.middlewares.use((_req: any, res: any, next: any) => {
      res.removeHeader('x-powered-by');
      const originalSetHeader = res.setHeader;
      res.setHeader = function (name: string, value: any) {
        if (name.toLowerCase() === 'etag' || name.toLowerCase() === 'x-powered-by') {
          return this;
        }
        return originalSetHeader.apply(this, [name, value]);
      };
      next();
    });
  },
})

const createSupabaseProxy = () => ({
  target: 'https://nzyuuqfwzjadrrahmzbp.supabase.co',
  changeOrigin: true,
  secure: true,
  ws: true,
  rewrite: (path: string) => path.replace(/^\/supabase-api/, ''),
  configure: (proxy: any) => {
    proxy.on('proxyRes', (proxyRes: any) => {
      // 1. Remove CORS wildcard headers from upstream
      delete proxyRes.headers['access-control-allow-origin'];
      delete proxyRes.headers['access-control-allow-headers'];
      delete proxyRes.headers['access-control-allow-methods'];
      delete proxyRes.headers['access-control-max-age'];

      // 2. Remove Cloudflare & Supabase cookies and tracking headers
      // (Supabase REST API uses Bearer/apikey headers, never cookies)
      delete proxyRes.headers['set-cookie'];
      delete proxyRes.headers['server'];
      delete proxyRes.headers['cf-ray'];
      delete proxyRes.headers['cf-cache-status'];
      delete proxyRes.headers['sb-gateway-version'];
      delete proxyRes.headers['sb-project-ref'];
      delete proxyRes.headers['sb-request-id'];
      delete proxyRes.headers['x-envoy-attempt-count'];
      delete proxyRes.headers['x-envoy-upstream-service-time'];
      delete proxyRes.headers['alt-svc'];

      // 3. Remove Content-Location to prevent Path Traversal reflection alerts
      delete proxyRes.headers['content-location'];
    });
  },
})

const antiFingerprintPlugin = () => ({
  name: 'anti-fingerprint-shield',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    return html.replace(/id="vite-plugin-pwa:register-sw"/g, 'id="app-sw"');
  },
  generateBundle(_options: any, bundle: any) {
    for (const fileName of Object.keys(bundle)) {
      const file = bundle[fileName];
      if (file.type === 'chunk' && typeof file.code === 'string') {
        file.code = file.code
          .replace(/__reactRouterVersion=[`'"]7\.15\.1[`'"]/g, '__reactRouterVersion=void 0')
          .replace(/version:[`'"]3\.33\.0[`'"]/g, 'version:void 0')
          .replace(/core-js\/blob\/v3\.33\.0/g, 'core-js')
          .replace(/[`'"]1\.9\.4[`'"]/g, '""');
      }
    }
  },
  closeBundle() {
    try {
      const htmlPath = path.resolve(__dirname, 'dist/index.html');
      if (fs.existsSync(htmlPath)) {
        let content = fs.readFileSync(htmlPath, 'utf8');
        content = content.replace(/id="vite-plugin-pwa:register-sw"/g, 'id="app-sw"');
        fs.writeFileSync(htmlPath, content, 'utf8');
      }
    } catch {}
  },
})

// https://vite.dev/config/
export default defineConfig({
  oxc: {
    dropConsole: true,
    dropDebugger: true,
  },
  build: {
    sourcemap: false,
  },
  server: {
    headers: securityHeaders,
    proxy: {
      '/supabase-api': createSupabaseProxy(),
    },
  },
  preview: {
    host: true,
    port: 4173,
    headers: securityHeaders,
    proxy: {
      '/supabase-api': createSupabaseProxy(),
    },
  },
  plugins: [
    antiFingerprintPlugin(),
    stripSensitiveHeadersPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SAMS',
        short_name: 'SAMS',
        description: 'ระบบจัดการการเข้าเรียนของโรงเรียน',
        theme_color: '#0b3b84',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 10485760, // Increase limit to 10MB
      },
    }),
  ],
})
