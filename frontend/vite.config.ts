import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // Proxy API requests during development to the backend running on localhost:3001
  // This allows the frontend to use a relative `/api` base path in both dev and prod.
  server: {
    host: "::",
    port: 5173, // Use default Vite port
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  plugins: [
    react({
      // Add dev tools only in development
      devTarget: mode === 'development' ? 'es2015' : 'es2020',
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          // Simple, safe chunking strategy
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    },
    // Disable minification that might cause issues
    minify: mode === 'production' ? 'esbuild' : false,
  },
  esbuild: {
    // Ensure proper JSX handling
    jsx: 'automatic',
    target: 'es2020'
  }
}));
