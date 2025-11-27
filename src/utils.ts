export function isJapanese(text: string) {
	// Unicode ranges for Hiragana, Katakana, and Kanji
	const output = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
	return output.test(text.charAt(0));
}
