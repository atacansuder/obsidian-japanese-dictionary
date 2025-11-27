import { isJapanese } from "./utils";

export function handleHover(evt: MouseEvent) {
	const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
	if (!range) return;

	let node = range.startContainer;
	let offset = range.startOffset;

	// We check for RUBY tags to handle furigana correctly, because the first kanji inside ruby tags are not detected
	if (
		node.nodeType === Node.TEXT_NODE &&
		node.parentElement?.tagName === "RUBY"
	) {
		const rubyElem = node.parentElement;
		const cleanText = getRubyBaseText(rubyElem);
		runScanner(cleanText, 0);
		return;
	}

	if (node.nodeType === Node.TEXT_NODE) {
		const fullText = node.textContent || "";
		runScanner(fullText, offset);
	}
}

function getRubyBaseText(rubyElem: HTMLElement): string {
	let text = "";

	rubyElem.childNodes.forEach((child) => {
		if (child.nodeType === Node.TEXT_NODE) {
			text += child.textContent;
		} else if (child.nodeType === Node.ELEMENT_NODE) {
			const tagName = (child as HTMLElement).tagName;
			if (tagName !== "RT" && tagName !== "RP") {
				text += child.textContent;
			}
		}
	});

	return text;
}

function runScanner(text: string, startOffset: number) {
	const limit = 20;
	const textToScan = text.substring(startOffset, startOffset + limit);

	if (isJapanese(textToScan)) {
		console.log("Scanner sees:", textToScan);
	}
}
