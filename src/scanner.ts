import { App } from "obsidian";
import JapanesePopupDictionary from "../main";
import { isJapanese } from "./utils";

export class JapaneseScanner {
	plugin: JapanesePopupDictionary;
	app: App;
	lastScannedText: string | null = null;
	timer: number | null = null;

	constructor(plugin: JapanesePopupDictionary) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	handleHover = (evt: MouseEvent) => {
		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = window.setTimeout(() => {
			this.performScan(evt);
		}, 50);
	};

	private async performScan(evt: MouseEvent) {
		const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
		if (!range) {
			this.clearHighlight();
			return;
		}

		let node = range.startContainer;
		let offset = range.startOffset;

		// Make sure we are inside a note
		const parentElement =
			node.nodeType === Node.TEXT_NODE
				? node.parentElement
				: (node as HTMLElement);
		if (
			!parentElement ||
			(!parentElement.closest(".markdown-preview-view") &&
				!parentElement.closest(".markdown-source-view"))
		) {
			this.clearHighlight();
			return;
		}

		// Handle RUBY tags
		// If hovering over RT, ignore it because it's just the pronunciation
		if (
			node.nodeType === Node.TEXT_NODE &&
			node.parentElement?.tagName === "RT"
		) {
			this.clearHighlight();
			return;
		} else if (
			node.nodeType === Node.TEXT_NODE &&
			node.parentElement?.tagName === "RUBY"
		) {
			const rubyElem = node.parentElement;
			const cleanText = this.getRubyBaseText(rubyElem);
			await this.runScanner(node, cleanText, 0);
			return;
		}

		if (node.nodeType === Node.TEXT_NODE) {
			const fullText = node.textContent || "";
			await this.runScanner(node, fullText, offset);
		}
	}

	private getRubyBaseText(rubyElem: HTMLElement): string {
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

	private async runScanner(node: Node, text: string, startOffset: number) {
		const limit = 20;
		const textToScan = text.substring(startOffset, startOffset + limit);
		const endOffset = Math.min(startOffset + limit, text.length);

		if (this.lastScannedText === textToScan) return;

		if (isJapanese(textToScan)) {
			this.lastScannedText = textToScan;
			console.log("Scanner sees:", textToScan);

			this.highlightText(node, startOffset, endOffset);
			const wordData = await this.plugin.dictionaryManager.lookup(
				textToScan
			);
			// TODO: this.showPopup(textToScan);
		} else {
			this.clearHighlight();
		}
	}

	private highlightText(node: Node, startOffset: number, endOffset: number) {
		if (!node.isConnected) return;

		const range = new Range();
		range.setStart(node, startOffset);
		range.setEnd(node, endOffset);

		const highlight = new Highlight(range);
		CSS.highlights.set("japanese-highlight", highlight);
	}

	private clearHighlight() {
		CSS.highlights.delete("japanese-highlight");
		this.lastScannedText = null;
	}
}
