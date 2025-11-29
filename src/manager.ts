import { openDB, DBSchema, IDBPDatabase } from "idb";
import { JMDictKana, JMDictKanji, JMDictSense, JMDictWord } from "./types";

export interface JMDictDB extends DBSchema {
	entries: {
		key: string;
		value: {
			id: string;
			kanji: string[];
			kana: string[];
			kanjiData: JMDictKanji[];
			kanaData: JMDictKana[];
			sense: JMDictSense[];
		};
		indexes: {
			kanji: string;
			kana: string;
		};
	};
	metadata: {
		key: string;
		value: {
			key: string;
			value: string;
		};
	};
}

export class DictionaryManager {
	private db: IDBPDatabase<JMDictDB> | null = null;

	constructor() {}

	async getDB(): Promise<IDBPDatabase<JMDictDB>> {
		if (this.db) return this.db;

		this.db = await openDB<JMDictDB>("jmdict", 1, {
			upgrade(db) {
				const entryStore = db.createObjectStore("entries", {
					keyPath: "id",
				});
				entryStore.createIndex("kanji", "kanji", { multiEntry: true });
				entryStore.createIndex("kana", "kana", { multiEntry: true });

				db.createObjectStore("metadata", { keyPath: "key" });
			},
		});

		return this.db;
	}

	async lookup(term: string): Promise<JMDictWord[]> {
		const db = await this.getDB();

		const kanjiResults = await db.getAllFromIndex("entries", "kanji", term);
		const kanaResults = await db.getAllFromIndex("entries", "kana", term);

		// Deduplicate results based on ID
		const resultsMap = new Map<string, (typeof kanjiResults)[0]>();
		[...kanjiResults, ...kanaResults].forEach((entry) => {
			resultsMap.set(entry.id, entry);
		});

		console.log(resultsMap);

		return Array.from(resultsMap.values()).map((entry) => ({
			id: entry.id,
			kanji: entry.kanjiData,
			kana: entry.kanaData,
			sense: entry.sense,
		}));
	}
}
