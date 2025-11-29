import { App, Platform, FileSystemAdapter, Notice } from "obsidian";
import * as path from "path";
import { DictionaryData } from "./types";
import { DictionaryManager } from "./manager";

export class DictionaryImporter {
	app: App;
	pluginManifestDir: string;
	dictionaryManager: DictionaryManager;

	constructor(
		app: App,
		pluginManifestDir: string,
		dictionaryManager: DictionaryManager
	) {
		this.app = app;
		this.pluginManifestDir = pluginManifestDir;
		this.dictionaryManager = dictionaryManager;
	}

	async openPluginFolder() {
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

	async importDictionary(languageCode: string) {
		const adapter = this.app.vault.adapter;
		const searchPrefix = `jmdict-${languageCode}-`;

		try {
			const listResult = await adapter.list(this.pluginManifestDir);
			const dictionaryPath = listResult.files.find((filePath) => {
				const fileName = path.basename(filePath);
				return (
					fileName.startsWith(searchPrefix) &&
					fileName.endsWith(".json")
				);
			});
			console.log("Found dictionary file:", dictionaryPath);

			if (!dictionaryPath) {
				new Notice(
					`No dictionary file found for the selected language. Please ensure the file is in the plugin folder.`
				);
				return;
			}

			const db = await this.dictionaryManager.getDB();

			const existingVersion = await db.get("metadata", "version");
			const fileContent = await adapter.read(dictionaryPath);
			const dictionaryData: DictionaryData = JSON.parse(fileContent);

			if (existingVersion?.value === dictionaryData.version) {
				console.log("Dictionary already imported, skipping");
				new Notice("Dictionary already imported");
				return;
			}

			new Notice("Importing dictionary... This may take a moment.");
			await this.convertDictionaryToMap(dictionaryData);
			new Notice("Dictionary imported successfully!");
		} catch (error) {
			new Notice(
				`Error importing dictionary: ${
					(error as Error).message || error
				}`
			);
			console.error("Error importing dictionary:", error);
		}
	}

	private async convertDictionaryToMap(dictionaryData: DictionaryData) {
		const db = await this.dictionaryManager.getDB();

		await db.clear("entries");
		await db.clear("metadata");

		const tx = db.transaction("entries", "readwrite");
		const store = tx.store;

		let processed = 0;
		for (const word of dictionaryData.words) {
			const entry = {
				id: word.id,
				kanji: word.kanji.map((k) => k.text),
				kana: word.kana.map((k) => k.text),
				kanjiData: word.kanji,
				kanaData: word.kana,
				sense: word.sense,
			};

			store.add(entry);

			processed++;
			if (processed % 1000 === 0) {
				new Notice(
					`Processed ${processed}/${dictionaryData.words.length} entries`
				);
			}
		}

		await tx.done;

		await db.put("metadata", {
			key: "version",
			value: dictionaryData.version,
		});
		await db.put("metadata", {
			key: "dictDate",
			value: dictionaryData.dictDate,
		});
		await db.put("metadata", {
			key: "languages",
			value: dictionaryData.languages.join(","),
		});
	}
}
