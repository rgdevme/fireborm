import { Functions, HttpsCallable, httpsCallable } from 'firebase/functions'

export type FirebormCall<P, R> = HttpsCallable<
  P,
  { data?: R, error?: string[], code?: string }
>

export type FirebormCalls<P = any, R = any> = Record<string, FirebormCall<P, R>>


export class FirebormCallables<T extends FirebormCalls> {
  readonly callables = {} as T

  constructor(functions: Functions, functionsNames: (keyof T)[]) {
    functionsNames.forEach(name => {
      this.callables[name] = httpsCallable(
        functions,
        name as string
      ) as T[keyof T]
    })
  }
}

