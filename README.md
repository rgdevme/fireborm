# FireBorm
 A Firebase ORM-like wrapper, inspired by packages like sequelize and mongoose

TL;DR: Check the [example to initialize FireBorm](./examples/fireborm-init.md).

## Why?
Using the firebase sdk to fetch data from Firestore and transform it to the model we use on the apps can sometimes be verbose.

This package solves this issue using an approach inspired in sequelize or mongoose.

## Stores
Each Store corresponds to a collection.

You declare each store by calling `fireborm.initializeStore()` and providing the arguments.

More information about the arguments, and the class returned will be added soon.

## Storages
Each Storage corresponds to a collection.

You declare each storage by calling `fireborm.initializeStorage()` and providing the arguments.

More information about the arguments, and the class returned will be added soon.
