import { getApp } from 'firebase/app'
import {
	FirebaseStorage,
	StorageReference,
	deleteObject,
	getDownloadURL,
	getStorage,
	listAll,
	ref,
	uploadBytes
} from 'firebase/storage'

export type FirebormStorageParameters = { path: string; folder: string }
export class FirebormStorage {
	readonly path: string
	#ref?: StorageReference

	constructor({ path, folder }: FirebormStorageParameters) {
		this.path = `${path}/${folder}`
	}

	public init = (storage?: FirebaseStorage) => {
		if (!storage) {
			const app = getApp()
			storage = getStorage(app)
		}
		if (this.#ref) throw new Error('Bucket has been initialized already')
		this.#ref = ref(storage, this.path)
	}

	get ref() {
		if (!this.#ref) throw new Error("Bucket hasn't been initialized")
		return this.#ref
	}

	public getFileRef = (name: string) => ref(this.ref, name)

	public upload = async (name: string, file: File) => {
		const fileref = this.getFileRef(name)
		const { ref } = await uploadBytes(fileref, file)
		return getDownloadURL(ref)
	}
	public download = async (name: string) => {
		const fileref = this.getFileRef(name)
		return getDownloadURL(fileref)
	}
	public remove = async (name: string) => {
		const fileref = this.getFileRef(name)
		return deleteObject(fileref)
	}
	public list = async () => listAll(this.ref)
}
