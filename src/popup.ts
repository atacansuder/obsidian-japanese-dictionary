import { DictionaryManager } from "./manager";
import { ProcessedTerm, StructuredContent } from "./types";
import { isExternalLink } from "./utils";
import { getFuriganaSegments } from "./furigana";

export class PopupManager {
	private dictionaryManager: DictionaryManager;
	private popupEl: HTMLElement | null = null;
	private readonly formCellMarkers: Record<string, string> = {
		"form-pri": "\u25b3",
		"form-irr": "\u2715",
		"form-out": "\u53e4",
		"form-old": "\u65e7",
		"form-rare": "\u25bd",
		"form-valid": "\u25c7",
	};

	constructor(dictionaryManager: DictionaryManager) {
		this.dictionaryManager = dictionaryManager;
		// Create an initial popup in the main window so it exists for the
		// common single-window case without waiting for the first hover.
		this.createPopupInWindow(window);
	}

	private createPopupInWindow(win: Window) {
		this.popupEl = win.document.body.createDiv({
			cls: "japanese-dictionary-popup",
			attr: { id: "japanese-dictionary-popup" },
		});
		this.popupEl.hide();
	}

	/**
	 * Ensures the popup element lives in the correct window's document.
	 * When the user hovers in a secondary window the popup must be attached
	 * there; otherwise it would be invisible or positioned incorrectly.
	 */
	private ensurePopupInWindow(win: Window) {
		if (this.popupEl && this.popupEl.ownerDocument !== win.document) {
			this.popupEl.remove();
			this.popupEl = null;
		}
		if (!this.popupEl) {
			this.createPopupInWindow(win);
		}
	}

	destroyPopup() {
		if (this.popupEl) {
			this.popupEl.remove();
			this.popupEl = null;
		}
	}

	showPopup(rect: DOMRect, terms: ProcessedTerm[], win: Window) {
		this.ensurePopupInWindow(win);
		this.updatePopupContent(terms);

		// Render off-screen first so we can measure actual dimensions
		// This is used to correctly position the popup so it does not overflow the viewport
		this.popupEl!.style.visibility = "hidden";
		this.popupEl!.style.top = "0px";
		this.popupEl!.style.left = "0px";
		this.popupEl?.show();

		const popupWidth = this.popupEl!.offsetWidth;
		const popupHeight = this.popupEl!.offsetHeight;
		const viewportWidth = win.innerWidth;
		const viewportHeight = win.innerHeight;

		let left = rect.left;
		if (left + popupWidth > viewportWidth) {
			left = rect.right - popupWidth;
		}
		left = Math.max(0, left);

		let top = rect.bottom;
		if (top + popupHeight > viewportHeight) {
			top = rect.top - popupHeight;
		}
		top = Math.max(0, top);

		this.popupEl!.style.top = `${top}px`;
		this.popupEl!.style.left = `${left}px`;
		this.popupEl!.style.visibility = "";
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
				header.createSpan(
					{ cls: "popup-term-expression" },
					(expressionContainer) => {
						this.renderExpressionWithFurigana(
							expressionContainer,
							expression,
							reading,
						);
					},
				);

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
									attr: {
										"aria-label":
											this.dictionaryManager.getTagDescription(
												tag,
											),
									},
								});
							});
						},
					);
				}

				termContainer.createEl(
					"ol",
					{ cls: "popup-term-definitions" },
					(definitionsList) => {
						groupTerms.forEach((term) => {
							// Only pass the first element of glossary. Others are frequency tags and scores
							const content = term.glossary[0];

							const isForms = term.tags.includes("forms");

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
															attr: {
																"aria-label":
																	this.dictionaryManager.getTagDescription(
																		tag,
																	),
															},
														},
													);
												});
											},
										);
									}

									// If it is a "forms" tag and the content is an array, render as a list
									if (isForms && Array.isArray(content)) {
										termListItemContainer.createEl(
											"ul",
											{ cls: "popup-term-forms-list" },
											(ul) => {
												content.forEach((formItem) => {
													const li =
														ul.createEl("li");
													this.renderStructuredContent(
														li,
														formItem,
													);

													// Check if it ended up empty (Defensive cleanup)
													// This handles cases where data is missing or filtered out
													if (
														li.innerText.trim() ===
														""
													) {
														li.remove();
													}
												});
												// If no list items were added, remove the ul
												if (ul.children.length === 0) {
													ul.remove();
												}
											},
										);
									} else {
										this.renderStructuredContent(
											termListItemContainer,
											content,
										);
									}
								});
							});
						});
					},
				);
			});
		});
	}

	private renderExpressionWithFurigana(
		container: HTMLElement,
		expression: string,
		reading: string,
	) {
		const segments = getFuriganaSegments(expression, reading);

		segments.forEach((segment) => {
			if (!segment.reading) {
				container.appendText(segment.text);
				return;
			}

			container.createEl("ruby", {}, (ruby) => {
				ruby.appendText(segment.text);
				ruby.createEl("rt", { text: segment.reading });
			});
		});
	}

	private renderStructuredContent(
		container: HTMLElement,
		content:
			| string
			| number
			| StructuredContent
			| (string | number | StructuredContent)[],
		insideTableHeader = false,
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
				this.renderStructuredContent(
					container,
					item,
					insideTableHeader,
				);
			});
			return;
		}
		const tagName = content.tag || "span";
		const attrs: Record<string, string> = {};

		if (content.lang) attrs.lang = content.lang;
		if ((insideTableHeader || content.tag === "th") && content.title) {
			attrs["aria-label"] = content.title;
		}

		container.createEl(
			tagName as keyof HTMLElementTagNameMap,
			{
				attr: Object.keys(attrs).length > 0 ? attrs : undefined,
				cls:
					content.tag === "ul"
						? "popup-term-list"
						: content.data?.class
							? "popup-term-" + content.data?.class
							: undefined,
				href: isExternalLink(content.href) ? content.href : undefined,
			},
			(element) => {
				if (content.content !== undefined && content.content !== null) {
					// If it's a link without href, make it clickable to lookup
					if (content.tag === "a" && !isExternalLink(content.href)) {
						element.addEventListener("click", (e) => {
							e.preventDefault();
							void this.handleLinkClick(
								this.extractTextContent(content.content),
							);
						});
					}
					this.renderStructuredContent(
						element,
						content.content,
						insideTableHeader || content.tag === "th",
					);
				}

				this.renderFormCellMarker(element, content);
			},
		);
	}

	private renderFormCellMarker(
		element: HTMLElement,
		content: StructuredContent,
	) {
		if (content.tag !== "td" || element.innerText.trim() !== "") return;

		const markerClass = content.data?.class;
		if (!markerClass) return;

		const marker = this.formCellMarkers[markerClass];
		if (!marker) return;

		const markerElement =
			element.querySelector<HTMLElement>("span") ?? element.createSpan();
		markerElement.setText(marker);

		const title = this.extractTitle(content.content);
		if (title) {
			markerElement.setAttr("aria-label", title);
		}
	}

	private groupTermsByExpressionReading(
		terms: ProcessedTerm[],
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

	private async handleLinkClick(text: string) {
		try {
			const res = await this.dictionaryManager.lookup(text);
			this.updatePopupContent(res);
		} catch (err) {
			console.error("Link lookup failed:", err);
		}
	}

	private extractTextContent(
		content:
			| string
			| number
			| StructuredContent
			| (string | number | StructuredContent)[]
			| undefined,
	): string {
		if (content === undefined) return "";
		if (typeof content === "string") return content;
		if (typeof content === "number") return String(content);
		if (Array.isArray(content)) {
			return content
				.map((item) => this.extractTextContent(item))
				.join("");
		}

		if (content.tag === "rt" || content.tag === "rp") return "";
		if (content.content) return this.extractTextContent(content.content);
		return "";
	}

	private extractTitle(
		content:
			| string
			| number
			| StructuredContent
			| (string | number | StructuredContent)[]
			| undefined,
	): string {
		if (
			content === undefined ||
			typeof content === "string" ||
			typeof content === "number"
		) {
			return "";
		}

		if (Array.isArray(content)) {
			for (const item of content) {
				const title = this.extractTitle(item);
				if (title) return title;
			}
			return "";
		}

		if (content.title) return content.title;
		return this.extractTitle(content.content);
	}
}
