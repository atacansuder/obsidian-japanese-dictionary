import { App, Modal, Setting } from "obsidian";

export class ConfirmationModal extends Modal {
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
