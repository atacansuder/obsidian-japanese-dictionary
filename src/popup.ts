import { App } from "obsidian";
import { ProcessedTerm, StructuredContent } from "./types";

export class PopupManager {
	private app: App;
	private popupEl: HTMLElement | null = null;

	constructor(app: App) {
		this.app = app;
		this.createPopup();
	}

	private createPopup() {
		this.popupEl = document.createElement("div");
		this.popupEl.id = "japanese-dictionary-popup";
		this.popupEl.addClass("japanese-dictionary-popup");
		this.popupEl.toggleVisibility(false);
		document.body.appendChild(this.popupEl);
	}

	destroyPopup() {
		if (this.popupEl) {
			this.popupEl.remove();
			this.popupEl = null;
		}
	}

	showPopup(rect: DOMRect, terms: ProcessedTerm[]) {
		if (!this.popupEl) {
			this.createPopup();
		}

		this.popupEl!.empty();
		const contentFragment = this.renderTerms(terms);
		this.popupEl!.appendChild(contentFragment);

		this.popupEl!.style.top = `${rect.bottom}px`;
		this.popupEl!.style.left = `${rect.left}px`;
		this.popupEl?.toggleVisibility(true);
	}

	hidePopup() {
		this.popupEl?.toggleVisibility(false);
	}

	isElementInsidePopup(target: Node): boolean {
		return this.popupEl ? this.popupEl.contains(target) : false;
	}

	isOpen(): boolean {
		return this.popupEl ? this.popupEl.style.display !== "none" : false;
	}

	private renderTerms(terms: ProcessedTerm[]): DocumentFragment {
		const fragment = document.createDocumentFragment();

		terms.sort((a, b) => {
			const aMatches = a.expression === a.reading;
			const bMatches = b.expression === b.reading;
			if (aMatches && !bMatches) return -1;
			if (!aMatches && bMatches) return 1;
			return b.score - a.score;
		});

		const groups = this.groupTermsByExpressionReading(terms);

		groups.forEach((groupTerms, key) => {
			const termContainer = document.createElement("div");
			termContainer.addClass("popup-term");

			const header = document.createElement("div");
			header.addClass("popup-term-header");

			const [expression, reading] = key.split("|");
			if (expression === reading) {
				const textHeader = document.createElement("span");
				textHeader.textContent = expression;
				textHeader.addClass("popup-term-expression");
				header.appendChild(textHeader);
			} else {
				const ruby = document.createElement("ruby");
				ruby.textContent = expression;
				const rt = document.createElement("rt");
				rt.textContent = reading;
				ruby.appendChild(rt);
				ruby.addClass("popup-term-expression");
				header.appendChild(ruby);
			}

			const firstTerm = groupTerms[0];
			if (
				firstTerm.glossary[2] &&
				typeof firstTerm.glossary[2] === "string"
			) {
				const tags = document.createElement("div");
				tags.addClass("popup-term-frequency-tags");
				const tagText = firstTerm.glossary[2] as string;
				tagText.split(" ").forEach((tag) => {
					const tagEl = this.createTagElement(tag);
					tags.appendChild(tagEl);
				});
				header.appendChild(tags);
			}

			termContainer.appendChild(header);

			const definitionsList = document.createElement("ol");
			definitionsList.addClass("popup-term-definitions");

			groupTerms.forEach((term) => {
				// Only pass the first element of glossary. Others are frequency tags and scores
				const contentNode = this.renderStructuredContent(
					term.glossary[0]
				);
				if (contentNode) {
					const li = document.createElement("li");
					const termListItemContainer = document.createElement("div");

					// Add term tags (for example "n" for noun)
					const termTagsContainer = document.createElement("div");
					termTagsContainer.addClass("popup-term-list-item-tags");

					term.tags.forEach((tag) => {
						const tagEl = this.createTagElement(tag);
						termTagsContainer.appendChild(tagEl);
					});

					if (termTagsContainer.childNodes.length > 0) {
						termListItemContainer.appendChild(termTagsContainer);
					}

					termListItemContainer.appendChild(contentNode);

					li.appendChild(termListItemContainer);
					definitionsList.appendChild(li);
				}
			});

			termContainer.appendChild(definitionsList);
			fragment.appendChild(termContainer);
		});

		return fragment;
	}

	private renderStructuredContent(
		content:
			| string
			| number
			| StructuredContent
			| (string | StructuredContent)[]
	): Node | DocumentFragment | null {
		if (typeof content === "string" || typeof content === "number") {
			// If string is empty, return null so we don't create empty list items
			if (String(content).trim() === "") return null;
			return document.createTextNode(String(content));
		}

		if (Array.isArray(content)) {
			const frag = document.createDocumentFragment();
			content.forEach((item) => {
				const childNode = this.renderStructuredContent(item);
				if (childNode) {
					frag.appendChild(childNode);
				}
			});
			return frag.childNodes.length > 0 ? frag : null;
		}

		const sc = content as StructuredContent;

		// Filtering out tables for now for simplicity (normally they are used for different forms, like "nihongo" vs "nippongo")
		if (
			sc.tag === "table" ||
			sc.tag === "tr" ||
			sc.tag === "td" ||
			sc.tag === "th"
		) {
			return null;
		}

		const tagName = sc.tag || "span";
		const element = document.createElement(tagName);

		if (sc.lang) element.lang = sc.lang;

		if (sc.content) {
			const children = this.renderStructuredContent(sc.content);
			if (children) {
				element.appendChild(children);
			}
		}

		if (element.childNodes.length === 0 && !element.textContent) {
			return null;
		}

		return element;
	}

	private createTagElement(tag: string): HTMLElement {
		const tagEl = document.createElement("span");
		tagEl.textContent = tag;
		tagEl.addClass("popup-tag");
		return tagEl;
	}

	private groupTermsByExpressionReading(
		terms: ProcessedTerm[]
	): Map<string, ProcessedTerm[]> {
		const groups = new Map<string, ProcessedTerm[]>();

		for (const term of terms) {
			const key = `${term.expression}|${term.reading}`;
			const existing = groups.get(key);
			if (existing) {
				existing.push(term);
			} else {
				groups.set(key, [term]);
			}
		}

		return groups;
	}
}
