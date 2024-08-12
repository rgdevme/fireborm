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

export type WithID<T> = T & { id: string }

export type WithRef<T, Ref extends DocumentReference> = T & {
  _ref: Ref
}

/** Return keys that match type */
export type PickByType<T extends Record<string, any>, V> = {
  [K in keyof T as T[K] extends infer U
  ? (U extends V ? K : never)
  : never]
  : T[K]
}

/** Return keys that match type strictly */
export type PickByTypeStrict<T extends Record<string, any>, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K] }

/** Returns a new type with only the optional keys of the given type */
export type PickOptionals<T extends Record<string, any>> = PickByType<T, undefined>

/** Returns the base type with all optional keys extending to null too */
export type NullOptionals<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends infer U
  ? (U extends undefined ? T[K] | null : T[K])
  : T[K]
}
