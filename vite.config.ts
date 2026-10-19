import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Librerías grandes en archivos aparte: se cachean y solo se bajan donde se usan.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (/recharts|d3-|victory/.test(id)) return 'charts';
            if (/@supabase/.test(id)) return 'supabase';
            if (/motion|framer/.test(id)) return 'motion';
            if (/read-excel-file|papaparse|jszip/.test(id)) return 'files';
            if (/react-dom|react-router|scheduler|\/react\//.test(id)) return 'react';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
