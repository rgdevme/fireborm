import { Functions, HttpsCallable, httpsCallable } from 'firebase/functions'

export type FirebormCalls<
  Params = any,
  Response = any
> = Record<string, HttpsCallable<Params, CallableResponse<Response>>>

export type CallableResponse<T> = {
  data?: T,
  error?: string[],
  code?: string
}

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

