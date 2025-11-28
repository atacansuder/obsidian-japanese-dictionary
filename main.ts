import { Plugin } from "obsidian";
import { JapaneseScanner } from "src/scanner";
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from "src/settings";

export default class JapaneseDictionary extends Plugin {
	settings: MyPluginSettings;
	scanner: JapaneseScanner;

	async onload() {
		await this.loadSettings();

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
