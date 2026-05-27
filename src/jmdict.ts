import { StructuredContent } from "./types";

// Taken from https://github.com/yomidevs/yomitan-import/blob/main/jmdict_constants.go
const JMDICT_FORMS_SYMBOL_TITLES: Record<string, string> = {
	"\u2605": "high priority form",
	"\ud83c\udd41": "rare form",
	R: "rarely-used kanji form",
	r: "rarely-used kana form",
	"\u26a0": "irregular form",
	"\u26a0\ufe0f": "irregular form",
	"\u26ec": "outdated form",
	"\u3292": "valid form",
};

export function isJmdictFormsTable(content: StructuredContent): boolean {
	return content.tag === "table" && content.data?.content === "formsTable";
}

export function getJmdictFormsSymbolTitle(symbol: string): string {
	const title = JMDICT_FORMS_SYMBOL_TITLES[symbol];
	if (title) return title;

	const titles = symbol
		.split("|")
		.map((part) => JMDICT_FORMS_SYMBOL_TITLES[part.trim()])
		.filter((partTitle): partTitle is string => Boolean(partTitle));

	return titles.length > 0 ? titles.join("; ") : "";
}

export function getJmdictFormsListSymbol(
	text: string,
): { text: string; symbolText: string; title: string } | null {
	const match = text.match(/^(.*?)(（(.+)）)$/u);
	if (!match) return null;

	const title = getJmdictFormsSymbolTitle(match[3].trim());
	if (!title) return null;

	return {
		text: match[1],
		symbolText: match[2],
		title,
	};
}
