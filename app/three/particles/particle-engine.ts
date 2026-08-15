import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	PerspectiveCamera,
	Points,
	Scene,
	ShaderMaterial,
	Vector2,
	WebGLRenderer,
} from "three";
import { loadParticleTargets } from "./model-targets";
import { createCloudPositions } from "./targets";
import type { QualityProfile } from "./quality";

type EngineOptions = {
	canvas: HTMLCanvasElement;
	profile: QualityProfile;
};

type MorphPhase = "initial" | "shape" | "disperse" | "cloud" | "assemble";

const INITIAL_ASSEMBLY_MS = 2_700;
const SHAPE_HOLD_MS = 3_600;
const DISPERSE_MS = 2_150;
const CLOUD_HOLD_MS = 850;
const ASSEMBLE_MS = 2_450;
const SHAPE_NAMES = ["skull", "capsule", "hammer"] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smootherStep = (value: number) => {
	const progress = clamp01(value);
	return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
};

export async function createParticleEngine({ canvas, profile }: EngineOptions) {
	const shapeTargets = await loadParticleTargets(profile.count);
	const cloudTarget = createCloudPositions(profile.count);
	const renderer = new WebGLRenderer({
		canvas,
		alpha: true,
		antialias: false,
		powerPreference: "high-performance",
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.dpr));
	renderer.setClearColor(new Color(0x050505), 0);

	const scene = new Scene();
	const camera = new PerspectiveCamera(40, 1, 0.1, 100);
	camera.position.set(0, 0.2, 12);

	const geometry = new BufferGeometry();
	const position = new BufferAttribute(cloudTarget.slice(), 3);
	const targetPosition = new BufferAttribute(shapeTargets[0].slice(), 3);
	const colors = new Float32Array(profile.count * 3);
	const phases = new Float32Array(profile.count);
	for (let index = 0; index < profile.count; index += 1) {
		const offset = index * 3;
		const shapeX = shapeTargets[0][offset];
		const accentPoint = index % 7 < 2;
		const spatialGlow = Math.max(0, Math.cos(shapeX * 1.15 + index * 0.055));
		const redWeight = accentPoint ? 1 : spatialGlow ** 4 * 0.5;
		colors[offset] = 1;
		colors[offset + 1] = 1 - redWeight * 0.98;
		colors[offset + 2] = 1 - redWeight * 0.9;
		phases[index] = Math.random();
	}
	geometry.setAttribute("position", position);
	geometry.setAttribute("aTargetPosition", targetPosition);
	geometry.setAttribute("color", new BufferAttribute(colors, 3));
	geometry.setAttribute("aPhase", new BufferAttribute(phases, 1));

	const pointerUniform = new Vector2(0, 0);
	const uniforms = {
		uPointSize: { value: profile.count > 12_000 ? 0.11 : 0.13 },
		uTime: { value: 0 },
		uMorph: { value: 0 },
		uDustiness: { value: 1 },
		uPointer: { value: pointerUniform },
		uPointerStrength: { value: 0 },
	};
	const material = new ShaderMaterial({
		uniforms,
		vertexShader: `
			attribute vec3 color;
			attribute vec3 aTargetPosition;
			attribute float aPhase;
			varying vec3 vColor;
			varying float vEnergy;
			uniform float uPointSize;
			uniform float uTime;
			uniform float uMorph;
			uniform float uDustiness;
			uniform vec2 uPointer;
			uniform float uPointerStrength;
			void main() {
				vColor = color;
				float phase = aPhase * 6.2831853;
				float drift = 0.76 + uDustiness * 1.18;
				vec3 animatedPosition = mix(position, aTargetPosition, uMorph);
				animatedPosition.x += sin(uTime * 0.62 + phase + animatedPosition.y * 0.55) * 0.14 * drift;
				animatedPosition.x += cos(uTime * 0.29 + phase * 1.7) * 0.055 * drift;
				animatedPosition.y += cos(uTime * 0.78 + phase + animatedPosition.x * 0.4) * 0.115 * drift;
				animatedPosition.y += sin(uTime * 0.36 + phase * 1.3) * 0.045 * drift;
				animatedPosition.z += sin(uTime * 0.5 + phase) * 0.18 * drift;
				animatedPosition.xy += vec2(
					cos(uTime * 0.22 + phase * 0.7),
					sin(uTime * 0.19 + phase * 0.8)
				) * uDustiness * 0.085;

				// Dos semillas estables y decorreladas por partícula: rompen el frente
				// circular que produciría una repulsión puramente radial.
				float grainA = fract(aPhase * 17.31);
				float grainB = fract(aPhase * 43.77);

				vec2 pointerDelta = animatedPosition.xy - uPointer;
				float pointerDistance = length(pointerDelta);
				// El puntero vive en el plano z = 0: sin esta caída el aura sería un
				// cilindro infinito y las partículas del fondo saldrían disparadas igual.
				float depthFalloff = 1.0 - smoothstep(0.35, 2.1, abs(animatedPosition.z));
				// Contorno lobulado y en movimiento lento en lugar de un radio constante.
				float pointerAngle = atan(pointerDelta.y, pointerDelta.x);
				float lobes =
					sin(pointerAngle * 3.0 + uTime * 0.53) * 0.15 +
					sin(pointerAngle * 5.0 - uTime * 0.29 + phase) * 0.08;
				float reach = 0.82 * (0.7 + grainA * 0.55 + lobes);
				float falloff = smoothstep(reach, reach * 0.1, pointerDistance);
				float repulsion = falloff * uPointerStrength * depthFalloff * (0.45 + grainB);
				// Componente tangencial con signo propio: las partículas rodean el cursor
				// en vez de huir en línea recta desde el centro.
				float swirl = (grainB - 0.5) * 1.15 + sin(uTime * 0.71 + phase) * 0.22;
				vec2 tangent = vec2(-pointerDelta.y, pointerDelta.x);
				vec2 dustDirection = normalize(
					pointerDelta + tangent * swirl + vec2(cos(phase * 3.1), sin(phase * 2.3)) * 0.24
				);
				animatedPosition.xy += dustDirection * repulsion * 0.4;
				animatedPosition.z += repulsion * sin(phase * 3.7) * 0.26;
				float depthShade = mix(0.16, 1.08, smoothstep(-1.35, 1.35, animatedPosition.z));
				vEnergy = (0.82 + sin(uTime * 1.35 + phase) * 0.12 + repulsion * 0.22) * depthShade;

				vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
				gl_Position = projectionMatrix * viewPosition;
				gl_PointSize = uPointSize * (0.9 + vEnergy * 0.15) * (300.0 / -viewPosition.z);
			}
		`,
		fragmentShader: `
			varying vec3 vColor;
			varying float vEnergy;
			void main() {
				float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
				float glow = 1.0 - smoothstep(0.08, 0.5, distanceToCenter);
				float core = 1.0 - smoothstep(0.0, 0.16, distanceToCenter);
				float alpha = (glow * 0.72 + core * 0.65) * vEnergy;
				if (alpha < 0.02) discard;
				gl_FragColor = vec4(vColor * (1.1 + core * 0.55 + vEnergy * 0.08), alpha);
			}
		`,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
	});
	const cloud = new Points(geometry, material);
	scene.add(cloud);

	let active = true;
	let visible = true;
	let phase: MorphPhase = "initial";
	let phaseStartedAt = performance.now();
	let currentShapeIndex = 0;
	let lastFrame = 0;
	let pointerX = 0;
	let pointerY = 0;
	let pointerTargetX = 0;
	let pointerTargetY = 0;
	let pointerStrength = 0;
	let pointerTargetStrength = 0;
	const frameInterval = 1000 / profile.targetFps;
	const startedAt = performance.now();
	const finePointer = window.matchMedia("(pointer: fine)");
	canvas.dataset.particlePhase = phase;
	canvas.dataset.particleShape = SHAPE_NAMES[currentShapeIndex];

	const setTransitionTargets = (from: Float32Array, to: Float32Array) => {
		(position.array as Float32Array).set(from);
		(targetPosition.array as Float32Array).set(to);
		position.needsUpdate = true;
		targetPosition.needsUpdate = true;
		uniforms.uMorph.value = 0;
	};

	const setPhase = (nextPhase: MorphPhase, time: number) => {
		phase = nextPhase;
		phaseStartedAt = time;
		canvas.dataset.particlePhase = phase;
		canvas.dataset.particleShape = SHAPE_NAMES[currentShapeIndex];
	};

	const updateMorphCycle = (time: number) => {
		const phaseElapsed = time - phaseStartedAt;
		if (phase === "initial") {
			const progress = smootherStep(phaseElapsed / INITIAL_ASSEMBLY_MS);
			uniforms.uMorph.value = progress;
			uniforms.uDustiness.value = 1 - progress * 0.84;
			if (progress >= 1) setPhase("shape", time);
			return;
		}

		if (phase === "shape") {
			uniforms.uMorph.value = 1;
			uniforms.uDustiness.value = 0.16;
			if (phaseElapsed >= SHAPE_HOLD_MS) {
				setTransitionTargets(shapeTargets[currentShapeIndex], cloudTarget);
				setPhase("disperse", time);
			}
			return;
		}

		if (phase === "disperse") {
			const progress = smootherStep(phaseElapsed / DISPERSE_MS);
			uniforms.uMorph.value = progress;
			uniforms.uDustiness.value = 0.16 + progress * 0.84;
			if (progress >= 1) setPhase("cloud", time);
			return;
		}

		if (phase === "cloud") {
			uniforms.uMorph.value = 1;
			uniforms.uDustiness.value = 1;
			if (phaseElapsed >= CLOUD_HOLD_MS) {
				currentShapeIndex = (currentShapeIndex + 1) % shapeTargets.length;
				setTransitionTargets(cloudTarget, shapeTargets[currentShapeIndex]);
				setPhase("assemble", time);
			}
			return;
		}

		const progress = smootherStep(phaseElapsed / ASSEMBLE_MS);
		uniforms.uMorph.value = progress;
		uniforms.uDustiness.value = 1 - progress * 0.84;
		if (progress >= 1) setPhase("shape", time);
	};

	const resize = () => {
		const { clientWidth, clientHeight } = canvas;
		if (clientWidth === 0 || clientHeight === 0) return;
		renderer.setSize(clientWidth, clientHeight, false);
		camera.aspect = clientWidth / clientHeight;
		camera.updateProjectionMatrix();
	};

	const handlePointerMove = (event: PointerEvent) => {
		if (!finePointer.matches || event.pointerType === "touch") return;
		const rect = canvas.getBoundingClientRect();
		const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const normalizedY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
		const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
		pointerTargetX = normalizedX * ((visibleHeight * camera.aspect) / 2) - cloud.position.x;
		pointerTargetY = camera.position.y + normalizedY * (visibleHeight / 2) - cloud.position.y;
		pointerTargetStrength = 1;
	};

	const handlePointerLeave = () => {
		pointerTargetStrength = 0;
	};

	const render = (time: number) => {
		if (!active || !visible || document.hidden || time - lastFrame < frameInterval) return;
		lastFrame = time;
		updateMorphCycle(time);
		const elapsed = (time - startedAt) * 0.001;
		pointerX += (pointerTargetX - pointerX) * 0.16;
		pointerY += (pointerTargetY - pointerY) * 0.16;
		pointerStrength += (pointerTargetStrength - pointerStrength) * 0.12;
		uniforms.uTime.value = elapsed;
		pointerUniform.set(pointerX, pointerY);
		uniforms.uPointerStrength.value = pointerStrength;
		const dustiness = uniforms.uDustiness.value;
		cloud.rotation.y = Math.sin(elapsed * 0.24) * (0.12 + dustiness * 0.06);
		cloud.rotation.z = Math.sin(elapsed * 0.19) * (0.018 + dustiness * 0.018);
		cloud.position.x = Math.sin(elapsed * 0.31) * (0.07 + dustiness * 0.05);
		cloud.position.y = Math.sin(elapsed * 0.7) * (0.08 + dustiness * 0.05);
		renderer.render(scene, camera);
	};

	const observer = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
	});
	observer.observe(canvas);
	window.addEventListener("resize", resize, { passive: true });
	canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
	canvas.addEventListener("pointerleave", handlePointerLeave, { passive: true });
	resize();
	renderer.setAnimationLoop(render);

	return () => {
		active = false;
		observer.disconnect();
		window.removeEventListener("resize", resize);
		canvas.removeEventListener("pointermove", handlePointerMove);
		canvas.removeEventListener("pointerleave", handlePointerLeave);
		renderer.setAnimationLoop(null);
		geometry.dispose();
		material.dispose();
		renderer.dispose();
	};
}
