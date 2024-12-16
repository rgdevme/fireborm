import { CollectionReference } from 'firebase/firestore';
import { DocumentData } from 'firebase/firestore';
import { DocumentReference } from 'firebase/firestore';
import { FieldPath } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';
import { FunctionsError } from 'firebase/functions';
import { ListResult } from '@firebase/storage';
import { OrderByDirection } from 'firebase/firestore';
import { QueryConstraint } from 'firebase/firestore';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { QueryDocumentSnapshot as QueryDocumentSnapshot_2 } from '@firebase/firestore';
import { StorageReference } from 'firebase/storage';
import { Unsubscribe } from '@firebase/firestore';
import { UpdateData } from 'firebase/firestore';
import { WhereFilterOp } from 'firebase/firestore';
import { WithFieldValue } from 'firebase/firestore';

export declare type ConvertedModel<D extends DocumentData, M extends D | DocumentData = {}> = Modify<D, M & {
    id: string;
    _ref: DocumentReference<ThisType<ConvertedModel<D, M>>, D>;
}>;

export declare const defaultConverter: FSConverter<any, any>;

export declare type DefaultModel<M extends Object> = Omit<M, keyof PickOptionals<M> | 'id' | '_ref'>;

export declare const FireBorm: ({ firestore, storage: fbstorage, functions }: FirebormParams) => {
    initializeStore: <D extends DocumentData, M extends Object = D, C extends Object = M, I extends Object = M>(options: FirebormStoreParameters<D, M, C, I>) => FirebormStore<D, M, C, I>;
    initializeStorage: (options: FirebormStorageParameters) => FirebormStorage;
    initializeCallables: <T extends FirebormCalls>(functionNames: (keyof T)[]) => T;
    initializeDataManager: () => FirebormDataManager;
};

export declare type FirebormCall<P, R> = (params: P) => Promise<R>;

export declare class FirebormCallables<T extends FirebormCalls> {
    readonly callables: T;
    constructor(functions: Functions, functionsNames: (keyof T)[], options?: FirebormCallablesOptions);
}

export declare type FirebormCallablesOptions = {
    onError?: (err: FunctionsError) => unknown;
};

export declare type FirebormCalls<P = any, R = any> = Record<string, FirebormCall<P, R>>;

export declare class FirebormDataManager {
    #private;
    constructor(firestore?: Firestore);
    import: <Files extends {
        [collection: string]: object[];
    }>({ files, ignore, relations }: {
        files: Files;
        ignore?: { [key in keyof Files]: (keyof Files[key][number])[]; };
        relations?: { [key in keyof Files]: {
                from: {
                    property: keyof Files[key][number];
                };
                to: {
                    collection: keyof Files;
                    property: string;
                };
            }[]; };
        log?: boolean;
    }) => Promise<void>;
}

export declare type FirebormParams = {
    firestore: Firestore;
    storage: FirebaseStorage;
    functions?: Functions;
};

export declare class FirebormStorage {
    #private;
    readonly path: string;
    constructor({ path, folder }: FirebormStorageParameters);
    init: (storage?: FirebaseStorage) => void;
    get ref(): StorageReference;
    getFileRef: (name: string) => StorageReference;
    upload: (name: string, file: File) => Promise<string>;
    download: (name: string) => Promise<string>;
    remove: (name: string) => Promise<void>;
    list: () => Promise<ListResult>;
}

export declare type FirebormStorageParameters = {
    path: string;
    folder: string;
};

export declare class FirebormStore<DocType extends DocumentData = DocumentData, ModelType extends object = DocType, CreateType extends object = ModelType, DefaultType extends object = ModelType> {
    #private;
    readonly path: string;
    readonly plural: string;
    readonly singular: string;
    readonly defaultData: DefaultType;
    readonly deleteOnUndefined: (keyof DocType)[];
    init: (firestore?: Firestore) => void;
    get ref(): CollectionReference<ModelType, DocType>;
    constructor({ path, plural, singular, defaultData, deleteOnUndefined, toDocument, toModel, onError }: FirebormStoreParameters<DocType, ModelType, CreateType, DefaultType>);
    onError: (error: Error) => void;
    docRef: (id?: string) => DocumentReference<ModelType, DocType>;
    find: (id: string) => Promise<ModelType | undefined>;
    query: ({ where: wc, offset, limit: l, order, direction }: {
        where?: Where<DocType>;
        offset?: number;
        order?: keyof DocType;
        direction?: OrderByDirection;
        limit?: number;
    }) => Promise<ModelType[]>;
    count: (...where: QueryConstraint[]) => Promise<number>;
    exists: (id: string) => Promise<boolean>;
    save: (id: string, data: UpdateData<ModelType>) => Promise<void>;
    relate: (id: string, ref: DocumentReference, property: keyof PickByType<ModelType, DocumentReference[] | DocumentReference>) => Promise<void>;
    unrelate: (id: string, ref: DocumentReference, property: keyof PickByType<ModelType, DocumentReference[] | DocumentReference>) => Promise<void>;
    create: (data: WithFieldValue<CreateType & {
        id?: string;
    }>) => Promise<DocumentReference<ModelType, DocType>>;
    destroy: (id: string) => Promise<void>;
    subscribe: (id: string, { onChange }: {
        onChange: (data?: ModelType) => any;
    }) => Unsubscribe;
    subscribeMany: ({ onChange, where }: {
        onChange: (data: ModelType[]) => any;
        where: QueryConstraint[];
    }) => Unsubscribe;
    toModel: (doc: QueryDocumentSnapshot_2<any, any>) => any;
    toDocument: (model: any) => any;
}

export declare type FirebormStoreParameters<DocType extends DocumentData = DocumentData, ModelType extends object = DocType, CreateType extends object = ModelType, DefaultType extends object = ModelType> = {
    path: string;
    plural: string;
    singular: string;
    defaultData: DefaultType;
    deleteOnUndefined?: (keyof PickOptionals<DocType>)[];
    onError?: (error: Error) => void;
    toModel?: FSConverter<DocType, ModelType>['fromFirestore'];
    toDocument?: FSConverter<DocType, ModelType>['toFirestore'];
};

export declare type FSConverter<D extends DocumentData = DocumentData, M extends D | DocumentData = D> = {
    toFirestore: (model: M) => D;
    fromFirestore: (doc: QueryDocumentSnapshot<D, D>) => M;
};

/** Modifies the properties of the first type,
 * overwriting them with the properties of the second type second object
 **/
export declare type Modify<Base, Mods extends {
    [k in keyof Base]?: any;
}> = Omit<Base, keyof Mods> & Mods;

export declare type NullByKey<T extends Record<string, any>, X extends keyof T> = {
    [K in keyof T]: K extends X ? T[K] | null : T[K];
};

/** Returns the base type with all optional keys extending to null too */
export declare type NullOptionals<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends infer U ? U extends undefined ? T[K] | null : T[K] : T[K];
};

/** Make only some properties optional */
export declare type Optional<Base, K extends keyof Base> = Pick<Partial<Base>, K> & Omit<Base, K>;

/** Return keys that match type */
export declare type PickByType<T extends Record<string, any>, V> = {
    [K in keyof T as T[K] extends infer U ? U extends V ? K : never : never]: T[K];
};

/** Return keys that match type strictly */
export declare type PickByTypeStrict<T extends Record<string, any>, V> = {
    [K in keyof T as T[K] extends V ? K : never]: T[K];
};

/** Returns a new type with only the optional keys of the given type */
export declare type PickOptionals<T extends Record<string, any>> = PickByType<T, undefined>;

/** Make only some properties not optional */
export declare type Prioritize<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;

declare type Where<T> = [
keyof T extends string ? keyof T | FieldPath : FieldPath,
WhereFilterOp,
unknown
][];

export declare type WithID<T> = T & {
    id: string;
};

export declare type WithRef<T, Ref extends DocumentReference> = T & {
    _ref: Ref;
};

export { }
