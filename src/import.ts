import { getApp } from 'firebase/app'
import {
	collection,
	doc,
	DocumentReference,
	Firestore,
	getFirestore,
	writeBatch
} from 'firebase/firestore'

export class FirebormDataManager {
	#firestore: Firestore

	constructor(firestore?: Firestore) {
		if (!firestore) {
			const app = getApp()
			firestore = getFirestore(app)
		}
		this.#firestore = firestore
	}

	import = async <Files extends { [collection: string]: object[] }>({
		files,
		ignore,
		relations
	}: {
		files: Files
		ignore?: { [key in keyof Files]: (keyof Files[key][number])[] }
		relations?: {
			[key in keyof Files]: {
				from: {
					property: keyof Files[key][number]
				}
				to: {
					collection: keyof Files
					property: string
				}
			}[]
		}
		log?: boolean
	}) => {
		// const filesArray = new Array(files.length).map((_, i) => files.item(i)!)

		/** Get file data
		 * for each file iterate throug the objects to get their firestore ref,
		 * and their properties
		 */
		const unprocessedRecords = await Promise.all(
			Object.entries(files).map(([key, data]) => {
				return data.map(object => {
					return {
						collection: key,
						ref: doc(collection(this.#firestore, key)),
						object
					}
				})
			})
		)

		const records: {
			ref: DocumentReference
			data: object
			collection: string
		}[] = []

		// Iterate through the records and build their associations
		unprocessedRecords.flat().forEach(({ ref, object, collection }, i, a) => {
			const data = object

			relations?.[collection]?.forEach(({ from, to }) => {
				const originValue: string | string[] = data[from.property as any]
				const originIsArray = Array.isArray(originValue)
				let update: DocumentReference[] | DocumentReference

				if (originIsArray) {
					const newVal = originValue as (string | DocumentReference)[]

					const targets = a.filter(x => {
						const isFromCollection = x.collection === to.collection
						let hasValue = false

						const targetValue: string | string[] = x.object[to.property]
						const targetIsArray = Array.isArray(targetValue)

						if (!targetIsArray) {
							hasValue = originValue?.includes(targetValue?.toString())
						} else {
							hasValue = originValue.some(y =>
								targetValue?.includes(y?.toString())
							)
						}

						return isFromCollection && hasValue
					})

					targets.forEach(t => {
						const targetValue: string | string[] = t.object[to.property]
						const targetIsArray = Array.isArray(targetValue)

						if (!targetIsArray) {
							const i = newVal.indexOf(targetValue.toString())
							newVal.splice(i, 1, t.ref)
						} else {
							targetValue.forEach(v => {
								const i = newVal.indexOf(v.toString())
								newVal.splice(i, 1, t.ref)
							})
						}
					})
					update = newVal as DocumentReference[]
				} else {
					let newVal = originValue as string | DocumentReference

					const target = a.find(x => {
						const isFromCollection = x.collection === to.collection
						let hasValue = false

						const targetValue: string | string[] = x.object[to.property]
						const targetIsArray = Array.isArray(targetValue)

						if (!targetIsArray)
							hasValue = originValue.toString() === targetValue.toString()
						else hasValue = targetValue.includes(originValue.toString())

						return isFromCollection && hasValue
					})
					if (!target) return
					newVal = target.ref
					update = newVal
				}
				data[from.property as any] = update
			})
			records.push({ ref, data, collection })
		})

		const batch = writeBatch(this.#firestore)
		// Perform updates
		records.forEach(({ ref, data, collection }) => {
			for (const key in data) {
				if (ignore?.[collection]?.includes(key as any)) {
					delete data[key]
				}
			}
			batch.set(ref, data)
		})

		// Commit updates
		await batch.commit()
	}
}
