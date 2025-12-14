import { DBSchema } from "idb";

export enum TriggerKeys {
	None = "None",
	Ctrl = "Ctrl",
	Alt = "Alt",
	Shift = "Shift",
}

export interface YomitanIndex {
	title: string;
	format: number;
	revision: string;
	sequenced: boolean;
	author: string;
	url: string;
	description: string;
	attribution: string;
}

// Yomitan stores terms as an array: [expression, reading, tags, rules, score, ...glossary]
// This is the raw format found in term_bank_*.json
export type RawTermEntry = [
	string, // 0: expression (kanji or kana)
	string, // 1: reading (kana)
	string, // 2: definition tags (space separated)
	string, // 3: rules (space separated)
	number, // 4: popularity/score
	...RawDefinition[] // 5+: glossary definitions
];

export interface StructuredContent {
	content: string | StructuredContent | (string | StructuredContent)[];
	tag?: string;
	lang?: string;
	style?: Record<string, string>;
	data?: Record<string, string>;
	type?: string;
}

export type RawDefinition = string | StructuredContent;

export interface ProcessedTerm {
	expression: string;
	reading: string;
	tags: string[];
	rules: string[];
	score: number;
	glossary: RawDefinition[];
	dictionary: string; // To know which dict it came from
}

export interface YomitanDB extends DBSchema {
	terms: {
		key: number;
		value: ProcessedTerm;
		indexes: {
			expression: string;
			reading: string;
		};
	};
	dictionaries: {
		key: string; // dictionary title
		value: YomitanIndex;
	};
}
