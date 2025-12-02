import { DEINFLECT_DATA } from "../data/deinflect_data";

export interface DeinflectionResult {
	term: string;
	rules: number;
	reasons: string[];
}

interface RawReason {
	kanaIn: string;
	kanaOut: string;
	rulesIn: string[];
	rulesOut: string[];
}

// Bitmasks for Parts of Speech (Internal logic used by Yomichan)
const RULE_TYPES = new Map([
	["v1", 0b00000001], // Ichidan verb (ru-verb)
	["v5", 0b00000010], // Godan verb (u-verb)
	["vs", 0b00000100], // Suru verb
	["vk", 0b00001000], // Kuru verb
	["vz", 0b00010000], // Zuru verb
	["adj-i", 0b00100000], // I-adjective
	["iru", 0b01000000], // Intermediate -iru endings
]);

type NormalizedVariant = [string, string, number, number];
type NormalizedReason = [string, NormalizedVariant[]];

// The logic here is adapted from Yomichan's deinflection code:
// https://github.com/FooSoft/yomichan/blob/master/ext/js/language/deinflector.js
export class Deinflector {
	reasons: NormalizedReason[];

	constructor() {
		this.reasons = Deinflector.normalizeReasons(
			DEINFLECT_DATA as unknown as Record<string, RawReason[]>
		) as NormalizedReason[];
	}

	/**
	 * Converts an array of rule strings (from dictionary entry or raw rule data) into a single bitmask number.
	 * @param rules Array of rule strings (e.g., ["v5", "vi"]).
	 * @returns Bitmask representing the combined rule flags.
	 */
	public getRuleFlags(rules: string[]): number {
		return Deinflector.rulesToRuleFlags(rules);
	}

	deinflect(source: string): DeinflectionResult[] {
		const results: DeinflectionResult[] = [
			this._createDeinflection(source, 0, []),
		];

		for (let i = 0; i < results.length; ++i) {
			const { rules, term, reasons } = results[i];

			for (const [reason, variants] of this.reasons) {
				for (const [kanaIn, kanaOut, rulesIn, rulesOut] of variants) {
					if (
						(rules !== 0 && (rules & rulesIn) === 0) ||
						!term.endsWith(kanaIn) ||
						term.length - kanaIn.length + kanaOut.length <= 0
					) {
						continue;
					}

					results.push(
						this._createDeinflection(
							term.substring(0, term.length - kanaIn.length) +
								kanaOut,
							rulesOut,
							[reason, ...reasons]
						)
					);
				}
			}
		}
		return results;
	}

	private _createDeinflection(
		term: string,
		rules: number,
		reasons: string[]
	): DeinflectionResult {
		return { term, rules, reasons };
	}

	private static normalizeReasons(reasons: Record<string, RawReason[]>) {
		const normalizedReasons = [];
		for (const [reason, reasonInfo] of Object.entries(reasons)) {
			const variants = [];
			for (const { kanaIn, kanaOut, rulesIn, rulesOut } of reasonInfo) {
				variants.push([
					kanaIn,
					kanaOut,
					this.rulesToRuleFlags(rulesIn),
					this.rulesToRuleFlags(rulesOut),
				]);
			}
			normalizedReasons.push([reason, variants]);
		}
		return normalizedReasons;
	}

	private static rulesToRuleFlags(rules: string[]) {
		let value = 0;
		for (const rule of rules) {
			const ruleBits = RULE_TYPES.get(rule);
			if (typeof ruleBits === "undefined") {
				continue;
			}
			value |= ruleBits;
		}
		return value;
	}
}
