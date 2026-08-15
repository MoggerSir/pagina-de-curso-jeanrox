import { describe, expect, it } from "vitest";
import { selectParticleQuality } from "./quality";

describe("selectParticleQuality", () => {
	it("uses a static fallback when motion is reduced", () => {
		expect(selectParticleQuality({ reducedMotion: true, saveData: false, width: 1440 })).toBe(
			"static",
		);
	});

	it("respects save-data", () => {
		expect(selectParticleQuality({ reducedMotion: false, saveData: true, width: 1440 })).toBe(
			"static",
		);
	});

	it("selects low quality on constrained phones", () => {
		expect(
			selectParticleQuality({
				reducedMotion: false,
				saveData: false,
				width: 390,
				deviceMemory: 2,
			}),
		).toBe("low");
	});

	it("selects medium quality for tablets or low core counts", () => {
		expect(
			selectParticleQuality({
				reducedMotion: false,
				saveData: false,
				width: 900,
				hardwareConcurrency: 8,
			}),
		).toBe("medium");
	});

	it("selects high quality only when the available hints allow it", () => {
		expect(
			selectParticleQuality({
				reducedMotion: false,
				saveData: false,
				width: 1440,
				deviceMemory: 8,
				hardwareConcurrency: 12,
			}),
		).toBe("high");
	});
});
