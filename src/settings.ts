import JapanesePopupDictionary from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { LANGUAGE_OPTIONS, TriggerKeys } from "./types";

export interface JapanesePopupDictionarySettings {
	selectedLanguageCode: string;
	triggerKey: string;
	isDictionaryOn: boolean;
}

export const DEFAULT_SETTINGS: JapanesePopupDictionarySettings = {
	selectedLanguageCode: LANGUAGE_OPTIONS[0].code,
	triggerKey: TriggerKeys.None,
	isDictionaryOn: true,
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

		new Setting(containerEl)
			.setName("Dictionary toggle")
			.setDesc("Enable or disable the dictionary feature.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.isDictionaryOn)
					.onChange(async (value) => {
						this.plugin.settings.isDictionaryOn = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Import dictionary")
			.setDesc(
				'Open the plugin folder to add your dictionary files and click the "Import dictionary" button to import it.'
			)
			.addExtraButton((button) => {
				button
					.setIcon("folder-open")
					.setTooltip("Open plugin folder")
					.onClick(() => {
						this.plugin.importer.openPluginFolder();
					});
			})
			.addButton((button) => {
				button
					.setButtonText("Import dictionary")
					.setCta()
					.onClick(async () => {
						await this.plugin.importer.importDictionary(
							this.plugin.settings.selectedLanguageCode
						);
					});
			});

		new Setting(containerEl)
			.setName("Hover modifier key")
			.setDesc(
				"Hold this key while hovering to trigger the dictionary. (Use 'None' to always scan)."
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOption(TriggerKeys.None, "None (Always active)")
					.addOption(TriggerKeys.Ctrl, "Ctrl")
					.addOption(TriggerKeys.Alt, "Alt")
					.addOption(TriggerKeys.Shift, "Shift")
					.setValue(this.plugin.settings.triggerKey)
					.onChange(async (value) => {
						this.plugin.settings.triggerKey = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
