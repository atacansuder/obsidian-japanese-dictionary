import { App, Platform, FileSystemAdapter, Notice } from "obsidian";
import * as path from "path";
import * as JSZip from "jszip";
import { DictionaryManager } from "./manager";
import {
	RawTermEntry,
	YomitanIndex,
	ProcessedTerm,
	RawDefinition,
	RawTagEntry,
	TagDefinition,
} from "./types";

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
		const fullPath = path.join(
			adapter.getBasePath(),
			this.pluginManifestDir
		);
		const { shell } = require("electron");
		shell.openPath(fullPath);
	}

	async importDictionary() {
		const adapter = this.app.vault.adapter;

		const listResult = await adapter.list(this.pluginManifestDir);
		const zipFiles = listResult.files.filter(
			(filePath) => path.extname(filePath).toLowerCase() === ".zip"
		);

		if (zipFiles.length === 0) {
			new Notice("No .zip files found in plugin folder.");
			return;
		}

		const targetZip = zipFiles[0];
		console.log("Importing", targetZip);

		try {
			const arrayBuffer = await adapter.readBinary(targetZip);
			await this.processZip(arrayBuffer);
			new Notice("Dictionary imported successfully!");
		} catch (error) {
			new Notice(
				`Error importing dictionary: ${(error as Error).message}`
			);
			console.error("Error importing dictionary:", error);
		}
	}

	private async processZip(data: ArrayBuffer) {
		const zip = await JSZip.loadAsync(data);

		const indexFile = zip.file("index.json");
		if (!indexFile)
			throw new Error("Invalid Yomitan dictionary: index.json missing");

		const indexContent = await indexFile.async("string");
		const meta: YomitanIndex = JSON.parse(indexContent);

		const db = await this.dictionaryManager.getDB();

		const existing = await db.get("dictionaries", meta.title);
		if (existing) {
			new Notice(`Dictionary "${meta.title}" already exists. Skipping.`);
			return;
		}

		await db.put("dictionaries", meta);

		const termFiles = Object.keys(zip.files).filter(
			(filename) =>
				filename.startsWith("term_bank_") && filename.endsWith(".json")
		);

		let processedCount = 0;
		new Notice(`Importing ${meta.title}...`);

		for (const filename of termFiles) {
			const file = zip.file(filename);
			if (!file) continue;

			const content = await file.async("string");
			const rawTerms: RawTermEntry[] = JSON.parse(content);

			const tx = db.transaction("terms", "readwrite");
			const termStore = tx.objectStore("terms");

			const termsToAdd = rawTerms.map((entry) => {
				const rawGlossary = entry.slice(5);
				return {
					expression: entry[0],
					reading: entry[1],
					tags: entry[2].split(" "),
					rules: entry[3].split(" "),
					score: entry[4],
					glossary: rawGlossary as RawDefinition[],
					dictionary: meta.title,
				} as ProcessedTerm;
			});

			for (const term of termsToAdd) {
				termStore.add(term);
				processedCount++;
			}

			await tx.done;
			console.log(`Processed batch: ${filename}`);
		}

		const tagFiles = Object.keys(zip.files).filter(
			(filename) =>
				filename.startsWith("tag_bank_") && filename.endsWith(".json")
		);

		if (tagFiles.length > 0) {
			for (const filename of tagFiles) {
				const file = zip.file(filename);
				if (!file) continue;

				const content = await file.async("string");
				const rawTags: RawTagEntry[] = JSON.parse(content);

				const txTags = db.transaction("tag_defs", "readwrite");
				const tagStore = txTags.objectStore("tag_defs");

				for (const entry of rawTags) {
					const tagDef: TagDefinition = {
						name: entry[0],
						category: entry[1],
						description: entry[3],
					};
					tagStore.put(tagDef);
				}

				await txTags.done;
			}
		}

		await this.dictionaryManager.loadTags();

		console.log(`Imported ${processedCount} terms from ${meta.title}`);
	}
}
