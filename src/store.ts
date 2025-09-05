import {
	addDoc,
	and,
	arrayRemove,
	arrayUnion,
	collection,
	CollectionReference,
	deleteDoc,
	deleteField,
	doc,
	DocumentData,
	DocumentReference,
	endAt,
	endBefore,
	FieldPath,
	Firestore,
	getCountFromServer,
	getDoc,
	getDocs,
	limit,
	onSnapshot,
	or,
	orderBy,
	OrderByDirection,
	query,
	QueryCompositeFilterConstraint,
	QueryDocumentSnapshot,
	QueryFieldFilterConstraint,
	QueryFilterConstraint,
	QueryNonFilterConstraint,
	setDoc,
	startAfter,
	startAt,
	UpdateData,
	updateDoc,
	where,
	WhereFilterOp,
	WithFieldValue
} from 'firebase/firestore'
import { defaultConverter } from './defaults'
import { FSConverter } from './types'
import { PickByType, PickOptionals } from './utilities'

export type Constrain<T = any> = [
	T extends Object
		? keyof T extends string
			? keyof T | FieldPath
			: FieldPath
		: string,
	WhereFilterOp,
	unknown
]

export type Where<T = any> = (
	| { and: Constrain<T>[] }
	| { or: Constrain<T>[] }
)[]

export type QueryOptions<T = any> = {
	where?: Where<T>
	order?: keyof T
	direction?: OrderByDirection
	limit?: number
	pagination?: {
		pointer: DocumentData | null
		start: boolean
		include: boolean
	}
}

export type CountOptions<T = any> = NonNullable<QueryOptions<T>['where']>

export type FirebormStoreParameters<
	DocType extends DocumentData = DocumentData,
	ModelType extends object = DocType,
	CreateType extends object = ModelType,
	DefaultType extends object = ModelType
> = {
	path: string
	plural: string
	singular: string
	defaultData: DefaultType
	deleteOnUndefined?: (keyof PickOptionals<DocType>)[]
	onError?: (error: Error) => void
	toModel?: FSConverter<DocType, ModelType>['fromFirestore']
	toDocument?: FSConverter<DocType, ModelType>['toFirestore']
}

/**
 * __Firestore Collection manager__
 *
 * Provides methods to handle a collection's crud operations, relations,
 * subscriptions, and data conversion.
 */
export class FirebormStore<
	DocType extends DocumentData = DocumentData,
	ModelType extends object = DocType,
	CreateType extends object = ModelType,
	DefaultType extends object = ModelType
> {
	readonly path: string
	readonly plural: string
	readonly singular: string
	readonly defaultData: DefaultType
	readonly deleteOnUndefined: (keyof DocType)[] = []
	#ref: CollectionReference<ModelType, DocType>

	get ref() {
		if (!this.#ref) throw new Error("Store hasn't been initialized")
		return this.#ref
	}

	constructor(
		firestore: Firestore,
		{
			path,
			plural,
			singular,
			defaultData,
			deleteOnUndefined,
			toDocument,
			toModel,
			onError
		}: FirebormStoreParameters<DocType, ModelType, CreateType, DefaultType>
	) {
		this.path = path
		this.plural = plural
		this.singular = singular
		this.defaultData = defaultData
		if (deleteOnUndefined) this.deleteOnUndefined = deleteOnUndefined
		if (onError) this.onError = onError
		if (toModel) this.toModel = toModel
		if (toDocument) this.toDocument = toDocument

		this.#ref = collection(firestore, this.path).withConverter({
			fromFirestore: this.toModel,
			toFirestore: this.toDocument
		})
	}

	onError: (error: Error) => void = console.error
	#wrap<X>(f: Promise<X> | (() => Promise<X>)) {
		try {
			return f instanceof Promise ? f : f()
		} catch (error) {
			this.onError(error as Error)
			throw error
		}
	}
	public docRef = <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		id?: string
	) => {
		if (!this.ref) throw new Error("Collection ref isn't defined")
		if (id) return doc<Model, Doc>(this.ref as any, id)
		return doc<Model, Doc>(this.ref as any)
	}

	public find = <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		id: string
	) => {
		return this.#wrap(async () => {
			const document = await getDoc(this.docRef<Doc, Model>(id))
			return document.data()
		})
	}

	private buildQueryConstrains = <Doc extends DocType = DocType>({
		where: filterConstrains = [],
		limit: max = undefined,
		pagination = undefined,
		order = undefined,
		direction = 'asc'
	}: QueryOptions<Doc> = {}) => {
		let compositeConstrains: QueryFilterConstraint
		let isSingle = false
		const unwrappedCompositeConstrains = filterConstrains.map(
			(filterConstrain, _, a) => {
				const key = 'and' in filterConstrain ? 'and' : 'or'
				const isOr = key === 'or'
				const qc: QueryFieldFilterConstraint[] = filterConstrain[key].map(
					(constrain: Constrain<Doc>) => where(...constrain)
				)

				isSingle = a.length === 1 && qc.length === 1

				if (isSingle) return qc[0]
				else if (isOr) return or(...qc)
				else return and(...qc)
			}
		)

		if (isSingle) {
			compositeConstrains = unwrappedCompositeConstrains[0]
		} else {
			compositeConstrains = and(...unwrappedCompositeConstrains)
		}

		const nonCompositecontrains: QueryNonFilterConstraint[] = []
		if (order !== undefined) {
			nonCompositecontrains.push(orderBy(order as string, direction))

			if (pagination?.pointer) {
				let method = pagination.start
					? pagination.include
						? startAt
						: startAfter
					: pagination.include
					? endAt
					: endBefore

				nonCompositecontrains.push(method(pagination.pointer))
			}
		}
		if (max !== undefined) {
			nonCompositecontrains.push(limit(max))
		}

		return [compositeConstrains, ...nonCompositecontrains] as [
			QueryCompositeFilterConstraint,
			...[QueryNonFilterConstraint]
		]
	}

	public query = async <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		queryOptions?: QueryOptions<Doc>
	) => {
		return this.#wrap(async () => {
			const constrains = this.buildQueryConstrains(queryOptions)
			const q = query<Model, Doc>(this.ref as any, ...constrains)
			const snapshot = await getDocs<Model, Doc>(q)
			const result = snapshot.docs.map(d => d.data())
			return result
		})
	}

	public count = async <Doc extends DocType = DocType>(
		countOptions?: CountOptions<Doc>
	) => {
		return this.#wrap(async () => {
			const constrains = this.buildQueryConstrains({ where: countOptions })
			const q = query(this.ref, ...constrains)
			const res = await getCountFromServer(q)
			return res.data().count
		})
	}

	public exists = async (id: string) => {
		return this.#wrap(async () => {
			const document = await getDoc(this.docRef(id))
			return document.exists()
		})
	}

	public save = async <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		id: string,
		data: UpdateData<Model>
	) => {
		const upd = {} as typeof data

		for (const key in data) {
			const value = data[key]
			const isDeletable = this.deleteOnUndefined.includes(key)
			const isUndefined = value === undefined
			if (isDeletable && isUndefined) {
				upd[key as string] = deleteField()
			} else {
				upd[key] = value
			}
		}

		return this.#wrap(
			setDoc(this.docRef<Doc, Model>(id), upd, {
				merge: true
			})
		)
	}

	public relate = async <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		id: string,
		ref: DocumentReference,
		property: keyof PickByType<Model, DocumentReference[] | DocumentReference>
	) => {
		return this.#wrap(
			updateDoc(this.docRef(id), {
				[property]: arrayUnion(ref)
			} as UpdateData<Doc>)
		)
	}

	public unrelate = async <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		id: string,
		ref: DocumentReference,
		property: keyof PickByType<Model, DocumentReference[] | DocumentReference>
	) => {
		return this.#wrap(
			updateDoc(this.docRef(id), {
				[property]: arrayRemove(ref)
			} as UpdateData<Doc>)
		)
	}

	public create = <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType,
		Create extends CreateType = CreateType
	>(
		data: WithFieldValue<Create & { id?: string }>
	) => {
		return this.#wrap(async () => {
			const upd = { ...this.defaultData, ...data } as Model
			if (data.id === undefined) return addDoc(this.ref, upd)
			const newdocref = this.docRef<Doc, Model>(data.id as string)
			await setDoc(newdocref, upd)
			return newdocref
		})
	}

	public destroy = async <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		id: string
	) => {
		return this.#wrap(deleteDoc(this.docRef<Doc, Model>(id)))
	}

	public subscribe = <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>(
		id: string,
		{ onChange }: { onChange: (data?: Model) => any }
	) =>
		onSnapshot<Model, Doc>(doc<Model, Doc>(this.ref as any, id), d =>
			onChange(d.data())
		)

	public subscribeMany = <
		Doc extends DocType = DocType,
		Model extends ModelType = ModelType
	>({
		onChange,
		...queryOptions
	}: QueryOptions<Doc> & {
		onChange: (update: {
			last: QueryDocumentSnapshot<Model, Doc>
			first: QueryDocumentSnapshot<Model, Doc>
			data: Model[]
		}) => any
	}) => {
		const constrains = this.buildQueryConstrains(queryOptions)
		return onSnapshot<Model, Doc>(
			query<Model, Doc>(this.ref as any, ...constrains),
			d => {
				const snapshots = d.docs
				const last = snapshots[snapshots.length - 1]
				const first = snapshots[0]
				const data = snapshots.map(x => x.data())
				return onChange({ last, first, data })
			}
		)
	}

	public toModel = defaultConverter.fromFirestore

	/** Conve */
	public toDocument = defaultConverter.toFirestore
}
