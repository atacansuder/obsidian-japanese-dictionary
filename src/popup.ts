import { App } from "obsidian";
import { ProcessedTerm } from "./types";

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

		this.popupEl?.toggleVisibility(true);
		this.popupEl!.style.top = `${rect.bottom}px`;
		this.popupEl!.style.left = `${rect.left}px`;
		this.popupEl!.innerHTML = JSON.stringify(terms, null, 2);
	}
}
