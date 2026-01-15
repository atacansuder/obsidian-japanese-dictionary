import JapanesePopupDictionary from "main";
import {
	App,
	Notice,
	PluginSettingTab,
	Setting,
	ProgressBarComponent,
	Modal,
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

class ConfirmationModal extends Modal {
	title: string;
	message: string;
	onConfirm: () => void;

	constructor(
		app: App,
		title: string,
		message: string,
		onConfirm: () => void
	) {
		super(app);
		this.title = title;
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		this.setTitle(this.title);

		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Delete")
					.setWarning()
					.onClick(() => {
						this.onConfirm();
						this.close();
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

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
							new ConfirmationModal(
								this.app,
								"Delete dictionary",
								`Are you sure you want to delete "${stats.title}"? This action cannot be undone.`,
								async () => {
									new Notice("Deleting dictionary...");
									await this.plugin.dictionaryManager.deleteDatabase();
									new Notice(
										"Dictionary deleted successfully."
									);

									this.display();
								}
							).open();
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
			importDesc.createEl("a", {
				text: "1. Download a Yomitan format Japanese dictionary.",
				href: "https://yomitan.wiki/dictionaries/#japanese",
			});
			importDesc.createEl("br");
			importDesc.createEl("small", {
				text: "(recommended: Jitendex or JMdict)",
			});
			importDesc.createEl("div", {
				text: "2. Click the folder icon to open the plugin location.",
			});
			importDesc.createEl("div", {
				text: "3. Place your dictionary .zip file you downloaded inside.",
			});
			importDesc.createEl("div", {
				text: "4. Click the 'Import' button.",
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
