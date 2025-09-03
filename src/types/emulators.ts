/** Firebase emulator configuration */
export type EmulatorConfig = {
	/** Emulators host. Defaults to `'localhost'` */
	host?: string
	/** Auth emulator port */
	auth?: number | false
	/** Firestore emulator port */
	firestore?: number | false
	/** Firebase functions emulator port */
	functions?: number | false
	/** Firebase storage emulator port */
	storage?: number | false
}
