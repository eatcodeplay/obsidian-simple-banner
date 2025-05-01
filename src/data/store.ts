import { BannerData, Datastore } from '../types/interfaces';



const storage = {} as Datastore;

export default class Store {
	static get(id: string): BannerData | null {
		return storage[id] || null;
	}

	static set(id: string, data: BannerData) {
		storage[id] = data;
	}

	static delete(id: string | null = null) {
		if (id) {
			delete storage[id];
		}
	}

	static exists(id: string): boolean {
		return storage[id] !== undefined;
	}

	static getAll(): Datastore {
		return storage;
	}

	static getIds(): string[] {
		return Object.keys(storage);
	}
}
