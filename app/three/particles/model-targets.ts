const HEADER_BYTES = 16;
const EXPECTED_MAGIC = "PTG1";

export function decodeParticleTargets(buffer: ArrayBuffer, requestedCount: number) {
	const view = new DataView(buffer);
	if (view.byteLength < HEADER_BYTES) throw new Error("Particle target file is incomplete");

	const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
	if (magic !== EXPECTED_MAGIC) throw new Error("Particle target file has an invalid signature");

	const storedCount = view.getUint32(4, true);
	const targetCount = view.getUint32(8, true);
	const quantizationScale = view.getFloat32(12, true);
	const count = Math.min(requestedCount, storedCount);
	const valuesPerStoredTarget = storedCount * 3;
	const expectedBytes =
		HEADER_BYTES + targetCount * valuesPerStoredTarget * Int16Array.BYTES_PER_ELEMENT;

	if (view.byteLength !== expectedBytes || targetCount < 1 || quantizationScale <= 0) {
		throw new Error("Particle target metadata does not match its payload");
	}

	const targets: Float32Array[] = [];
	for (let targetIndex = 0; targetIndex < targetCount; targetIndex += 1) {
		const target = new Float32Array(count * 3);
		const targetByteOffset =
			HEADER_BYTES + targetIndex * valuesPerStoredTarget * Int16Array.BYTES_PER_ELEMENT;
		for (let valueIndex = 0; valueIndex < target.length; valueIndex += 1) {
			target[valueIndex] =
				view.getInt16(targetByteOffset + valueIndex * Int16Array.BYTES_PER_ELEMENT, true) /
				quantizationScale;
		}
		targets.push(target);
	}

	return targets;
}

export async function loadParticleTargets(requestedCount: number) {
	// BASE_URL respeta el prefijo del despliegue: "/" en Workers y la subruta
	// del repositorio en GitHub Pages. Siempre termina en barra.
	const response = await fetch(`${import.meta.env.BASE_URL}assets/particle-targets.v2.bin`);
	if (!response.ok) {
		throw new Error(`Unable to load particle targets (${String(response.status)})`);
	}
	return decodeParticleTargets(await response.arrayBuffer(), requestedCount);
}
