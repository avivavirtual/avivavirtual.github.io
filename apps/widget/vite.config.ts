import { defineConfig } from 'vite';
export default defineConfig({ build: { lib: { entry: 'src/widget.ts', name: 'AvivaVirtualWidget', formats: ['iife'], fileName: () => 'widget.js' } } });
