import { DocumentReference } from 'firebase/firestore'

export type Modify<T, R extends { [k in keyof T]?: any }> = Omit<T, keyof R> & R
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type Prioritize<T, K extends keyof T> = Required<Pick<T, K>> &
  Partial<Omit<T, K>>
export type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: Required<T>[K] extends V ? K : never
}[keyof T]
export type WithID<T> = T & { id: string }
export type WithRef<T, Ref extends DocumentReference> = T & {
  _ref: Ref
}
