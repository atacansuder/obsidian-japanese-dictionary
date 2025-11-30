import { openDB, DBSchema, IDBPDatabase } from "idb";
import { JMDictKana, JMDictKanji, JMDictSense, JMDictWord } from "./types";
import { Deinflector } from "./deinflector";

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
	private deinflector: Deinflector;

	constructor() {
		this.deinflector = new Deinflector();
	}

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

		const candidates = this.deinflector.deinflect(term);
		console.log(candidates);
		const resultsMap = new Map<string, JMDictWord>();

		for (const candidate of candidates) {
			const kanjiResults = await db.getAllFromIndex(
				"entries",
				"kanji",
				candidate.term
			);
			const kanaResults = await db.getAllFromIndex(
				"entries",
				"kana",
				candidate.term
			);

			const entries = [...kanjiResults, ...kanaResults];

			for (const entry of entries) {
				if (resultsMap.has(entry.id)) continue;

				resultsMap.set(entry.id, {
					id: entry.id,
					kanji: entry.kanjiData,
					kana: entry.kanaData,
					sense: entry.sense,
				});
			}
		}

		console.log("Lookup results:", Array.from(resultsMap.values()));

		return Array.from(resultsMap.values());
	}
}
