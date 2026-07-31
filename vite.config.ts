// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        manifest: {
          name: "PSI Games Live Crew Control",
          short_name: "PSI Crew",
          description:
            "Field production-operations console for the Mojo Phoenix crew at PSI Games 2026.",
          start_url: "/",
          display: "standalone",
          background_color: "#0E1013",
          theme_color: "#0E1013",
          icons: [
            { src: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/app-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }: { request: Request }) =>
                request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "psi-html" },
            },
            {
              urlPattern: ({ sameOrigin, request }: { sameOrigin: boolean; request: Request }) =>
                sameOrigin &&
                ["style", "script", "image", "font"].includes(request.destination),
              handler: "CacheFirst",
              options: {
                cacheName: "psi-assets",
                expiration: { maxEntries: 120 },
              },
            },
          ],
        },
      }),
    ],
  },
});
