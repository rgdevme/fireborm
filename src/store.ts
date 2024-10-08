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
import { ConvertedModel, defaultConverter, FSConverter } from './converter'
import { PickByType, PickOptionals } from './utilities'

type Where<T> = [
  keyof T extends string ? keyof T | FieldPath : FieldPath,
  WhereFilterOp,
  unknown
][]

export class FirebormStore<
  DocType extends DocumentData,
  ModelType extends object = DocType,
  CreateType extends object = ModelType,
  DefaultType extends object = ModelType
> {
  readonly path: string
  readonly plural: string
  readonly singular: string
  readonly defaultData: DefaultType
  readonly deleteOnUndefined: (keyof DocType)[] = []
  #ref?: CollectionReference<ConvertedModel<DocType, ModelType>, DocType>

  public init = (firestore: Firestore) => {
    if (this.#ref) throw new Error('Store has been initialized already')
    this.#ref = collection(firestore, this.path).withConverter({
      fromFirestore: doc => ({
        id: doc.id,
        _ref: doc.ref,
        ...this.toModel(doc as any),
      }),
      toFirestore: ({ id, _ref, ...model }) => this.toDocument(model as any),
    }) as CollectionReference<ConvertedModel<DocType, ModelType>, DocType>
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
    onError,
  }: {
    path: string
    plural: string
    singular: string
    defaultData: DefaultType
    deleteOnUndefined?: (keyof PickOptionals<DocType>)[]
    onError?: (error: Error) => void
    toModel?: FSConverter<DocType, ModelType>['fromFirestore']
    toDocument?: FSConverter<DocType, ModelType>['toFirestore']
  }) {
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
    where: wc,
    offset,
    limit,
    order,
    direction = 'asc',
  }: {
    where: Where<DocType>
    offset?: number
    order?: keyof DocType
    direction?: OrderByDirection
    limit?: number
  }) => {
    return this.#wrap(async () => {
      const w: QueryConstraint[] = wc.map(c => where(...c))
      if (order !== undefined) w.push(orderBy(order as string, direction))
      if (offset !== undefined) w.push(startAt(offset))
      if (limit !== undefined) w.push(startAt(limit))
      const q = query(this.ref, ...w)
      const snapshot = await getDocs(q)
      const result = snapshot.docs.map(d => d.data())
      return result
    })
  }

  public count = async (...where: QueryConstraint[]) => {
    return this.#wrap(async () => {
      const q = query(this.ref, ...where)
      const { data } = await getCountFromServer(q)
      return data().count
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

    return this.#wrap(
      setDoc(this.docRef(id), upd, { merge: true })
    )
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
        [property]: arrayUnion(ref),
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
        [property]: arrayRemove(ref),
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
    { onChange }: { onChange: (data?: ConvertedModel<DocType, ModelType>) => any }
  ) => onSnapshot(doc(this.ref, id), d => onChange(d.data()))

  public subscribeMany = ({
    onChange,
    where,
  }: {
    onChange: (data: ConvertedModel<DocType, ModelType>[]) => any
    where: QueryConstraint[]
  }) =>
    onSnapshot(query(this.ref, ...where), d =>
      onChange(d.docs.map(x => x.data()))
    )

  public toModel = defaultConverter<DocType, ModelType>().fromFirestore
  public toDocument = defaultConverter<DocType, ModelType>().toFirestore
}
