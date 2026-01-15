A fast, offline popup dictionary for Japanese learners using Obsidian. Hover over Japanese text while holding a modifier key (Shift, Ctrl, or Alt) to instantly see definitions, readings, and verb conjugations.

![Demo](https://github.com/atacansuder/japanese-popup-dictionary/raw/main/images/demo.gif)

## Features

-   **Instant Lookups:** fast local lookups using IndexedDB.
-   **Yomitan/Yomichan Compatible:** Supports standard dictionary formats (JMdict, Jitendex, etc.).
-   **Deinflection Support:** Automatically detects conjugated verbs and adjectives (e.g., handles 食べられなかった correctly).
-   **Configurable Triggers:** Choose to trigger the popup with `Shift`, `Ctrl`, `Alt`, or have it always on.
-   **Frequency & Pitch Accent:** Displays pitch accent and frequency tags if your dictionary data includes them.

> [!WARNING]
> **Desktop Only:** This plugin currently relies on Node.js and Electron APIs to handle large dictionary imports. It **will not work** on Obsidian Mobile (iOS/Android).

## Installation

### From Community Plugins

1. Open Obsidian Settings > Community Plugins.
2. Turn off Safe Mode.
3. Click **Browse** and search for "Japanese Popup Dictionary".
4. Click **Install** and then **Enable**.

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/atacansuder/japanese-popup-dictionary/releases) page.
2. Extract the `main.js`, `manifest.json`, and `styles.css` files.
3. Place them in your vault's plugin folder: `.obsidian/plugins/japanese-popup-dictionary/`.
4. Reload Obsidian.

## Setup: Importing a Dictionary

Before the plugin works, you must import a dictionary file. This plugin uses the **Yomitan (formerly Yomichan)** dictionary format.

1.  **Download a Dictionary:**

    -   Visit [this links](https://yomitan.wiki/dictionaries/#japanese) and download one of the dictionaries.
    -   Recommended: [JMDict](https://github.com/yomidevs/jmdict-yomitan/releases) or [Jitendex](https://github.com/stephenmk/Jitendex/releases).
    -   Ensure the file is a `.zip` file (do not unzip it).

2.  **Open Plugin Settings:**

    -   Go to **Settings** > **Japanese Popup Dictionary**.

3.  **Import the File:**

    -   Scroll to the **Import dictionary** section.
    -   Click the **Folder Icon** button to open the plugin's data folder on your computer.
    -   **Copy/Paste** your downloaded dictionary `.zip` file into this folder. **Make sure that there is only one zip file!**
    -   Return to Obsidian and click the **Import .zip** button.
    -   Wait for the progress bar to complete.

4.  **Done!** You can now delete the `.zip` file from the folder if you wish.

## Usage

1.  Open a note containing Japanese text.
2.  Hold the **Trigger Key** (Default: `Shift`).
3.  Hover your mouse over a word.
4.  A popup will appear with the definition.

## Settings

-   **Trigger Key:** Select which key to hold to activate the scanner (`Shift`, `Ctrl`, `Alt`, or `None`).
    -   _Note: Setting this to "None" causes the dictionary to scan every time you move your mouse over Japanese text._
-   **Enable/Disable:** Quickly toggle the plugin on or off without uninstalling.

## Development

If you want to contribute or build from source:

1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Run `npm run dev` to start compilation in watch mode.
