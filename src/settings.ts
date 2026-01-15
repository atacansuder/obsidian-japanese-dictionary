import JapanesePopupDictionary from "main";
import {
	App,
	Notice,
	PluginSettingTab,
	Setting,
	ProgressBarComponent,
} from "obsidian";
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

		const stats = await this.plugin.dictionaryManager.getDictionaryStats();

		if (stats) {
			const desc = document.createDocumentFragment();
			desc.append(
				"Remove the dictionary database to free up space or import a different one."
			);
			desc.createEl("br");
			desc.createEl("br");
			desc.createEl("div", { text: `Title: ${stats.title}` });
			desc.createEl("div", { text: `Total terms: ${stats.count}` });
			desc.createEl("div", { text: `Size: ${stats.size}` });

			new Setting(containerEl)
				.setName("Delete dictionary")
				.setDesc(desc)
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
			const importDesc = document.createDocumentFragment();
			importDesc.append(
				"Required to enable lookups. Follow these steps:"
			);
			// Add spacing
			importDesc.createEl("br");
			importDesc.createEl("br");
			importDesc.createEl("div", {
				text: "1. Click the folder icon to open the location.",
			});
			importDesc.createEl("div", {
				text: "2. Place your Yomitan .zip file inside.",
			});
			importDesc.createEl("div", {
				text: "3. Click the 'Import' button.",
			});

			new Setting(containerEl)
				.setName("Import dictionary")
				.setDesc(importDesc)
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
							button.setDisabled(true);

							let progressBar: ProgressBarComponent | null = null;
							new Setting(containerEl)
								.setName("Import progress")
								.addProgressBar((pb) => {
									progressBar = pb;
									pb.setValue(0);
								});

							await this.plugin.importer.importDictionary(
								(percent) => {
									if (progressBar) {
										progressBar.setValue(percent);
									}
								}
							);
							this.display();
						});
				});
		}
	}
}
