import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static site. Everything ships same-origin because "playable anywhere" is a
// functional requirement: no CDN scripts, no remote fonts, no API calls on the
// play path (see docs/birdie-transition-plan.md §4 "Non-negotiables").
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // Audio buffers are big and already compressed; keep them as files rather
    // than base64-inlining them into the worker's precache manifest.
    assetsInlineLimit: 0,
  },
});
