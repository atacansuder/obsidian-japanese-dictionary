import { App } from "obsidian";
import JapanesePopupDictionary from "../main";
import { isJapanese } from "./utils";
import { ProcessedTerm, TriggerKeys } from "./types";
import { PopupManager } from "./popup";

export class JapaneseScanner {
	plugin: JapanesePopupDictionary;
	app: App;
	currentHighlightRange: Range | null = null;
	timer: number | null = null;
	popupManager: PopupManager;

	constructor(plugin: JapanesePopupDictionary, popupManager: PopupManager) {
		this.plugin = plugin;
		this.app = plugin.app;
		this.popupManager = popupManager;
	}

	handleHover = (evt: MouseEvent) => {
		const trigger = this.plugin.settings.triggerKey;
		const isModifierHeld =
			trigger === TriggerKeys.None ||
			(trigger === TriggerKeys.Ctrl && evt.ctrlKey) ||
			(trigger === TriggerKeys.Alt && evt.altKey) ||
			(trigger === TriggerKeys.Shift && evt.shiftKey);

		const isDictionaryOn = this.plugin.settings.isDictionaryOn;

		const shouldScan = isModifierHeld && isDictionaryOn;

		if (!shouldScan) {
			return;
		}

		if (this.currentHighlightRange) {
			const rects = this.currentHighlightRange.getClientRects();
			let isHoveringHighlight = false;

			for (let i = 0; i < rects.length; i++) {
				const rect = rects[i];
				if (
					evt.clientX >= rect.left &&
					evt.clientX <= rect.right &&
					evt.clientY >= rect.top &&
					evt.clientY <= rect.bottom
				) {
					isHoveringHighlight = true;
					break;
				}
			}

			if (isHoveringHighlight) {
				return;
			}
		}

		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = window.setTimeout(() => {
			this.performScan(evt);
		}, 100);
	};

	private performScan(evt: MouseEvent) {
		const caretPos = this.getCaretPosition(evt.clientX, evt.clientY);
		if (!caretPos) {
			return;
		}

		let node = caretPos.node;
		let offset = caretPos.offset;

		if (this.currentHighlightRange) {
			const isAtEndBoundary =
				node === this.currentHighlightRange.endContainer &&
				offset === this.currentHighlightRange.endOffset;

			if (
				this.currentHighlightRange.isPointInRange(node, offset) &&
				!isAtEndBoundary
			) {
				return;
			}
		}

		// Make sure we are inside a note
		// Node is the generic category, could be text or element
		const parentElement =
			node.nodeType === Node.TEXT_NODE
				? node.parentElement
				: (node as HTMLElement);
		if (
			!parentElement ||
			(!parentElement.closest(".markdown-preview-view") &&
				!parentElement.closest(".markdown-source-view"))
		) {
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
			this.runScanner(node, cleanText, 0);
			return;
		}

		if (node.nodeType === Node.TEXT_NODE) {
			const fullText = node.textContent || "";
			this.runScanner(node, fullText, offset);
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
		const availableLength = text.length - startOffset;
		const scanLength = Math.min(limit, availableLength);

		for (let i = scanLength; i > 0; i--) {
			const currentText = text.substring(startOffset, startOffset + i);
			if (!isJapanese(currentText)) continue;

			const results =
				await this.plugin.dictionaryManager.lookup(currentText);

			if (results && results.length > 0) {
				this.highlightText(node, startOffset, startOffset + i, results);
				return;
			}
		}
	}

	private highlightText(
		node: Node,
		startOffset: number,
		endOffset: number,
		results: ProcessedTerm[],
	) {
		if (!node.isConnected) return;

		const range = new Range();
		range.setStart(node, startOffset);
		range.setEnd(node, endOffset);
		this.currentHighlightRange = range;

		const highlight = new Highlight(range);
		CSS.highlights.set("japanese-highlight", highlight);

		this.popupManager.showPopup(range.getBoundingClientRect(), results);
	}

	private clearHighlight() {
		CSS.highlights.delete("japanese-highlight");
		this.currentHighlightRange = null;
		this.popupManager.hidePopup();
	}

	handleDocumentClick = (evt: MouseEvent) => {
		if (!this.popupManager.isOpen()) return;

		const target = evt.target as Node;

		if (this.popupManager.isElementInsidePopup(target)) {
			return;
		}

		this.clearHighlight();
	};

	private getCaretPosition(
		x: number,
		y: number,
	): { node: Node; offset: number } | null {
		if (document.caretPositionFromPoint) {
			const position = document.caretPositionFromPoint(x, y);
			if (!position) return null;
			return { node: position.offsetNode, offset: position.offset };
		}

		return null;
	}
}
