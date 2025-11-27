import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // Disable source maps in build - they can cause network errors
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor code for better caching
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    // Optimize chunk sizes
    chunkSizeWarningLimit: 2000,
    // Use terser for minification
    minify: "terser",
    // Optimize CSS code splitting
    cssCodeSplit: true,
  },
}));
