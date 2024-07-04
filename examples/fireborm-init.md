Initialize fireborm after initializing firebase 
```ts
/* firebase config file */

import { FireBorm } from 'fireborm'

// Firebase config...
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)
const storage = getStorage(app)

// Initialize Firebase
const fireborm = FireBorm({ firestore, storage })
```

Declare your store
```ts
/* ./src/stores/MyStore.ts */

type DocumentSchema = {
  name: string,
  createdAt: Timestamp
}

type ModelSchema = Modify<DocumentSchema, {
  id: string,
  createdAt: Date
}>

type CreationSchema = Prioritize<ModelSchema, 'name'>
type DefaultSchema = Partial<ModelSchema>

export const MyStore = fireborm.initializeStore<
  DocumentSchema, // Document structure in Firebase
  ModelSchema, // Document structure transformed for use in the app
  CreationSchema, // Minimum required data for creation
  DefaultSchema // Default object data
>({
  path: 'collection',
  plural: 'Items',
  singular: 'Item',
  defaultData: { // as DefaultSchema
    id:undefined,
    name: undefined,
    createdAt: undefined
  },
  toModel: document => ({ // Transformer from DocumentSchema to ModelSchema
    ...document.data(),
    id: document.id,
  }),
  toDocument: ({ id, ...model }) => { // Transformer from ModelSchema to DocumentSchema
    return model
  },
})
```

Declare your storage
```ts
export const MyStorage = fireborm.initializeStorage({
  path: 'bucket-name',
  folder: 'folder-name',
  // Resolvers to path/folder. Both are required
})

```

Use your stores and stroages
```ts
/* ./src/component/index.tsx */

// ... imports

const { ... } = MyStore
const { ... } = MyStorage

// ... your code
```