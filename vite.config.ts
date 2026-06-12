/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // i18next mit Default-Deutsch initialisieren, damit i18n.t() in Tests echte Strings liefert.
    setupFiles: ['./src/test/setup-i18n.ts'],
  },
});
