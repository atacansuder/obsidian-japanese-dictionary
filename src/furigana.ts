interface ExpressionBlock {
	text: string;
	isKanji: boolean;
}

export interface FuriganaSegment {
	text: string;
	reading?: string;
}

export function getFuriganaSegments(
	expression: string,
	reading: string,
): FuriganaSegment[] {
	if (expression === reading || reading === "" || !containsKanji(expression)) {
		return [{ text: expression }];
	}

	const blocks = getExpressionBlocks(expression);
	const normalizedReading = normalizeKana(reading);
	let readingIndex = 0;

	return blocks.map((block, index) => {
		if (!block.isKanji) {
			const normalizedText = normalizeKana(block.text);
			if (normalizedReading.startsWith(normalizedText, readingIndex)) {
				readingIndex += normalizedText.length;
			} else {
				const matchIndex = normalizedReading.indexOf(
					normalizedText,
					readingIndex,
				);
				if (matchIndex !== -1) {
					readingIndex = matchIndex + normalizedText.length;
				}
			}

			return { text: block.text };
		}

		const nextKanaBlock = blocks
			.slice(index + 1)
			.find((nextBlock) => !nextBlock.isKanji);

		let blockReading: string;
		if (nextKanaBlock) {
			const normalizedAnchor = normalizeKana(nextKanaBlock.text);
			const anchorIndex = normalizedReading.indexOf(
				normalizedAnchor,
				readingIndex,
			);

			if (anchorIndex === -1) {
				blockReading = reading.slice(readingIndex);
				readingIndex = reading.length;
			} else {
				blockReading = reading.slice(readingIndex, anchorIndex);
				readingIndex = anchorIndex;
			}
		} else {
			blockReading = reading.slice(readingIndex);
			readingIndex = reading.length;
		}

		return blockReading === ""
			? { text: block.text }
			: { text: block.text, reading: blockReading };
	});
}

function getExpressionBlocks(expression: string): ExpressionBlock[] {
	const blocks: ExpressionBlock[] = [];

	Array.from(expression).forEach((char) => {
		const isKanji = isKanjiCharacter(char);
		const previousBlock = blocks[blocks.length - 1];

		if (previousBlock && previousBlock.isKanji === isKanji) {
			previousBlock.text += char;
		} else {
			blocks.push({ text: char, isKanji });
		}
	});

	return blocks;
}

function containsKanji(text: string): boolean {
	return Array.from(text).some((char) => isKanjiCharacter(char));
}

function isKanjiCharacter(char: string): boolean {
	const codePoint = char.codePointAt(0);
	if (codePoint === undefined) return false;

	return (
		(codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
		(codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
		(codePoint >= 0xf900 && codePoint <= 0xfaff) ||
		(codePoint >= 0x20000 && codePoint <= 0x2a6df) ||
		(codePoint >= 0x2a700 && codePoint <= 0x2b73f) ||
		(codePoint >= 0x2b740 && codePoint <= 0x2b81f) ||
		(codePoint >= 0x2b820 && codePoint <= 0x2ceaf) ||
		(codePoint >= 0x2ceb0 && codePoint <= 0x2ebef) ||
		(codePoint >= 0x30000 && codePoint <= 0x323af)
	);
}

function normalizeKana(text: string): string {
	return Array.from(text)
		.map((char) => {
			const codePoint = char.codePointAt(0);
			if (
				codePoint !== undefined &&
				codePoint >= 0x30a1 &&
				codePoint <= 0x30f6
			) {
				return String.fromCharCode(codePoint - 0x60);
			}

			return char;
		})
		.join("");
}
