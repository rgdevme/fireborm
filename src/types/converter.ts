import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

/** Object with methods to convert to and from firebase documents.
 * @link https://firebase.google.com/docs/reference/node/firebase.firestore.FirestoreDataConverter
 */
export type FSConverter<
	D extends DocumentData = DocumentData,
	M extends D | DocumentData = D
> = {
	/** Transform objects of type M into Firestore data of type D,
	 * where M extends D. */
	toFirestore: (model: M) => D
	/** Transform Firestore data of type D into objects of type M. */
	fromFirestore: (doc: QueryDocumentSnapshot<D, D>) => M
}
