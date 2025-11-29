import { Plugin } from "obsidian";
import { DictionaryImporter } from "src/importer";
import { JapaneseScanner } from "src/scanner";
import {
	DEFAULT_SETTINGS,
	JapanesePopupDictionarySettings,
	SampleSettingTab,
} from "src/settings";

export default class JapanesePopupDictionary extends Plugin {
	settings: JapanesePopupDictionarySettings;
	scanner: JapaneseScanner;
	importer: DictionaryImporter;

	async onload() {
		await this.loadSettings();

		this.importer = new DictionaryImporter(this.app, this.manifest.dir!);

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.scanner = new JapaneseScanner(this);
		this.registerDomEvent(document, "mousemove", this.scanner.handleHover);
	}

	onunload() {}

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
