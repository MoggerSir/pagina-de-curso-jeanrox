export type ParticleQuality = "static" | "low" | "medium" | "high";

export type DeviceSignals = {
	reducedMotion: boolean;
	saveData: boolean;
	width: number;
	deviceMemory?: number;
	hardwareConcurrency?: number;
};

export type QualityProfile = {
	count: number;
	dpr: number;
	targetFps: number;
};

export const QUALITY_PROFILES: Record<ParticleQuality, QualityProfile> = {
	static: { count: 0, dpr: 1, targetFps: 0 },
	low: { count: 5_000, dpr: 1, targetFps: 30 },
	medium: { count: 11_000, dpr: 1.2, targetFps: 45 },
	high: { count: 18_000, dpr: 1.5, targetFps: 60 },
};

export function selectParticleQuality(signals: DeviceSignals): ParticleQuality {
	if (signals.reducedMotion || signals.saveData) return "static";
	if (signals.width < 480 || (signals.deviceMemory !== undefined && signals.deviceMemory <= 2)) {
		return "low";
	}
	if (
		signals.width < 1024 ||
		(signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= 4)
	) {
		return "medium";
	}
	return "high";
}
