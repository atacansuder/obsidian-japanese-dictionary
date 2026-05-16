import { Plugin } from "obsidian";
import { DictionaryImporter } from "./src/importer";
import { JapaneseScanner } from "./src/scanner";
import { DictionaryManager } from "./src/manager";
import {
	DEFAULT_SETTINGS,
	JapanesePopupDictionarySettings,
	JapanesePopupDictionarySettingTab,
} from "./src/settings";
import { PopupManager } from "./src/popup";

export default class JapanesePopupDictionary extends Plugin {
	settings!: JapanesePopupDictionarySettings;
	scanner!: JapaneseScanner;
	importer!: DictionaryImporter;
	dictionaryManager!: DictionaryManager;
	popupManager!: PopupManager;

	async onload() {
		await this.loadSettings();

		this.dictionaryManager = new DictionaryManager();

		await this.dictionaryManager.loadTags();

		this.importer = new DictionaryImporter(
			this.app,
			this.manifest.dir!,
			this.dictionaryManager,
		);

		this.addSettingTab(
			new JapanesePopupDictionarySettingTab(this.app, this),
		);

		this.popupManager = new PopupManager(this.dictionaryManager);
		this.scanner = new JapaneseScanner(this, this.popupManager);

		this.registerWindowEvents(activeWindow);

		this.registerEvent(
			this.app.workspace.on("window-open", (_workspaceWindow, win) => {
				this.registerWindowEvents(win);
			}),
		);
	}

	private registerWindowEvents(win: Window) {
		this.registerDomEvent(
			win.activeDocument,
			"mousemove",
			this.scanner.handleHover,
		);
		this.registerDomEvent(
			win.activeDocument,
			"mousedown",
			this.scanner.handleDocumentClick,
		);
	}

	onunload() {
		this.popupManager.destroyPopup();
		if (this.dictionaryManager) {
			this.dictionaryManager.close();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
