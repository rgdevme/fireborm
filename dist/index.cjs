"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _ref, _ref2, _wrap, wrap_fn, _firestore;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const functions = require("firebase/functions");
const storage = require("firebase/storage");
const firestore = require("firebase/firestore");
class FirebormCallables {
  constructor(functions$1, functionsNames, options) {
    __publicField(this, "callables", {});
    functionsNames.forEach((name) => {
      this.callables[name] = async (params) => {
        try {
          const { data } = await functions.httpsCallable(
            functions$1,
            name
          )(params);
          return data;
        } catch (e) {
          const err = e;
          if (options == null ? void 0 : options.onError)
            options.onError(err);
          else
            console.error({
              cause: err.cause,
              code: err.code,
              customData: err.customData,
              details: err.details,
              message: err.message,
              name: err.name,
              stack: err.stack
            });
          return err;
        }
      };
    });
  }
}
class FirebormStorage {
  constructor({ path, folder }) {
    __publicField(this, "path");
    __privateAdd(this, _ref, void 0);
    __publicField(this, "init", (storage$1) => {
      if (__privateGet(this, _ref))
        throw new Error("Bucket has been initialized already");
      __privateSet(this, _ref, storage.ref(storage$1, this.path));
    });
    __publicField(this, "getFileRef", (name) => storage.ref(this.ref, name));
    __publicField(this, "upload", async (name, file) => {
      const fileref = this.getFileRef(name);
      const { ref: ref2 } = await storage.uploadBytes(fileref, file);
      return storage.getDownloadURL(ref2);
    });
    __publicField(this, "download", async (name) => {
      const fileref = this.getFileRef(name);
      return storage.getDownloadURL(fileref);
    });
    __publicField(this, "remove", async (name) => {
      const fileref = this.getFileRef(name);
      return storage.deleteObject(fileref);
    });
    __publicField(this, "list", async () => storage.listAll(this.ref));
    this.path = `${path}/${folder}`;
  }
  get ref() {
    if (!__privateGet(this, _ref))
      throw new Error("Bucket hasn't been initialized");
    return __privateGet(this, _ref);
  }
}
_ref = new WeakMap();
const defaultConverter = () => ({
  toFirestore: (model) => model,
  fromFirestore: (doc) => doc.data()
});
class FirebormStore {
  constructor({
    path,
    plural,
    singular,
    defaultData,
    deleteOnUndefined,
    toDocument,
    toModel,
    onError
  }) {
    __privateAdd(this, _wrap);
    __publicField(this, "path");
    __publicField(this, "plural");
    __publicField(this, "singular");
    __publicField(this, "defaultData");
    __publicField(this, "deleteOnUndefined", []);
    __privateAdd(this, _ref2, void 0);
    __publicField(this, "init", (firestore$1) => {
      if (__privateGet(this, _ref2))
        throw new Error("Store has been initialized already");
      __privateSet(this, _ref2, firestore.collection(firestore$1, this.path).withConverter({
        fromFirestore: this.toModel,
        toFirestore: this.toDocument
      }));
    });
    __publicField(this, "onError", console.error);
    __publicField(this, "docRef", (id) => {
      if (!this.ref)
        throw new Error("Collection ref isn't defined");
      if (id)
        return firestore.doc(this.ref, id);
      return firestore.doc(this.ref);
    });
    __publicField(this, "find", (id) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, async () => {
        const document = await firestore.getDoc(this.docRef(id));
        return document.data();
      });
    });
    __publicField(this, "query", async ({
      where: wc,
      offset,
      limit: l,
      order,
      direction = "asc"
    }) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, async () => {
        const w = wc.map((c) => firestore.where(...c));
        if (order !== void 0)
          w.push(firestore.orderBy(order, direction));
        if (offset !== void 0)
          w.push(firestore.startAt(offset));
        if (l !== void 0)
          w.push(firestore.limit(l));
        const q = firestore.query(this.ref, ...w);
        const snapshot = await firestore.getDocs(q);
        const result = snapshot.docs.map((d) => d.data());
        return result;
      });
    });
    __publicField(this, "count", async (...where2) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, async () => {
        const q = firestore.query(this.ref, ...where2);
        const { data } = await firestore.getCountFromServer(q);
        return data().count;
      });
    });
    __publicField(this, "exists", async (id) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, async () => {
        const document = await firestore.getDoc(this.docRef(id));
        return document.exists();
      });
    });
    __publicField(this, "save", async (id, data) => {
      const upd = {};
      for (const key in data) {
        const value = data[key];
        const isDeletable = this.deleteOnUndefined.includes(key);
        const isUndefined = value === void 0;
        if (isDeletable && isUndefined) {
          upd[key] = firestore.deleteField();
        } else {
          upd[key] = value;
        }
      }
      return __privateMethod(this, _wrap, wrap_fn).call(this, firestore.setDoc(this.docRef(id), upd, { merge: true }));
    });
    __publicField(this, "relate", async (id, ref, property) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, firestore.updateDoc(this.docRef(id), {
        [property]: firestore.arrayUnion(ref)
      }));
    });
    __publicField(this, "unrelate", async (id, ref, property) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, firestore.updateDoc(this.docRef(id), {
        [property]: firestore.arrayRemove(ref)
      }));
    });
    __publicField(this, "create", (data) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, async () => {
        const upd = { ...this.defaultData, ...data };
        if (data.id === void 0)
          return firestore.addDoc(this.ref, upd);
        const newdocref = this.docRef(data.id);
        await firestore.setDoc(newdocref, upd);
        return newdocref;
      });
    });
    __publicField(this, "destroy", async (id) => {
      return __privateMethod(this, _wrap, wrap_fn).call(this, firestore.deleteDoc(this.docRef(id)));
    });
    __publicField(this, "subscribe", (id, { onChange }) => firestore.onSnapshot(firestore.doc(this.ref, id), (d) => onChange(d.data())));
    __publicField(this, "subscribeMany", ({
      onChange,
      where: where2
    }) => firestore.onSnapshot(
      firestore.query(this.ref, ...where2),
      (d) => onChange(d.docs.map((x) => x.data()))
    ));
    __publicField(this, "toModel", defaultConverter().fromFirestore);
    __publicField(this, "toDocument", defaultConverter().toFirestore);
    this.path = path;
    this.plural = plural;
    this.singular = singular;
    this.defaultData = defaultData;
    if (deleteOnUndefined)
      this.deleteOnUndefined = deleteOnUndefined;
    if (onError)
      this.onError = onError;
    if (toModel)
      this.toModel = toModel;
    if (toDocument)
      this.toDocument = toDocument;
  }
  get ref() {
    if (!__privateGet(this, _ref2))
      throw new Error("Store hasn't been initialized");
    return __privateGet(this, _ref2);
  }
}
_ref2 = new WeakMap();
_wrap = new WeakSet();
wrap_fn = function(f) {
  try {
    return f instanceof Promise ? f : f();
  } catch (error) {
    this.onError(error);
    throw error;
  }
};
class FirebormDataManager {
  constructor(firestore2) {
    __privateAdd(this, _firestore, void 0);
    __publicField(this, "import", async ({
      files,
      ignore,
      relations
    }) => {
      const unprocessedRecords = await Promise.all(
        Object.entries(files).map(([key, data]) => {
          return data.map((object) => {
            return {
              collection: key,
              ref: firestore.doc(firestore.collection(__privateGet(this, _firestore), key)),
              object
            };
          });
        })
      );
      const records = [];
      unprocessedRecords.flat().forEach(({ ref, object, collection: collection2 }, i, a) => {
        var _a;
        const data = object;
        (_a = relations == null ? void 0 : relations[collection2]) == null ? void 0 : _a.forEach(({ from, to }) => {
          const originValue = data[from.property];
          const originIsArray = Array.isArray(originValue);
          let update;
          if (originIsArray) {
            const newVal = originValue;
            const targets = a.filter((x) => {
              const isFromCollection = x.collection === to.collection;
              let hasValue = false;
              const targetValue = x.object[to.property];
              const targetIsArray = Array.isArray(targetValue);
              if (!targetIsArray) {
                hasValue = originValue == null ? void 0 : originValue.includes(targetValue == null ? void 0 : targetValue.toString());
              } else {
                hasValue = originValue.some(
                  (y) => targetValue == null ? void 0 : targetValue.includes(y == null ? void 0 : y.toString())
                );
              }
              return isFromCollection && hasValue;
            });
            targets.forEach((t) => {
              const targetValue = t.object[to.property];
              const targetIsArray = Array.isArray(targetValue);
              if (!targetIsArray) {
                const i2 = newVal.indexOf(targetValue.toString());
                newVal.splice(i2, 1, t.ref);
              } else {
                targetValue.forEach((v) => {
                  const i2 = newVal.indexOf(v.toString());
                  newVal.splice(i2, 1, t.ref);
                });
              }
            });
            update = newVal;
          } else {
            let newVal = originValue;
            const target = a.find((x) => {
              const isFromCollection = x.collection === to.collection;
              let hasValue = false;
              const targetValue = x.object[to.property];
              const targetIsArray = Array.isArray(targetValue);
              if (!targetIsArray)
                hasValue = originValue.toString() === targetValue.toString();
              else
                hasValue = targetValue.includes(originValue.toString());
              return isFromCollection && hasValue;
            });
            if (!target)
              return;
            newVal = target.ref;
            update = newVal;
          }
          data[from.property] = update;
        });
        records.push({ ref, data, collection: collection2 });
      });
      const batch = firestore.writeBatch(__privateGet(this, _firestore));
      records.forEach(({ ref, data, collection: collection2 }) => {
        var _a;
        for (const key in data) {
          if ((_a = ignore == null ? void 0 : ignore[collection2]) == null ? void 0 : _a.includes(key)) {
            delete data[key];
          }
        }
        batch.set(ref, data);
      });
      await batch.commit();
    });
    __privateSet(this, _firestore, firestore2);
  }
}
_firestore = new WeakMap();
const FireBorm = ({
  firestore: firestore2,
  storage: fbstorage,
  functions: functions2
}) => {
  return {
    initializeStore: (options) => {
      const store = new FirebormStore(options);
      store.init(firestore2);
      return store;
    },
    initializeStorage: (options) => {
      const storage2 = new FirebormStorage(options);
      storage2.init(fbstorage);
      return storage2;
    },
    initializeCallables: (functionNames) => {
      if (!functions2)
        throw new Error("Functions hasn't been provided");
      const callables = new FirebormCallables(functions2, functionNames);
      return callables.callables;
    },
    initializeDataManager: () => {
      return new FirebormDataManager(firestore2);
    }
  };
};
exports.FireBorm = FireBorm;
