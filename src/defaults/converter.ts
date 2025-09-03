import { FSConverter } from '../types/converter'

/** Default data converter */
export const defaultConverter: FSConverter<any, any> = {
	toFirestore: model => model,
	fromFirestore: doc => doc.data()
}
