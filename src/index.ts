import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app'
import {
	DocumentData,
	getFirestore,
	initializeFirestore
} from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'
import { FirebormCallables, FirebormCalls } from './callable'
import { FirebormDataManager } from './import'
import { FirebormStorage } from './storage'
import { FirebormStore, FirebormStoreParameters } from './store'
import { FirebormSettings } from './types'
import { runEmulators } from './utils/emulators'

export * from './callable'
export * from './defaults/converter'
export * from './import'
export * from './storage'
export * from './store'
export * from './utilities'
export * from './types'

const INSTANCE = Symbol('FIREBORM')

/**
 * Initialize a `@firebase/app#FirebaseApp`, and instantiate Fireborm exposing the following methods:
 *
 * - createStore: manage a collection.
 * - createStorage: manage a storage.
 * - createDataManager: manage data migration.
 * - createCallables: manage function calls with type safety.
 *
 * Use the __settings__ parameter to configure firestore and the emulators.
 */
export class Fireborm {
	/** Options to create and initialize a `@firebase/app#FirebaseApp` instance. */
	config: FirebaseOptions
	/** `@firebase/app#FirebaseApp` instance. */
	app: FirebaseApp

	/**
	 * @param config Options to create and initialize a `@firebase/app#FirebaseApp` instance.
	 * @param settings Interface for configuring the Fireborm client, including settings for an emulator and Firestore.
	 * @returns Single Fireborm instance
	 */
	constructor(
		config: FirebaseOptions,
		{ firestore = {}, emulator }: FirebormSettings = {}
	) {
		this.config = config
		this.app = initializeApp(config)
		initializeFirestore(this.app, firestore)

		if (emulator) runEmulators(this.app, emulator)

		if (!Fireborm[INSTANCE]) Fireborm[INSTANCE] = this
		return Fireborm[INSTANCE]
	}

	createStore = <
		D extends DocumentData,
		M extends Object = D,
		C extends Object = M,
		I extends Object = M
	>(
		options: FirebormStoreParameters<D, M, C, I>
	) => {
		const firestore = getFirestore(this.app)
		return new FirebormStore<D, M, C, I>(firestore, options)
	}

	createStorage = ({ path, bucket }: { path: string; bucket?: string }) => {
		const storage = getStorage(this.app, bucket)
		return new FirebormStorage(storage, path)
	}

	createDataManager = () => {
		const firestore = getFirestore(this.app)
		return new FirebormDataManager(firestore)
	}

	createCallables = <T extends FirebormCalls>(functionNames: (keyof T)[]) => {
		const functions = getFunctions(this.app)
		const callables = new FirebormCallables<T>(functions, functionNames)
		return callables.callables
	}
}
