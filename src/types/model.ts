import { DocumentData, DocumentReference } from 'firebase/firestore'
import { Modify, PickOptionals } from '../utilities'

export type ModelFromDocument<
	D extends DocumentData,
	M extends D | DocumentData = {}
> = Modify<
	D,
	M & {
		id: string
		_ref: DocumentReference<ModelFromDocument<D, M>, D>
	}
>

export type RequiredDataFromModel<M extends Object> = Omit<
	M,
	keyof PickOptionals<M> | 'id' | '_ref'
>
