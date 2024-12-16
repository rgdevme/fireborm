import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

export type FSConverter<
	D extends DocumentData = DocumentData,
	M extends D | DocumentData = D
> = {
	toFirestore: (model: M) => D
	fromFirestore: (doc: QueryDocumentSnapshot<D, D>) => M
}

export const defaultConverter: FSConverter<any, any> = {
	toFirestore: model => model,
	fromFirestore: doc => doc.data()
}
