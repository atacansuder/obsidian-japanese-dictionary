export {};

// I had to add this because TypeScript was not recognizing the Highlight API
declare global {
	interface Highlight {
		priority: number;
		type: HighlightType;
		add(range: AbstractRange): void;
		clear(): void;
		delete(range: AbstractRange): boolean;
		entries(): IterableIterator<AbstractRange>;
		forEach(
			callback: (range: AbstractRange, highlight: Highlight) => void,
			thisArg?: unknown
		): void;
		has(range: AbstractRange): boolean;
		keys(): IterableIterator<AbstractRange>;
		size: number;
		values(): IterableIterator<AbstractRange>;
	}

	var Highlight: {
		prototype: Highlight;
		new (...ranges: AbstractRange[]): Highlight;
	};

	interface HighlightRegistry {
		set(name: string, highlight: Highlight): void;
		delete(name: string): boolean;
		get(name: string): Highlight | undefined;
		has(name: string): boolean;
		clear(): void;
	}

	interface CSS {
		highlights: HighlightRegistry;
	}
}
