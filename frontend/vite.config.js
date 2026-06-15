import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev proxy: frontend calls /api/* -> Spring Boot at :8080 (avoids CORS in dev)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
});
