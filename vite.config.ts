import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ command }) => ({
	root: './',
	build: {
		watch:
			command === 'serve'
				? {
						buildDelay: 2000,
						clearScreen: true,
						include: 'src/**'
				  }
				: undefined,
		lib: {
			entry: './src/index.ts',
			name: 'index',
			fileName: 'index',
			formats: ['cjs', 'es']
		},	
		outDir: 'dist',
		emptyOutDir: false,
		minify: false,
		rollupOptions: {
			external: [/firebase/, /node_modules/]
		}
	},
	plugins: [
		dts({
			include: ['./src'],
			rollupTypes: true,
			insertTypesEntry: true
		})
	]
}))
