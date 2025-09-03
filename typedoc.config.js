/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
	entryPoints: ['./src/index.ts'],
	plugin: ['typedoc-plugin-markdown']
}

export default config
