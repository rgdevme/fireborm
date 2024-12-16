import {
	addDoc,
	arrayRemove,
	arrayUnion,
	collection,
	CollectionReference,
	deleteDoc,
	deleteField,
	doc,
	DocumentData,
	DocumentReference,
	FieldPath,
	Firestore,
	getCountFromServer,
	getDoc,
	getDocs,
	getFirestore,
	limit,
	onSnapshot,
	orderBy,
	OrderByDirection,
	query,
	QueryConstraint,
	setDoc,
	startAt,
	UpdateData,
	updateDoc,
	where,
	WhereFilterOp,
	WithFieldValue
} from 'firebase/firestore'
import { defaultConverter, FSConverter } from './converter'
import { PickByType, PickOptionals } from './utilities'

type Where<T> = [
	keyof T extends string ? keyof T | FieldPath : FieldPath,
	WhereFilterOp,
	unknown
][]

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
	#ref?: CollectionReference<ModelType, DocType>

	public init = (firestore?: Firestore) => {
		if (!firestore) firestore = getFirestore()
		if (this.#ref) throw new Error('Store has been initialized already')
		this.#ref = collection(firestore, this.path).withConverter({
			fromFirestore: this.toModel,
			toFirestore: this.toDocument
		}) as CollectionReference<ModelType, DocType>
	}

	get ref() {
		if (!this.#ref) throw new Error("Store hasn't been initialized")
		return this.#ref
	}

	constructor({
		path,
		plural,
		singular,
		defaultData,
		deleteOnUndefined,
		toDocument,
		toModel,
		onError
	}: FirebormStoreParameters<DocType, ModelType, CreateType, DefaultType>) {
		this.path = path
		this.plural = plural
		this.singular = singular
		this.defaultData = defaultData
		if (deleteOnUndefined) this.deleteOnUndefined = deleteOnUndefined
		if (onError) this.onError = onError
		if (toModel) this.toModel = toModel
		if (toDocument) this.toDocument = toDocument
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
	public docRef = (id?: string) => {
		if (!this.ref) throw new Error("Collection ref isn't defined")
		if (id) return doc(this.ref, id)
		return doc(this.ref)
	}

	public find = (id: string) => {
		return this.#wrap(async () => {
			const document = await getDoc(this.docRef(id))
			return document.data()
		})
	}

	public query = async ({
		where: wc = [],
		offset,
		limit: l,
		order,
		direction = 'asc'
	}: {
		where?: Where<DocType>
		offset?: number
		order?: keyof DocType
		direction?: OrderByDirection
		limit?: number
	}) => {
		return this.#wrap(async () => {
			const w: QueryConstraint[] = wc.map(c => where(...c))
			if (order !== undefined) w.push(orderBy(order as string, direction))
			if (offset !== undefined) w.push(startAt(offset))
			if (l !== undefined) w.push(limit(l))
			const q = query(this.ref, ...w)
			const snapshot = await getDocs(q)
			const result = snapshot.docs.map(d => d.data())
			return result
		})
	}

	public count = async (...where: QueryConstraint[]) => {
		return this.#wrap(async () => {
			const q = query(this.ref, ...where)
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

	public save = async (id: string, data: UpdateData<ModelType>) => {
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

		return this.#wrap(setDoc(this.docRef(id), upd, { merge: true }))
	}

	public relate = async (
		id: string,
		ref: DocumentReference,
		property: keyof PickByType<
			ModelType,
			DocumentReference[] | DocumentReference
		>
	) => {
		return this.#wrap(
			updateDoc(this.docRef(id), {
				[property]: arrayUnion(ref)
			} as UpdateData<DocType>)
		)
	}

	public unrelate = async (
		id: string,
		ref: DocumentReference,
		property: keyof PickByType<
			ModelType,
			DocumentReference[] | DocumentReference
		>
	) => {
		return this.#wrap(
			updateDoc(this.docRef(id), {
				[property]: arrayRemove(ref)
			} as UpdateData<DocType>)
		)
	}

	public create = (data: WithFieldValue<CreateType & { id?: string }>) => {
		return this.#wrap(async () => {
			const upd = { ...this.defaultData, ...data } as ModelType
			if (data.id === undefined) return addDoc(this.ref, upd)
			const newdocref = this.docRef(data.id as string)
			await setDoc(newdocref, upd)
			return newdocref
		})
	}

	public destroy = async (id: string) => {
		return this.#wrap(deleteDoc(this.docRef(id)))
	}

	public subscribe = (
		id: string,
		{ onChange }: { onChange: (data?: ModelType) => any }
	) => onSnapshot(doc(this.ref, id), d => onChange(d.data()))

	public subscribeMany = ({
		onChange,
		where
	}: {
		onChange: (data: ModelType[]) => any
		where: QueryConstraint[]
	}) =>
		onSnapshot(query(this.ref, ...where), d =>
			onChange(d.docs.map(x => x.data()))
		)

	public toModel = defaultConverter.fromFirestore
	public toDocument = defaultConverter.toFirestore
}
