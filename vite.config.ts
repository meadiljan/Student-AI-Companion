import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Handle node_modules
          if (id.includes('node_modules')) {
            // Core React only
            if (id.includes('react/') && !id.includes('react-')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }
            
            // Radix UI components - split into groups
            if (id.includes('@radix-ui/react-dialog') || 
                id.includes('@radix-ui/react-alert-dialog') ||
                id.includes('@radix-ui/react-popover')) {
              return 'radix-dialogs';
            }
            if (id.includes('@radix-ui/react-dropdown-menu') ||
                id.includes('@radix-ui/react-context-menu') ||
                id.includes('@radix-ui/react-menubar') ||
                id.includes('@radix-ui/react-navigation-menu')) {
              return 'radix-menus';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui-core';
            }
            
            // Large libraries get their own chunks
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('pdfjs-dist')) {
              return 'pdf';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            if (id.includes('react-day-picker')) {
              return 'date-picker';
            }
            
            // Utilities
            if (id.includes('clsx') || id.includes('class-variance-authority') || 
                id.includes('tailwind-merge')) {
              return 'style-utils';
            }
            if (id.includes('zod')) {
              return 'validation';
            }
            
            // Forms
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
            
            // Theme and styling
            if (id.includes('next-themes')) {
              return 'theme';
            }
            
            // Notifications and toast
            if (id.includes('sonner')) {
              return 'notifications';
            }
            
            // Query and data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            
            // Markdown processing
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'markdown';
            }
            
            // UI interaction libraries
            if (id.includes('cmdk')) {
              return 'command';
            }
            if (id.includes('vaul')) {
              return 'drawer';
            }
            if (id.includes('embla-carousel')) {
              return 'carousel';
            }
            
            // Smaller utilities
            if (id.includes('react-resizable-panels') ||
                id.includes('input-otp')) {
              return 'ui-misc';
            }
            
            // Everything else goes to vendor
            return 'vendor';
          }
        }
      }
    }
  }
}));
