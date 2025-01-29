import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
	root: './',
	build: {
		lib: {
			entry: './src/index.ts',
			name: 'index',
			fileName: 'index',
			formats: ['cjs', 'es']
		},
		outDir: 'dist',
		emptyOutDir: false,
		minify: false,
		rollupOptions: { external: /node_modules/ }
	},
	plugins: [
		dts({
			include: ['./src'],
			rollupTypes: true,
			insertTypesEntry: true
		})
	]
})
