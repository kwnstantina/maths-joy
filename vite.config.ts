import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      // Use v1 route convention for compatibility with existing routes
      ignoredRouteFiles: ["**/.*"],
    }),
    tsconfigPaths(),
  ],
  css: {
    postcss: "./postcss.config.cjs",
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    exclude: ["i18next-fs-backend"],
  },
  ssr: {
    noExternal: ["i18next-fs-backend"],
    target: "node",
  },
  build: {
    target: "esnext",
  },
});
