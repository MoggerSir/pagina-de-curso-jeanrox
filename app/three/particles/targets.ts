const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export function createCloudPositions(count: number) {
	const cloud = new Float32Array(count * 3);

	for (let index = 0; index < count; index += 1) {
		const offset = index * 3;
		const angle = randomBetween(0, Math.PI * 2);
		const radius = Math.random() ** 0.58;
		const tendril = Math.sin(angle * 3 + index * 0.037) * (0.18 + radius * 0.42);
		cloud[offset] = Math.cos(angle) * radius * 4.8 + tendril;
		cloud[offset + 1] = Math.sin(angle) * radius * 3.35 + Math.cos(index * 0.071) * 0.32;
		cloud[offset + 2] = randomBetween(-2.15, 2.15) * (1 - radius * 0.28);
	}

	return cloud;
}
