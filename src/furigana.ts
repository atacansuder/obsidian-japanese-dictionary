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
	const segments = alignBlocks(blocks, reading, normalizedReading, 0, 0);

	return segments ?? [{ text: expression, reading }];
}

function alignBlocks(
	blocks: ExpressionBlock[],
	reading: string,
	normalizedReading: string,
	blockIndex: number,
	readingIndex: number,
): FuriganaSegment[] | null {
	if (blockIndex === blocks.length) {
		return readingIndex === reading.length ? [] : null;
	}

	const block = blocks[blockIndex];

	if (!block.isKanji) {
		const normalizedText = normalizeKana(block.text);
		if (!normalizedReading.startsWith(normalizedText, readingIndex)) {
			return null;
		}

		const rest = alignBlocks(
			blocks,
			reading,
			normalizedReading,
			blockIndex + 1,
			readingIndex + normalizedText.length,
		);

		return rest ? [{ text: block.text }, ...rest] : null;
	}

	for (let endIndex = readingIndex + 1; endIndex <= reading.length; endIndex++) {
		const rest = alignBlocks(
			blocks,
			reading,
			normalizedReading,
			blockIndex + 1,
			endIndex,
		);

		if (rest) {
			return [
				{ text: block.text, reading: reading.slice(readingIndex, endIndex) },
				...rest,
			];
		}
	}

	return null;
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
