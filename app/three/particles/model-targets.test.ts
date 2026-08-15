import { describe, expect, it } from "vitest";
import { decodeParticleTargets } from "./model-targets";

function createFixture() {
	const storedCount = 2;
	const targetCount = 2;
	const scale = 100;
	const values = [100, -50, 25, 200, 0, -100, -200, 75, 50, 25, 125, -75];
	const buffer = new ArrayBuffer(16 + values.length * Int16Array.BYTES_PER_ELEMENT);
	const view = new DataView(buffer);
	for (const [index, byte] of [80, 84, 71, 49].entries()) {
		view.setUint8(index, byte);
	}
	view.setUint32(4, storedCount, true);
	view.setUint32(8, targetCount, true);
	view.setFloat32(12, scale, true);
	values.forEach((value, index) => {
		view.setInt16(16 + index * Int16Array.BYTES_PER_ELEMENT, value, true);
	});
	return buffer;
}

describe("decodeParticleTargets", () => {
	it("decodes and downsamples every stored target", () => {
		const targets = decodeParticleTargets(createFixture(), 1);

		expect(targets).toHaveLength(2);
		expect([...targets[0]]).toEqual([1, -0.5, 0.25]);
		expect([...targets[1]]).toEqual([-2, 0.75, 0.5]);
	});

	it("rejects files with an invalid signature", () => {
		const fixture = createFixture();
		new DataView(fixture).setUint8(0, 0);

		expect(() => decodeParticleTargets(fixture, 1)).toThrow("invalid signature");
	});
});
