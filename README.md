# FireBorm

A Firebase ORM-like wrapper, inspired by packages like sequelize and mongoose.

## Why?

Using the firebase sdk to fetch data from Firestore and transform it to the model we use on the apps can sometimes be verbose.

This package solves this issue using an approach inspired in sequelize or mongoose.

# Usage

Initializing fireborm also handles the firebase initialization, as well as emulators initialization.

```ts
// ./index.ts

import { FireBorm } from 'fireborm'

// Firebase config file
import { firebaseConfig } from '../../firebase-config'

// Initialize Fireborm singleton
const fireborm = new Fireborm(config, settings)
```

## Stores

Stores correspond to Collections. The store class provides end-to-end type hinting without much hassle.

Declare a store by calling `fireborm.createStore()` and providing the arguments.

```ts
// ./store.ts

export const MyStore = fireborm.createStore<
	DocumentSchema, // Shape of the document in Firebase
	ModelSchema, // Shape of the transformed document, used in the app
	CreationSchema, // Shape of the minimum required data for creation
	DefaultSchema // Shape of the default object data
>({
	path: 'path-without-spaces',
	plural: 'Plural name',
	singular: 'Singular name',
	defaultData: {
		// as DefaultSchema, or DocumentSchema if omited
		id: crypto.randomUUID(),
		name: '',
		createdAt: new Date()
	},
	toModel: document => ({
		// Transforms DocumentSchema to ModelSchema
		...document.data(),
		id: document.id
	}),
	toDocument: ({ id, ...model }) => {
		// Transforms ModelSchema to DocumentSchema
		return model
	}
})
```

Then use the store in any file like:

```ts
// ./component.tsx

store.count({ onChange: count => setCount(count) })

useEffect(() => {
	store.subscribeMany({ onChange: res => setData(res) })
}, [store, getQuery])
```

## Storages

Each Storage corresponds to a collection.

You declare each storage by calling `fireborm.initializeStorage()` and providing the arguments.

More information about the arguments, and the class returned will be added soon.
