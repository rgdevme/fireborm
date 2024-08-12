import { DocumentReference } from 'firebase/firestore'

/** Modifies the properties of the first type,
 * overwriting them with the properties of the second type second object 
 **/
export type Modify<
  Base,
  Mods extends { [k in keyof Base]?: any }
> = Omit<Base, keyof Mods> & Mods

/** Make only some properties optional */
export type Optional<Base, K extends keyof Base> =
  Pick<Partial<Base>, K> & Omit<Base, K>

/** Make only some properties not optional */
export type Prioritize<T, K extends keyof T> = Required<Pick<T, K>> &
  Partial<Omit<T, K>>

/** Return keys by type */
export type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: Required<T>[K] extends V ? K : never
}[keyof T]

export type WithID<T> = T & { id: string }

export type WithRef<T, Ref extends DocumentReference> = T & {
  _ref: Ref
}

/** Returns optional keys */
export type OnlyOptional<T extends object> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]>
  ? never
  : K
}[keyof T], undefined>
