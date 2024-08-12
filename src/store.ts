import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  FieldPath,
  Firestore,
  OrderByDirection,
  QueryConstraint,
  QueryDocumentSnapshot,
  UpdateData,
  WhereFilterOp,
  WithFieldValue,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc,
  where,
} from 'firebase/firestore'
import { PickByType, PickOptionals } from './utilities'
type Where<T> = [
  keyof T extends string ? keyof T | FieldPath : FieldPath,
  WhereFilterOp,
  unknown
][]

export type FSConverter<Ref> = Ref extends DocumentReference<
  infer Model,
  infer Document
>
  ? {
    toFirestore: (model: Model) => Document
    fromFirestore: (
      document: QueryDocumentSnapshot<Document, Document>
    ) => Model
  }
  : never

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
  readonly deleteOnNull: (keyof DocType)[] = []
  #ref?: CollectionReference<ModelType, DocType>

  public init = (firestore: Firestore) => {
    if (this.#ref) throw new Error('Store has been initialized already')
    this.#ref = collection(firestore, this.path).withConverter({
      fromFirestore: this.toModel,
      toFirestore: this.toDocument,
    })
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
    deleteOnNull,
    toDocument,
    toModel,
    onError,
  }: {
    path: string
    plural: string
    singular: string
    defaultData: DefaultType
    deleteOnNull: (keyof PickOptionals<DocType>)[],
    onError?: (error: Error) => void
    toModel?: (document: QueryDocumentSnapshot<DocType, DocType>) => ModelType
    toDocument?: (model: ModelType) => DocType
  }) {
    this.path = path
    this.plural = plural
    this.singular = singular
    this.defaultData = defaultData
    this.deleteOnNull = deleteOnNull
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
      if (this.deleteOnNull.includes(key) && value === null) {
        upd[key as keyof typeof data] =
          deleteField() as (typeof data)[keyof typeof data]
      } else {
        upd[key] = value
      }
    }

    return this.#wrap(
      setDoc<ModelType, DocType>(
        this.docRef(id),
        upd,
        { merge: true }
      )
    )
  }

  public relate = async (
    id: string,
    ref: DocumentReference,
    property: keyof PickByType<ModelType, DocumentReference[] | DocumentReference>
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
    property: keyof PickByType<ModelType, DocumentReference[] | DocumentReference>
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
    { onChange }: { onChange: (data?: ModelType) => any }
  ) => onSnapshot(doc(this.ref, id), d => onChange(d.data()))

  public subscribeMany = ({
    onChange,
    where,
  }: {
    onChange: (data: ModelType[]) => any
    where: QueryConstraint[]
  }) =>
    onSnapshot(query(this.ref, ...where), d =>
      onChange(d.docs.map(x => x.data()))
    )

  public toModel: (
    model: QueryDocumentSnapshot<DocType, DocType>
  ) => ModelType = document => {
    return document as ModelType
  }
  public toDocument: (model: ModelType) => DocType = model => {
    return model as unknown as DocType
  }
}
