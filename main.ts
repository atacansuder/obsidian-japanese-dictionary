import { Plugin } from "obsidian";
import { DictionaryImporter } from "src/importer";
import { JapaneseScanner } from "src/scanner";
import { DictionaryManager } from "src/manager";
import {
	DEFAULT_SETTINGS,
	JapanesePopupDictionarySettings,
	SampleSettingTab,
} from "src/settings";
import { PopupManager } from "src/popup";

export default class JapanesePopupDictionary extends Plugin {
	settings: JapanesePopupDictionarySettings;
	scanner: JapaneseScanner;
	importer: DictionaryImporter;
	dictionaryManager: DictionaryManager;
	popupManager: PopupManager;

	async onload() {
		await this.loadSettings();

		this.dictionaryManager = new DictionaryManager();

		this.importer = new DictionaryImporter(
			this.app,
			this.manifest.dir!,
			this.dictionaryManager
		);

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.popupManager = new PopupManager(this.app);
		this.scanner = new JapaneseScanner(this, this.popupManager);
		this.registerDomEvent(document, "mousemove", this.scanner.handleHover);
	}

	onunload() {
		this.popupManager.destroyPopup();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
