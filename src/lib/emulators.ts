import { FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

export type EmulatorsPorts = {
	auth?: number | false
	firestore?: number | false
	functions?: number | false
	storage?: number | false
}

export const runEmulators = (
	app: FirebaseApp,
	host = 'localhost',
	{
		auth = 9099,
		firestore = 8080,
		functions = 5001,
		storage = 9199
	}: EmulatorsPorts
) => {
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
