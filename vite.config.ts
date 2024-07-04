import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  root: './',
  build: {
    watch: {
      buildDelay: 2000,
      clearScreen: true,
      include: 'src/**',
    },
    lib: {
      entry: './src/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      external: [/firebase/, 'currency.js'],
    },
  },
  plugins: [
    dts({
      include: ['./src'],
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
})
