import { App, Platform, FileSystemAdapter } from "obsidian";
import * as path from "path";

export class DictionaryImporter {
	app: App;
	pluginManifestDir: string;

	constructor(app: App, pluginManifestDir: string) {
		this.app = app;
		this.pluginManifestDir = pluginManifestDir;
	}

	openPluginFolder() {
		if (!Platform.isDesktop) {
			console.warn(
				"openPluginFolder is only available on Desktop platforms."
			);
			return;
		}

		const adapter = this.app.vault.adapter as FileSystemAdapter;
		const vaultBasePath = adapter.getBasePath();
		const fullPath = path.join(vaultBasePath, this.pluginManifestDir);
		const { shell } = require("electron");
		shell.openPath(fullPath);
	}
}
