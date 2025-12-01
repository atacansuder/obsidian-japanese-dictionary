type LanguageOption = {
	label: string;
	code: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
	{ label: "English", code: "eng" },
	{ label: "Dutch", code: "dut" },
	{ label: "French", code: "fre" },
	{ label: "German", code: "ger" },
	{ label: "Hungarian", code: "hun" },
	{ label: "Russian", code: "rus" },
	{ label: "Slovene", code: "slv" },
	{ label: "Spanish", code: "spa" },
	{ label: "Swedish", code: "swe" },
];

export interface JMDictGloss {
	lang: string;
	gender: string | null;
	type: string | null;
	text: string;
}

export interface JMDictSense {
	partOfSpeech: string[];
	appliesToKanji: string[];
	appliesToKana: string[];
	related: Array<[string, number?]>;
	antonym: string[];
	field: string[];
	dialect: string[];
	misc: string[];
	info: string[];
	languageSource: any[];
	gloss: JMDictGloss[];
}

export interface JMDictKana {
	common: boolean;
	text: string;
	tags: string[];
	appliesToKanji: string[];
}

export interface JMDictKanji {
	common: boolean;
	text: string;
	tags: string[];
}

export interface JMDictWord {
	id: string;
	kanji: JMDictKanji[];
	kana: JMDictKana[];
	sense: JMDictSense[];
}

export interface DictionaryData {
	dictDate: string;
	languages: string[];
	version: string;
	words: JMDictWord[];
}

export enum TriggerKeys {
	None = "None",
	Ctrl = "Ctrl",
	Alt = "Alt",
	Shift = "Shift",
}
