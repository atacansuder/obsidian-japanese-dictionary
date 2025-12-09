import { App } from "obsidian";
import { ProcessedTerm, RawDefinition, StructuredContent } from "./types";

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

		// This is useful to prioritize terms where the expression matches the reading,
		// for example particle に (at/in/on) is prioritized over 二 (two)
		terms.sort((a, b) => (a.expression === a.reading ? -1 : 0));
		console.log("Sorted Terms:", terms);

		terms.forEach((term) => {
			const termContainer = document.createElement("div");
			termContainer.addClass("popup-term");

			const header = document.createElement("div");
			header.addClass("popup-term-header");

			// Add the expression as the main header element
			const expressionText = document.createElement("div");
			expressionText.addClass("popup-term-expression");
			if (term.expression === term.reading) {
				const textHeader = document.createElement("span");
				textHeader.textContent = term.expression;
				expressionText.appendChild(textHeader);
			} else {
				const ruby = document.createElement("ruby");
				ruby.textContent = term.expression;
				const rt = document.createElement("rt");
				rt.textContent = term.reading;
				ruby.appendChild(rt);
				expressionText.appendChild(ruby);
			}
			header.appendChild(expressionText);

			// Add frequency tags if available
			if (term.glossary[2] && typeof term.glossary[2] === "string") {
				const tags = document.createElement("div");
				tags.addClass("popup-term-frequency-tags");
				term.glossary[2].split(" ").forEach((tag) => {
					const tagEl = this.createTagElement(tag);
					tags.appendChild(tagEl);
				});
				header.appendChild(tags);
			}

			termContainer.appendChild(header);
			fragment.appendChild(termContainer);
		});

		return fragment;
	}

	private createTagElement(tag: string): HTMLElement {
		const tagEl = document.createElement("span");
		tagEl.textContent = tag;
		tagEl.title = tag; // TODO: Replace with full tag description if available
		return tagEl;
	}
}
