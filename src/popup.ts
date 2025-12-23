import { DictionaryManager } from "./manager";
import { ProcessedTerm, StructuredContent } from "./types";

export class PopupManager {
	private dictionaryManager: DictionaryManager;
	private popupEl: HTMLElement | null = null;

	constructor(dictionaryManager: DictionaryManager) {
		this.dictionaryManager = dictionaryManager;
		this.createPopup();
	}

	private createPopup() {
		this.popupEl = document.body.createDiv({
			cls: "japanese-dictionary-popup",
			attr: { id: "japanese-dictionary-popup" },
		});
		this.popupEl.hide();
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

		this.updatePopupContent(terms);

		this.popupEl!.style.top = `${rect.bottom}px`;
		this.popupEl!.style.left = `${rect.left}px`;
		this.popupEl?.show();
	}

	hidePopup() {
		this.popupEl?.hide();
	}

	isElementInsidePopup(target: Node): boolean {
		return this.popupEl ? this.popupEl.contains(target) : false;
	}

	isOpen(): boolean {
		return this.popupEl ? this.popupEl.style.display !== "none" : false;
	}

	private updatePopupContent(terms: ProcessedTerm[]) {
		if (!this.popupEl) return;
		this.popupEl.empty();
		this.renderTerms(this.popupEl, terms);
		this.popupEl.scrollTop = 0;
	}

	private renderTerms(container: HTMLElement, terms: ProcessedTerm[]) {
		terms.sort((a, b) => {
			const aMatches = a.expression === a.reading;
			const bMatches = b.expression === b.reading;
			if (aMatches && !bMatches) return -1;
			if (!aMatches && bMatches) return 1;
			return b.score - a.score;
		});

		const groups = this.groupTermsByExpressionReading(terms);

		groups.forEach((groupTerms, key) => {
			container.createDiv({ cls: "popup-term" }, (termContainer) => {
				const header = termContainer.createDiv({
					cls: "popup-term-header",
				});

				const [expression, reading] = key.split("|");
				if (expression === reading) {
					header.createSpan({
						text: expression,
						cls: "popup-term-expression",
					});
				} else {
					header.createEl(
						"ruby",
						{ cls: "popup-term-expression" },
						(ruby) => {
							ruby.createSpan({ text: expression });
							ruby.createEl("rt", { text: reading });
						}
					);
				}

				const firstTerm = groupTerms[0];
				if (
					firstTerm.glossary[2] &&
					typeof firstTerm.glossary[2] === "string"
				) {
					header.createDiv(
						{ cls: "popup-term-frequency-tags" },
						(tags) => {
							const tagText = firstTerm.glossary[2] as string;
							tagText.split(" ").forEach((tag) => {
								tags.createSpan({
									text: tag,
									cls: "popup-tag",
								});
							});
						}
					);
				}

				termContainer.createEl(
					"ol",
					{ cls: "popup-term-definitions" },
					(definitionsList) => {
						groupTerms.forEach((term) => {
							// Only pass the first element of glossary. Others are frequency tags and scores
							const content = term.glossary[0];

							definitionsList.createEl("li", {}, (li) => {
								li.createDiv({}, (termListItemContainer) => {
									// Add term tags (for example "n" for noun)
									if (
										term.tags.length > 0 &&
										term.tags[0] !== ""
									) {
										termListItemContainer.createDiv(
											{
												cls: "popup-term-list-item-tags",
											},
											(termTagsContainer) => {
												term.tags.forEach((tag) => {
													termTagsContainer.createSpan(
														{
															text: tag,
															cls: "popup-tag",
														}
													);
												});
											}
										);
									}

									this.renderStructuredContent(
										termListItemContainer,
										content
									);
								});
							});
						});
					}
				);
			});
		});
	}

	private renderStructuredContent(
		container: HTMLElement,
		content:
			| string
			| number
			| StructuredContent
			| (string | StructuredContent)[]
	) {
		if (typeof content === "string" || typeof content === "number") {
			const text = String(content).trim();
			if (text !== "") {
				container.appendText(text);
			}
			return;
		}

		if (Array.isArray(content)) {
			content.forEach((item) => {
				this.renderStructuredContent(container, item);
			});
			return;
		}

		const sc = content as StructuredContent;

		// Filtering out tables for now for simplicity (normally they are used for different forms, like "nihongo" vs "nippongo")
		if (
			sc.tag === "table" ||
			sc.tag === "tr" ||
			sc.tag === "td" ||
			sc.tag === "th"
		) {
			return;
		}

		const tagName = sc.tag || "span";

		container.createEl(
			tagName as keyof HTMLElementTagNameMap,
			{ attr: sc.lang ? { lang: sc.lang } : undefined },
			(element) => {
				if (sc.content) {
					if (sc.tag === "a") {
						element.addEventListener("click", async (e) => {
							e.preventDefault();
							const res = await this.dictionaryManager.lookup(
								sc.content as string
							);
							this.updatePopupContent(res);
						});
					}
					this.renderStructuredContent(element, sc.content);
				}
			}
		);
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
