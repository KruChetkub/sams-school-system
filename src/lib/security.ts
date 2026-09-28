/**
 * Client-Side Hardening & Anti-Fingerprinting Shield
 * 1. Blocks DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
 * 2. Disables right-click context menu (Inspect Element)
 * 3. Scrubs library version signatures from window scope (React Router, Leaflet, core-js, React DevTools)
 * 4. Silences console output in production
 */

export function initClientSecurity() {
  if (typeof window === 'undefined') return;

  // --- 1. Scrub Global Version Signatures ---
  try {
    // Hide React Router version from window.__reactRouterVersion
    Object.defineProperty(window, '__reactRouterVersion', {
      get: () => undefined,
      set: () => {},
      configurable: true,
      enumerable: false,
    });
    delete (window as any).__reactRouterVersion;
    delete (window as any).__reactRouterData;
  } catch {}

  try {
    // Hide core-js version info from window.__core-js_shared__
    Object.defineProperty(window, '__core-js_shared__', {
      get: () => undefined,
      set: () => {},
      configurable: true,
      enumerable: false,
    });
    delete (window as any).__core_js_shared__;
  } catch {}

  try {
    // Strip Leaflet version string if Leaflet is attached to window
    const scrubL = (obj: any) => {
      if (obj && typeof obj === 'object') {
        try {
          delete obj.version;
          Object.defineProperty(obj, 'version', {
            get: () => undefined,
            set: () => {},
            configurable: true,
          });
        } catch {}
      }
    };

    let _L = (window as any).L;
    scrubL(_L);
    Object.defineProperty(window, 'L', {
      get: () => _L,
      set: (val) => {
        _L = val;
        scrubL(_L);
      },
      configurable: true,
    });
    scrubL((window as any).leaflet);
  } catch {}

  try {
    // Neutralize React DevTools Hook to prevent inspecting component trees & state
    if (typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      for (const [key, value] of Object.entries(hook)) {
        hook[key] = typeof value === 'function' ? () => {} : null;
      }
    }
  } catch {}

  // --- 2. Production Console Suppression ---
  if (import.meta.env.PROD) {
    try {
      const noop = () => {};
      window.console.log = noop;
      window.console.info = noop;
      window.console.debug = noop;
      window.console.dir = noop;
      window.console.table = noop;
      window.console.trace = noop;
    } catch {}
  }

  // --- 3. Block DevTools Shortcuts & Right-Click Context Menu ---
  if (import.meta.env.PROD) {
    // Disable Right-Click
    document.addEventListener(
      'contextmenu',
      (e) => {
        // Allow text selection in standard form inputs if needed, but prevent inspection menu
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
      },
      { capture: true }
    );

    // Disable Key Combinations for DevTools & Source Viewing
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        // F12 key
        if (e.key === 'F12' || e.keyCode === 123) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        const isCtrlOrMeta = e.ctrlKey || e.metaKey;

        // Ctrl+Shift+I / J / C (DevTools, Console, Element Picker)
        if (isCtrlOrMeta && e.shiftKey) {
          const key = e.key.toUpperCase();
          if (['I', 'J', 'C', 'K'].includes(key)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }

        // Ctrl+U (View Page Source)
        if (isCtrlOrMeta && (e.key === 'u' || e.key === 'U')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+S (Save Page)
        if (isCtrlOrMeta && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      },
      { capture: true }
    );
  }
}
