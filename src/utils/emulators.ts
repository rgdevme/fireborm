import { FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { defaultEmulationPorts } from '../defaults'
import { EmulatorConfig } from '../types'

/** Run the emulators with the provided options */
export const runEmulators = (app: FirebaseApp, options: EmulatorConfig) => {
	const { auth, firestore, functions, host, storage } = Object.assign(
		defaultEmulationPorts,
		options
	)
	if (auth !== false) {
		connectAuthEmulator(getAuth(app), `http://${host}:${auth}`)
	}
	if (firestore !== false) {
		connectFirestoreEmulator(getFirestore(app), host, firestore)
	}
	if (functions !== false) {
		connectFunctionsEmulator(getFunctions(app), host, functions)
	}
	if (storage !== false) {
		connectStorageEmulator(getStorage(app), host, storage)
	}
}
