import { EmulatorConfig } from '../types/emulators'

export const defaultEmulationPorts: Required<EmulatorConfig> = {
	host: 'localhost',
	auth: false,
	firestore: false,
	functions: false,
	storage: false
}
