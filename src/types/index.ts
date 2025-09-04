import { FirestoreSettings } from 'firebase/firestore'
import { EmulatorConfig } from './emulators'

export * from './emulators'
export * from './converter'
export * from './model'

/**
 * Interface for configuring the Fireborm client, including settings for
 * an emulator and Firestore.
 */
export interface FirebormSettings {
	/**
	 * Optional configuration for connecting to a Firestore emulator.
	 * If not provided, the client will connect to the production Firestore service.
	 */
	emulator?: EmulatorConfig

	/** Optional settings specifically for the Firestore service. */
	firestore?: FirestoreSettings
}
