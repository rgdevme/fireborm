import { Functions, HttpsCallable, httpsCallable } from 'firebase/functions'

export type FirebormCalls = Record<string, HttpsCallable<unknown, CallableResponse>>

export type CallableResponse<T = unknown> = Promise<{
  data?: T, error?: string[], code?: string
}>

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
