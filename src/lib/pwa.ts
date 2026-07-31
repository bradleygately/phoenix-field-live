/**
 * A stale cached page referencing hashed chunks from an older build fails with
 * "Importing a module script failed" and a blank screen. Recover by reloading once.
 */
export function registerChunkErrorRecovery(): void {
  if (typeof window === "undefined") return;

  const reloadOnce = () => {
    const key = "psi-chunk-reload";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnce();
  });
  window.addEventListener("error", (event) => {
    const message = String(event.message ?? "");
    if (
      message.includes("Importing a module script failed") ||
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("error loading dynamically imported module")
    ) {
      reloadOnce();
    }
  });
}

/** Offline app shell. Never registers in dev, iframes or Lovable preview. */
export function registerAppServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const blocked =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev") ||
    new URL(window.location.href).searchParams.get("sw") === "off";

  if (blocked) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        if (registration.active?.scriptURL.endsWith("/sw.js")) {
          void registration.unregister();
        }
      }
    });
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline shell is best-effort; the app still works online */
    });
  });
}