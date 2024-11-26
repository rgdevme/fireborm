import { DocumentData, Firestore } from 'firebase/firestore'
import { Functions } from 'firebase/functions'
import { FirebaseStorage } from 'firebase/storage'
import { FirebormCallables, FirebormCalls } from './callable'
import { FirebormStorage } from './storage'
import { FirebormStore } from './store'
import { FirebormDataManager } from './import'

export type { FirebormCall } from './callable'
export * from './utilities'

export const FireBorm = ({
	firestore,
	storage: fbstorage,
	functions
}: {
	firestore: Firestore
	storage: FirebaseStorage
	functions?: Functions
}) => {
	return {
		initializeStore: <
			D extends DocumentData,
			M extends Object = D,
			C extends Object = M,
			I extends Object = M
		>(
			options: ConstructorParameters<typeof FirebormStore<D, M, C, I>>[0]
		) => {
			const store = new FirebormStore<D, M, C, I>(options)
			store.init(firestore)
			return store
		},
		initializeStorage: (
			options: ConstructorParameters<typeof FirebormStorage>[0]
		) => {
			const storage = new FirebormStorage(options)
			storage.init(fbstorage)
			return storage
		},
		initializeCallables: <T extends FirebormCalls>(
			functionNames: (keyof T)[]
		) => {
			if (!functions) throw new Error("Functions hasn't been provided")
			const callables = new FirebormCallables<T>(functions, functionNames)
			return callables.callables
		},
		initializeDataManager: () => {
			return new FirebormDataManager(firestore)
		}
	}
}
