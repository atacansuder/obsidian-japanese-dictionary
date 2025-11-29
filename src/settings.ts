import JapanesePopupDictionary from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { LANGUAGE_OPTIONS } from "./types";

export interface JapanesePopupDictionarySettings {
	selectedLanguageCode: string;
}

export const DEFAULT_SETTINGS: JapanesePopupDictionarySettings = {
	selectedLanguageCode: LANGUAGE_OPTIONS[0].code,
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: JapanesePopupDictionary;

	constructor(app: App, plugin: JapanesePopupDictionary) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Target language")
			.setDesc("Select the language for dictionary lookups.")
			.addDropdown((dropdown) => {
				LANGUAGE_OPTIONS.forEach((option) => {
					dropdown.addOption(option.code, option.label);
				});

				dropdown
					.setValue(this.plugin.settings.selectedLanguageCode)
					.onChange(async (value) => {
						this.plugin.settings.selectedLanguageCode = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
