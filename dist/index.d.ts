import { CollectionReference } from 'firebase/firestore';
import { DocumentData } from 'firebase/firestore';
import { DocumentReference } from 'firebase/firestore';
import { FieldPath } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';
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

declare type ConvertedModel<D extends DocumentData, M extends D | DocumentData> = M & {
    id: string;
    _ref: DocumentReference<M, D>;
};

export declare const FireBorm: ({ firestore, storage: fbstorage, functions }: {
    firestore: Firestore;
    storage: FirebaseStorage;
    functions?: Functions;
}) => {
    initializeStore: <D extends DocumentData, M extends Object = D, C extends Object = M, I extends Object = M>(options: ConstructorParameters<typeof FirebormStore<D, M, C, I>>[0]) => FirebormStore<D, M, C, I>;
    initializeStorage: (options: ConstructorParameters<typeof FirebormStorage>[0]) => FirebormStorage;
    initializeCallables: <T extends FirebormCalls>(functionNames: (keyof T)[]) => T;
};

export declare type FirebormCall<P, R> = (params: P) => Promise<R>;

declare type FirebormCalls<P = any, R = any> = Record<string, FirebormCall<P, R>>;

declare class FirebormStorage {
    #private;
    readonly path: string;
    constructor({ path, folder }: {
        path: string;
        folder: string;
    });
    init: (storage: FirebaseStorage) => void;
    get ref(): StorageReference;
    getFileRef: (name: string) => StorageReference;
    upload: (name: string, file: File) => Promise<string>;
    download: (name: string) => Promise<string>;
    remove: (name: string) => Promise<void>;
    list: () => Promise<ListResult>;
}

declare class FirebormStore<DocType extends DocumentData, ModelType extends object = DocType, CreateType extends object = ModelType, DefaultType extends object = ModelType> {
    #private;
    readonly path: string;
    readonly plural: string;
    readonly singular: string;
    readonly defaultData: DefaultType;
    readonly deleteOnUndefined: (keyof DocType)[];
    init: (firestore: Firestore) => void;
    get ref(): CollectionReference<ConvertedModel<DocType, ModelType>, DocType>;
    constructor({ path, plural, singular, defaultData, deleteOnUndefined, toDocument, toModel, onError, }: {
        path: string;
        plural: string;
        singular: string;
        defaultData: DefaultType;
        deleteOnUndefined?: (keyof PickOptionals<DocType>)[];
        onError?: (error: Error) => void;
        toModel?: FSConverter<DocType, ModelType>['fromFirestore'];
        toDocument?: FSConverter<DocType, ModelType>['toFirestore'];
    });
    onError: (error: Error) => void;
    docRef: (id?: string) => DocumentReference<ConvertedModel<DocType, ModelType>, DocType>;
    find: (id: string) => Promise<ConvertedModel<DocType, ModelType> | undefined>;
    query: ({ where: wc, offset, limit, order, direction, }: {
        where: Where<DocType>;
        offset?: number;
        order?: keyof DocType;
        direction?: OrderByDirection;
        limit?: number;
    }) => Promise<ConvertedModel<DocType, ModelType>[]>;
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
        onChange: (data?: ConvertedModel<DocType, ModelType>) => any;
    }) => Unsubscribe;
    subscribeMany: ({ onChange, where, }: {
        onChange: (data: ConvertedModel<DocType, ModelType>[]) => any;
        where: QueryConstraint[];
    }) => Unsubscribe;
    toModel: (doc: QueryDocumentSnapshot_2<DocType, DocType>) => ModelType;
    toDocument: (model: ModelType) => DocType;
}

declare type FSConverter<D extends DocumentData, M extends D | DocumentData> = {
    toFirestore: (model: M) => D;
    fromFirestore: (doc: QueryDocumentSnapshot<D, D>) => M;
};

/** Return keys that match type */
declare type PickByType<T extends Record<string, any>, V> = {
    [K in keyof T as T[K] extends infer U ? (U extends V ? K : never) : never]: T[K];
};

/** Returns a new type with only the optional keys of the given type */
declare type PickOptionals<T extends Record<string, any>> = PickByType<T, undefined>;

declare type Where<T> = [
keyof T extends string ? keyof T | FieldPath : FieldPath,
WhereFilterOp,
unknown
][];

export { }
