import { DocumentData, Firestore } from 'firebase/firestore'
import { Functions } from 'firebase/functions'
import { FirebaseStorage } from 'firebase/storage'
import { FirebormCallables, FirebormCalls } from './callable'
import { FirebormDataManager } from './import'
import { FirebormStorage, FirebormStorageParameters } from './storage'
import { FirebormStore, FirebormStoreParameters } from './store'

export * from './callable'
export * from './converter'
export * from './import'
export * from './storage'
export * from './store'
export * from './utilities'

export type FirebormParams = {
	firestore: Firestore
	storage: FirebaseStorage
	functions?: Functions
}

export const FireBorm = ({
	firestore,
	storage: fbstorage,
	functions
}: FirebormParams) => {
	return {
		initializeStore: <
			D extends DocumentData,
			M extends Object = D,
			C extends Object = M,
			I extends Object = M
		>(
			options: FirebormStoreParameters<D, M, C, I>
		) => {
			const store = new FirebormStore<D, M, C, I>(options)
			store.init(firestore)
			return store
		},
		initializeStorage: (options: FirebormStorageParameters) => {
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
