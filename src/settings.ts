import JapanesePopupDictionary from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { TriggerKeys } from "./types";

export interface JapanesePopupDictionarySettings {
	triggerKey: string;
	isDictionaryOn: boolean;
}

export const DEFAULT_SETTINGS: JapanesePopupDictionarySettings = {
	triggerKey: TriggerKeys.Shift,
	isDictionaryOn: true,
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: JapanesePopupDictionary;

	constructor(app: App, plugin: JapanesePopupDictionary) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

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
			.setName("Hover modifier key")
			.setDesc("Hold this key while hovering to trigger.")
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

		containerEl.createEl("hr");

		const stats = await this.plugin.dictionaryManager.getDictionaryStats();

		if (stats) {
			new Setting(containerEl)
				.setName("Dictionary information")
				.setHeading()
				.setDesc(
					`${stats.title} | Total terms: ${stats.count} | Size: ${stats.size}`
				);

			new Setting(containerEl)
				.setName("Delete dictionary")
				.setDesc(
					"Remove the dictionary database to free up space or import a different one."
				)
				.addButton((button) => {
					button
						.setButtonText("Delete dictionary")
						.setWarning()
						.onClick(async () => {
							if (
								!confirm(
									`Are you sure you want to delete "${stats.title}"? This action cannot be undone.`
								)
							) {
								return;
							}

							new Notice("Deleting dictionary...");
							await this.plugin.dictionaryManager.deleteDatabase();
							new Notice("Dictionary deleted successfully.");

							this.display();
						});
				});
		} else {
			new Setting(containerEl)
				.setName("Import yomitan dictionary")
				.setHeading()
				.setDesc(
					"Open the plugin folder, place your Yomitan .zip file there, then click Import."
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
						.setButtonText("Import .zip")
						.setCta()
						.onClick(async () => {
							await this.plugin.importer.importDictionary();
							this.display();
						});
				});
		}
	}
}
