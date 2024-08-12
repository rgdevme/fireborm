import {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
} from 'firebase/firestore'

export type ConvertedModel<
  D extends DocumentData,
  M extends D | DocumentData
> = M & {
  id: string
  _ref: DocumentReference<M, D>
}

export type FSConverter<D extends DocumentData, M extends D | DocumentData> = {
  toFirestore: (model: M) => D
  fromFirestore: (doc: QueryDocumentSnapshot<D, D>) => M
}

export const defaultConverter = <
  D extends DocumentData,
  M extends D | DocumentData
>(): FSConverter<D, M> => ({
  toFirestore: (model) => model as D,
  fromFirestore: doc => doc.data() as M
}
)