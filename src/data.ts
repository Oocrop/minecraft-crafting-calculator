export enum DataEvents {
	ANY,

	ANY_MATERIAL,
	MATERIAL_ADDED,
	MATERIAL_EDITED,
	MATERIAL_REMOVED,

	ANY_RECIPE,
	RECIPE_ADDED,
	RECIPE_EDITED,
	RECIPE_REMOVED,
}

class DataEvent extends Event {
	// eslint-disable-next-line no-useless-constructor
	constructor(type: DataEvents, ...args: any[]) {
		super(type.toString(), ...args);
	}
}

function idbPromisify<T>(
	req: IDBRequest<T>,
	upgrade?: (ev: IDBVersionChangeEvent) => void,
): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onerror = reject;
		req.onsuccess = () => resolve(req.result);
		if (upgrade) (req as any).onupgradeneeded = upgrade;
	});
}

interface IDBSchemedTransaction<T> extends IDBTransaction {
	objectStore<K extends keyof T & string>(
		name: K,
	): IDBSchemedObjectStore<T[K]>;
}

/* eslint-disable no-mixed-spaces-and-tabs */
interface SchemedIDB<T> extends IDBDatabase {
	createObjectStore<
		K extends keyof T & string,
		KK extends keyof T[K] & string,
	>(
		name: K,
		options?:
			| {
					autoIncrement?: boolean;
					keyPath?: KK | KK[] | null;
			  }
			| undefined,
	): IDBSchemedObjectStore<T[K]>;
	transaction<K extends keyof T & string>(
		storeNames: K,
		mode?: IDBTransactionMode | undefined,
		options?: IDBTransactionOptions | undefined,
	): IDBSchemedTransaction<Pick<T, K>>;
	transaction<K extends keyof T & string>(
		storeNames: K[],
		mode?: IDBTransactionMode | undefined,
		options?: IDBTransactionOptions | undefined,
	): IDBSchemedTransaction<Pick<T, K>>;
}
/* eslint-enable no-mixed-spaces-and-tabs */
interface IDBSchemedIndex<T> extends IDBIndex {
	get(query: IDBValidKey | IDBKeyRange): IDBRequest<T>;
	getAll(
		query?: IDBValidKey | IDBKeyRange,
		count?: number,
	): IDBRequest<T[]>;
}
interface IDBSchemedObjectStore<T> extends IDBObjectStore {
	add(value: T, key?: IDBValidKey): IDBRequest<IDBValidKey>;
	get(query: IDBValidKey | IDBKeyRange): IDBRequest<T>;
	getAll(
		query?: IDBValidKey | IDBKeyRange,
		count?: number,
	): IDBRequest<T[]>;
	put(value: T, key?: IDBValidKey): IDBRequest<IDBValidKey>;
	index(key: keyof T & string): IDBSchemedIndex<T>;

	createIndex<K extends keyof T & string>(
		name: K,
		keyPath: K,
		options?: IDBIndexParameters | undefined,
	): IDBSchemedIndex<T>;
}

type DBType = SchemedIDB<{
	materials: IMaterial;
	recipes: IRecipe;
	images: {
		material: string;
		data: string;
	};
}>;

export const DataProvider = new (class extends EventTarget {
	db?: DBType;
	dbPromise?: Promise<DBType>;

	constructor() {
		super();
		this.dbPromise = idbPromisify<IDBDatabase>(
			indexedDB.open("MCRecipes", 1),
			(e) => {
				const db = (e.target as IDBRequest<IDBDatabase>)
					.result as DBType;
				const materialStore = db.createObjectStore("materials", {
					keyPath: "name",
				});
				materialStore.createIndex("name", "name", { unique: true });
				const recipeStore = db.createObjectStore("recipes", {
					keyPath: "resultItem",
				});
				recipeStore.createIndex("resultItem", "resultItem", {
					unique: true,
				});
				recipeStore.createIndex("type", "type", { unique: false });
				const imageStore = db.createObjectStore("images", {
					keyPath: "material",
				});
				imageStore.createIndex("material", "material", {
					unique: true,
				});
			},
		).then((db) => {
			this.db = db;
			return db;
		});
	}

	async getMaterialStore() {
		if (!this.db) await this.dbPromise;
		return this.db
			?.transaction("materials", "readwrite")
			.objectStore("materials");
	}

	async getRecipeStore() {
		if (!this.db) await this.dbPromise;
		return this.db
			?.transaction("recipes", "readwrite")
			.objectStore("recipes");
	}

	async getImageStore() {
		if (!this.db) await this.dbPromise;
		return this.db
			?.transaction("images", "readwrite")
			.objectStore("images");
	}

	async getMaterials() {
		return idbPromisify((await this.getMaterialStore())!.getAll());
	}

	async addMaterial(material: IMaterial) {
		(await this.getMaterialStore())?.add(material);
		this.emit(DataEvents.MATERIAL_ADDED);
	}

	async editMaterial(material: IMaterial) {
		(await this.getMaterialStore())?.put(material);
		this.emit(DataEvents.MATERIAL_EDITED);
	}

	async removeMaterial(material: string) {
		(await this.getMaterialStore())?.delete(material);
		this.removeRecipe(material);
		this.removeImage(material);
		this.emit(DataEvents.MATERIAL_REMOVED);
	}

	async getMaterial(name: string) {
		try {
			return idbPromisify(
				(await this.getMaterialStore())!.index("name").get(name),
			);
		} catch {
			return null;
		}
	}

	async getRecipes() {
		return idbPromisify((await this.getMaterialStore())!.getAll());
	}

	async addRecipe(recipe: IRecipe) {
		(await this.getRecipeStore())?.add(recipe);
		this.emit(DataEvents.RECIPE_ADDED);
	}

	async editRecipe(recipe: IRecipe) {
		(await this.getRecipeStore())?.put(recipe);
		this.emit(DataEvents.RECIPE_EDITED);
	}

	async removeRecipe(recipe: string) {
		(await this.getRecipeStore())?.delete(recipe);
		this.emit(DataEvents.RECIPE_REMOVED);
	}

	async getRecipeFor(material: string) {
		try {
			return idbPromisify(
				(await this.getRecipeStore())!
					.index("resultItem")
					.get(material),
			);
		} catch {
			return null;
		}
	}

	async addImage(material: string, data: string) {
		(await this.getImageStore())?.add({ data, material });
	}

	async editImage(material: string, data: string) {
		(await this.getImageStore())?.put({ data, material });
	}

	async removeImage(recipe: string) {
		(await this.getImageStore())?.delete(recipe);
	}

	async getImageFor(material: string) {
		try {
			return idbPromisify(
				(await this.getImageStore())!.index("material").get(material),
			);
		} catch {
			return null;
		}
	}

	addEventListener(
		type: DataEvents & string,
		callback: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void {
		super.addEventListener(type, callback, options);
	}

	removeEventListener(
		type: DataEvents & string,
		callback: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	): void {
		super.removeEventListener(type, callback, options);
	}

	emit(type: DataEvents) {
		const IS_MATERIAL = type >= 2 && type <= 4;
		const IS_RECIPE = type >= 6 && type <= 8;

		this.dispatchEvent(new DataEvent(type));
		if (IS_MATERIAL)
			this.dispatchEvent(new DataEvent(DataEvents.ANY_MATERIAL));
		else if (IS_RECIPE)
			this.dispatchEvent(new DataEvent(DataEvents.ANY_RECIPE));
		this.dispatchEvent(new DataEvent(DataEvents.ANY));
	}

	dispatchEvent(event: DataEvent): boolean {
		return super.dispatchEvent(event);
	}
})();
