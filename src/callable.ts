import { Functions, FunctionsError, httpsCallable } from 'firebase/functions'

export type FirebormCall<P, R> = (params: P) => Promise<R>

export type FirebormCalls<P = any, R = any> = Record<string, FirebormCall<P, R>>

export type FirebormCallablesOptions = {
  onError?: (err: FunctionsError) => unknown
}

export class FirebormCallables<T extends FirebormCalls> {
  readonly callables = {} as T

  constructor(
    functions: Functions,
    functionsNames: (keyof T)[],
    options?: FirebormCallablesOptions) {
    functionsNames.forEach(name => {
      this.callables[name] = (async (params: any) => {
        try {
          const { data } = await httpsCallable(
            functions,
            name as string
          )(params)
          return data
        } catch (e) {
          const err = e as FunctionsError
          if (options?.onError) options.onError(err)
          else console.error({
            cause: err.cause,
            code: err.code,
            customData: err.customData,
            details: err.details,
            message: err.message,
            name: err.name,
            stack: err.stack,
          })
          return err
        }
      }) as T[keyof T]
    })
  }
}

