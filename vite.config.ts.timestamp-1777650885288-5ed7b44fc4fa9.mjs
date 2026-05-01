// vite.config.ts
import { vitePlugin as remix } from "file:///home/konstantina/repos/maths-joy/node_modules/@remix-run/dev/dist/index.js";
import { defineConfig } from "file:///home/konstantina/repos/maths-joy/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///home/konstantina/repos/maths-joy/node_modules/vite-tsconfig-paths/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true
      },
      // Use v1 route convention for compatibility with existing routes
      ignoredRouteFiles: ["**/.*"]
    }),
    tsconfigPaths()
  ],
  css: {
    postcss: "./postcss.config.cjs"
  },
  server: {
    port: 3e3
  },
  optimizeDeps: {
    exclude: ["i18next-fs-backend"]
  },
  ssr: {
    noExternal: ["i18next-fs-backend"],
    target: "node"
  },
  build: {
    target: "esnext"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9rb25zdGFudGluYS9yZXBvcy9tYXRocy1qb3lcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2tvbnN0YW50aW5hL3JlcG9zL21hdGhzLWpveS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9rb25zdGFudGluYS9yZXBvcy9tYXRocy1qb3kvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB2aXRlUGx1Z2luIGFzIHJlbWl4IH0gZnJvbSBcIkByZW1peC1ydW4vZGV2XCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcblxuZGVjbGFyZSBtb2R1bGUgXCJAcmVtaXgtcnVuL25vZGVcIiB7XG4gIGludGVyZmFjZSBGdXR1cmUge1xuICAgIHYzX3NpbmdsZUZldGNoOiB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZW1peCh7XG4gICAgICBmdXR1cmU6IHtcbiAgICAgICAgdjNfZmV0Y2hlclBlcnNpc3Q6IHRydWUsXG4gICAgICAgIHYzX3JlbGF0aXZlU3BsYXRQYXRoOiB0cnVlLFxuICAgICAgICB2M190aHJvd0Fib3J0UmVhc29uOiB0cnVlLFxuICAgICAgICB2M19zaW5nbGVGZXRjaDogdHJ1ZSxcbiAgICAgICAgdjNfbGF6eVJvdXRlRGlzY292ZXJ5OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIC8vIFVzZSB2MSByb3V0ZSBjb252ZW50aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggZXhpc3Rpbmcgcm91dGVzXG4gICAgICBpZ25vcmVkUm91dGVGaWxlczogW1wiKiovLipcIl0sXG4gICAgfSksXG4gICAgdHNjb25maWdQYXRocygpLFxuICBdLFxuICBjc3M6IHtcbiAgICBwb3N0Y3NzOiBcIi4vcG9zdGNzcy5jb25maWcuY2pzXCIsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFtcImkxOG5leHQtZnMtYmFja2VuZFwiXSxcbiAgfSxcbiAgc3NyOiB7XG4gICAgbm9FeHRlcm5hbDogW1wiaTE4bmV4dC1mcy1iYWNrZW5kXCJdLFxuICAgIHRhcmdldDogXCJub2RlXCIsXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiBcImVzbmV4dFwiLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFSLFNBQVMsY0FBYyxhQUFhO0FBQ3pULFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sbUJBQW1CO0FBUTFCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLFFBQVE7QUFBQSxRQUNOLG1CQUFtQjtBQUFBLFFBQ25CLHNCQUFzQjtBQUFBLFFBQ3RCLHFCQUFxQjtBQUFBLFFBQ3JCLGdCQUFnQjtBQUFBLFFBQ2hCLHVCQUF1QjtBQUFBLE1BQ3pCO0FBQUE7QUFBQSxNQUVBLG1CQUFtQixDQUFDLE9BQU87QUFBQSxJQUM3QixDQUFDO0FBQUEsSUFDRCxjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILFNBQVM7QUFBQSxFQUNYO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLG9CQUFvQjtBQUFBLEVBQ2hDO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxZQUFZLENBQUMsb0JBQW9CO0FBQUEsSUFDakMsUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxFQUNWO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
