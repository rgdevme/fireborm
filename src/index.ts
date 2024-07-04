import { DocumentData, Firestore } from 'firebase/firestore'
import { FirebaseStorage } from 'firebase/storage'
import { FirebormStorage } from './storage'
import { FirebormStore } from './store'

export const FireBorm = ({
  firestore,
  storage: fbstorage,
}: {
  firestore: Firestore
  storage: FirebaseStorage
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
  }
}
