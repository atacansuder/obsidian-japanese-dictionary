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
		}, 150);
	};

	private performScan(evt: MouseEvent) {
		const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
		if (!range) return;

		let node = range.startContainer;
		let offset = range.startOffset;

		// Handle RUBY tags
		if (
			node.nodeType === Node.TEXT_NODE &&
			node.parentElement?.tagName === "RUBY"
		) {
			const rubyElem = node.parentElement;
			const cleanText = this.getRubyBaseText(rubyElem);
			this.runScanner(cleanText, 0);
			return;
		}

		if (node.nodeType === Node.TEXT_NODE) {
			const fullText = node.textContent || "";
			this.runScanner(fullText, offset);
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

	private runScanner(text: string, startOffset: number) {
		const limit = 20;
		const textToScan = text.substring(startOffset, startOffset + limit);

		if (this.lastScannedText === textToScan) return;

		if (isJapanese(textToScan)) {
			this.lastScannedText = textToScan;
			console.log("Scanner sees:", textToScan);
			console.log("My setting is:", this.plugin.settings.mySetting);

			// TODO: this.showPopup(textToScan);
		}
	}
}
