import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app'
import {
	DocumentData,
	FirestoreSettings,
	getFirestore,
	initializeFirestore
} from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'
import { FirebormCallables, FirebormCalls } from './callable'
import { FirebormDataManager } from './import'
import { EmulatorsPorts, runEmulators } from './lib/emulators'
import { FirebormStorage } from './storage'
import { FirebormStore, FirebormStoreParameters } from './store'

export * from './callable'
export * from './converter'
export * from './import'
export * from './storage'
export * from './store'
export * from './utilities'

const INSTANCE = Symbol('instance')

export interface FirebormSettings {
	emulate?: EmulatorsPorts & {
		host?: string
	}
	firestore?: FirestoreSettings
}

/**
 * Initializes a single Fireborm instance that exposes intance creation methods.
 * This function intializes the firebase app, so there's no need to initialize it beforehand.
 *
 * If __settings.firestore__ is provided, it'll initialize firebase with those settings.
 *
 * If __settings.emulate__ is provided, it'll try to connect to the emulators,
 * so be sure to run "firebase emulators:start" in your cli.
 */
export class Fireborm {
	config: FirebaseOptions
	app: FirebaseApp

	/**
	 *
	 * @param config Options object for firebase/app initializeApp
	 * @param settings Settings for emulators and firestore
	 * @returns Single Fireborm instance
	 */
	constructor(config: FirebaseOptions, settings?: FirebormSettings) {
		this.config = config
		this.app = initializeApp(config)
		if (settings?.firestore) {
			initializeFirestore(this.app, settings.firestore || {})
		}

		if (settings?.emulate) {
			const { host, ...ports } = settings.emulate
			runEmulators(this.app, host, ports)
		}

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
