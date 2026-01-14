import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ProcessedTerm, YomitanDB } from "./types";
import { Deinflector } from "./deinflector";

export class DictionaryManager {
	private db: IDBPDatabase<YomitanDB> | null = null;
	private deinflector: Deinflector;
	private tagCache: Map<string, string> = new Map();

	constructor() {
		this.deinflector = new Deinflector();
	}

	async getDB(): Promise<IDBPDatabase<YomitanDB>> {
		if (this.db) return this.db;

		this.db = await openDB<YomitanDB>("yomitan-dict", 1, {
			upgrade(db) {
				const termStore = db.createObjectStore("terms", {
					autoIncrement: true,
				});
				termStore.createIndex("expression", "expression", {
					unique: false,
				});
				termStore.createIndex("reading", "reading", { unique: false });

				// Store for metadata about imported dictionaries
				db.createObjectStore("dictionaries", { keyPath: "title" });

				db.createObjectStore("tag_defs", { keyPath: "name" });
			},
		});

		return this.db;
	}

	async lookup(text: string): Promise<ProcessedTerm[]> {
		const db = await this.getDB();
		const candidates = this.deinflector.deinflect(text);

		const uniqueResults = new Map<string, ProcessedTerm>();

		for (const candidate of candidates) {
			const term = candidate.term;

			const expressionMatches = await db.getAllFromIndex(
				"terms",
				"expression",
				term
			);
			const readingMatches = await db.getAllFromIndex(
				"terms",
				"reading",
				term
			);

			const rawMatches = [...expressionMatches, ...readingMatches];

			for (const match of rawMatches) {
				if (!this.isValidDeinflection(candidate.rules, match.rules)) {
					continue;
				}
				const signature = `${match.expression}-${
					match.reading
				}-${JSON.stringify(match.glossary)}`;

				if (!uniqueResults.has(signature)) {
					uniqueResults.set(signature, match);
				}
			}
		}

		return Array.from(uniqueResults.values()).sort(
			(a, b) => b.score - a.score
		);
	}

	/**
	 * Validates if the term found in the dictionary is compatible with the required rules set during deinflection.
	 * @param deinflectRules The bitmask required by the deinflection step (0 if none required).
	 * @param termRules The array of rule strings from the dictionary entry (e.g., ["v5r-i", "vi"]).
	 * @returns True if the rules overlap or no rules are required, False otherwise.
	 */
	private isValidDeinflection(
		deinflectRules: number,
		termRules: string[]
	): boolean {
		if (deinflectRules === 0) return true;

		const termRuleFlags = this.deinflector.getRuleFlags(termRules);
		// If the term has no rules but deinflection requires rules, reject
		if (termRuleFlags === 0) return false;

		// Check for overlap, at least one required rule must be present
		return (deinflectRules & termRuleFlags) !== 0;
	}

	async loadTags() {
		if (!this.db) return;
		const tx = this.db.transaction("tag_defs", "readonly");
		const store = tx.objectStore("tag_defs");
		let cursor = await store.openCursor();

		while (cursor) {
			this.tagCache.set(cursor.value.name, cursor.value.description);
			cursor = await cursor.continue();
		}
	}

	getTagDescription(tagName: string): string {
		return this.tagCache.get(tagName) || "";
	}
}
