import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	LineSegments,
	PerspectiveCamera,
	Points,
	Scene,
	ShaderMaterial,
	WebGLRenderer,
} from "three";

/**
 * Campo de partículas del lector. Dos poblaciones:
 *
 *   · polvo: nube densa que viaja por el fondo siguiendo el desplazamiento;
 *   · fondo: puntos sueltos que flotan tras el texto enlazándose con sus
 *     vecinos, y que ganan presencia en las pausas de lectura.
 *
 * La reconstrucción de los modelos con partículas se retiró: costaba mucha
 * densidad para una silueta que nunca terminaba de leerse bien.
 */

export type PerfilLector = {
	polvo: number;
	fondo: number;
	dpr: number;
	fps: number;
};

export const PERFILES_LECTOR: Record<"apagado" | "bajo" | "medio" | "alto", PerfilLector> = {
	apagado: { polvo: 0, fondo: 0, dpr: 1, fps: 0 },
	bajo: { polvo: 1_600, fondo: 90, dpr: 1, fps: 30 },
	medio: { polvo: 3_400, fondo: 140, dpr: 1.2, fps: 45 },
	alto: { polvo: 5_500, fondo: 190, dpr: 1.5, fps: 60 },
};

type Opciones = {
	canvas: HTMLCanvasElement;
	perfil: PerfilLector;
};

export type ControlLector = {
	setCohesion: (valor: number) => void;
	empujar: (delta: number) => void;
	setScroll: (valor: number) => void;
	dispose: () => void;
};

const RADIO_FONDO = 1.5;
/** Un punto con demasiadas aristas convierte el dibujo en un ovillo. */
const MAX_ENLACES = 3;
const CAJA_X = 10;
const CAJA_Y = 7;
const CAJA_Z = 3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Red de proximidad con rejilla espacial y tope de aristas por punto. */
function crearRed(cuenta: number, radio: number, color: string) {
	const pos = new Float32Array(cuenta * 3);
	const grado = new Uint8Array(cuenta);
	const siguiente = new Int32Array(cuenta);
	const ancho = Math.ceil((CAJA_X * 2) / radio);
	const alto = Math.ceil((CAJA_Y * 2) / radio);
	const fondo = Math.ceil((CAJA_Z * 2) / radio);
	const cabeza = new Int32Array(ancho * alto * fondo);

	const maxSegmentos = cuenta * MAX_ENLACES;
	const lineaPos = new Float32Array(maxSegmentos * 6);
	const lineaAlfa = new Float32Array(maxSegmentos * 2);

	const geometriaLineas = new BufferGeometry();
	const atributoLinea = new BufferAttribute(lineaPos, 3);
	const atributoAlfa = new BufferAttribute(lineaAlfa, 1);
	atributoLinea.setUsage(35048); // DynamicDraw
	atributoAlfa.setUsage(35048);
	geometriaLineas.setAttribute("position", atributoLinea);
	geometriaLineas.setAttribute("aAlfa", atributoAlfa);

	const materialLineas = new ShaderMaterial({
		uniforms: { uIntensidad: { value: 1 } },
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		vertexShader: `
			attribute float aAlfa;
			varying float vAlfa;
			void main() {
				vAlfa = aAlfa;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			varying float vAlfa;
			uniform float uIntensidad;
			void main() {
				float a = vAlfa * uIntensidad;
				if (a < 0.004) discard;
				gl_FragColor = vec4(${color}, a);
			}
		`,
	});

	const geometriaPuntos = new BufferGeometry();
	geometriaPuntos.setAttribute("position", new BufferAttribute(pos, 3));
	const materialPuntos = new ShaderMaterial({
		uniforms: { uIntensidad: { value: 1 }, uTam: { value: 0.13 } },
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		vertexShader: `
			uniform float uTam;
			uniform float uIntensidad;
			varying float vI;
			void main() {
				vI = uIntensidad;
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				gl_Position = projectionMatrix * mv;
				gl_PointSize = uTam * (260.0 / -mv.z);
			}
		`,
		fragmentShader: `
			varying float vI;
			void main() {
				float d = distance(gl_PointCoord, vec2(0.5));
				float a = (1.0 - smoothstep(0.0, 0.5, d)) * vI;
				if (a < 0.01) discard;
				gl_FragColor = vec4(0.96, 0.97, 0.98, a * 0.9);
			}
		`,
	});

	const celdaDe = (v: number, limite: number, tope: number) =>
		Math.min(tope - 1, Math.max(0, Math.floor((v + limite) / radio)));

	const tejer = () => {
		cabeza.fill(-1);
		grado.fill(0);
		for (let i = 0; i < cuenta; i += 1) {
			const o = i * 3;
			const idx =
				(celdaDe(pos[o + 2], CAJA_Z, fondo) * alto + celdaDe(pos[o + 1], CAJA_Y, alto)) * ancho +
				celdaDe(pos[o], CAJA_X, ancho);
			siguiente[i] = cabeza[idx];
			cabeza[idx] = i;
		}

		const radio2 = radio * radio;
		let s = 0;
		for (let i = 0; i < cuenta && s < maxSegmentos; i += 1) {
			if (grado[i] >= MAX_ENLACES) continue;
			const o = i * 3;
			const cx = celdaDe(pos[o], CAJA_X, ancho);
			const cy = celdaDe(pos[o + 1], CAJA_Y, alto);
			const cz = celdaDe(pos[o + 2], CAJA_Z, fondo);

			for (let dz = -1; dz <= 1 && grado[i] < MAX_ENLACES; dz += 1) {
				const z = cz + dz;
				if (z < 0 || z >= fondo) continue;
				for (let dy = -1; dy <= 1 && grado[i] < MAX_ENLACES; dy += 1) {
					const y = cy + dy;
					if (y < 0 || y >= alto) continue;
					for (let dx = -1; dx <= 1 && grado[i] < MAX_ENLACES; dx += 1) {
						const x = cx + dx;
						if (x < 0 || x >= ancho) continue;
						for (
							let j = cabeza[(z * alto + y) * ancho + x];
							j !== -1 && grado[i] < MAX_ENLACES && s < maxSegmentos;
							j = siguiente[j]
						) {
							if (j <= i || grado[j] >= MAX_ENLACES) continue;
							const b = j * 3;
							const ex = pos[o] - pos[b];
							const ey = pos[o + 1] - pos[b + 1];
							const ez = pos[o + 2] - pos[b + 2];
							const d2 = ex * ex + ey * ey + ez * ez;
							if (d2 > radio2) continue;

							const alfa = 1 - Math.sqrt(d2) / radio;
							const p = s * 6;
							lineaPos[p] = pos[o];
							lineaPos[p + 1] = pos[o + 1];
							lineaPos[p + 2] = pos[o + 2];
							lineaPos[p + 3] = pos[b];
							lineaPos[p + 4] = pos[b + 1];
							lineaPos[p + 5] = pos[b + 2];
							lineaAlfa[s * 2] = alfa;
							lineaAlfa[s * 2 + 1] = alfa;
							s += 1;
							grado[i] += 1;
							grado[j] += 1;
						}
					}
				}
			}
		}
		geometriaLineas.setDrawRange(0, s * 2);
		atributoLinea.needsUpdate = true;
		atributoAlfa.needsUpdate = true;
		geometriaPuntos.attributes.position.needsUpdate = true;
	};

	return {
		pos,
		tejer,
		lineas: new LineSegments(geometriaLineas, materialLineas),
		puntos: new Points(geometriaPuntos, materialPuntos),
		setIntensidad: (v: number) => {
			materialLineas.uniforms.uIntensidad.value = v;
			materialPuntos.uniforms.uIntensidad.value = v;
		},
		dispose: () => {
			geometriaLineas.dispose();
			geometriaPuntos.dispose();
			materialLineas.dispose();
			materialPuntos.dispose();
		},
	};
}

export function crearCampoLector({ canvas, perfil }: Opciones): ControlLector {
	const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, perfil.dpr));
	renderer.setClearColor(new Color(0x050505), 0);

	const scene = new Scene();
	const camera = new PerspectiveCamera(42, 1, 0.1, 100);
	camera.position.set(0, 0, 13);

	// ── Polvo de fondo ──────────────────────────────────────────────────────
	const totalPolvo = perfil.polvo;
	const polvoPos = new Float32Array(totalPolvo * 3);
	const fases = new Float32Array(totalPolvo);
	const tonos = new Float32Array(totalPolvo);
	for (let i = 0; i < totalPolvo; i += 1) {
		const o = i * 3;
		polvoPos[o] = (Math.random() - 0.5) * 17;
		polvoPos[o + 1] = (Math.random() - 0.5) * 11;
		polvoPos[o + 2] = (Math.random() - 0.5) * 4.5;
		fases[i] = Math.random();
		tonos[i] = i % 11 === 0 ? 1 : 0;
	}
	const geometriaPolvo = new BufferGeometry();
	geometriaPolvo.setAttribute("position", new BufferAttribute(polvoPos, 3));
	geometriaPolvo.setAttribute("aFase", new BufferAttribute(fases, 1));
	geometriaPolvo.setAttribute("aTono", new BufferAttribute(tonos, 1));

	const uniformes = {
		uTiempo: { value: 0 },
		uEmpuje: { value: 0 },
		uScroll: { value: 0 },
	};
	const materialPolvo = new ShaderMaterial({
		uniforms: uniformes,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending,
		vertexShader: `
			attribute float aFase;
			attribute float aTono;
			uniform float uTiempo;
			uniform float uEmpuje;
			uniform float uScroll;
			varying float vBrillo;
			varying float vTono;
			void main() {
				vTono = aTono;
				float fase = aFase * 6.2831853;
				vec3 p = position;
				p.x += sin(uTiempo * 0.21 + fase) * 0.26;
				p.y += cos(uTiempo * 0.17 + fase * 1.3) * 0.22;
				p.y += uEmpuje * (0.4 + aFase * 0.8);
				p.z += sin(uTiempo * 0.13 + fase * 0.7) * 0.3;

				// Acompaña al scroll: las de delante corren más que las del fondo y,
				// al salir por un borde, reaparecen por el contrario.
				float ALTO = 13.0;
				float parallax = 0.35 + aFase * 1.15;
				p.y = mod(p.y + uScroll * parallax + ALTO * 0.5, ALTO) - ALTO * 0.5;
				p.x += sin(p.y * 0.55 + uScroll * 0.22 + fase) * 0.42;

				vec4 mv = modelViewMatrix * vec4(p, 1.0);
				gl_Position = projectionMatrix * mv;
				float prof = smoothstep(-3.0, 3.0, p.z);
				vBrillo = 0.45 + prof * 0.6;
				gl_PointSize = 0.075 * (260.0 / -mv.z) * (0.7 + prof * 0.6);
			}
		`,
		fragmentShader: `
			varying float vBrillo;
			varying float vTono;
			void main() {
				float d = distance(gl_PointCoord, vec2(0.5));
				float halo = 1.0 - smoothstep(0.06, 0.5, d);
				float nucleo = 1.0 - smoothstep(0.0, 0.2, d);
				float alfa = (halo * 0.5 + nucleo * 0.7) * vBrillo;
				if (alfa < 0.015) discard;
				vec3 color = mix(vec3(0.93, 0.95, 0.96), vec3(0.85, 0.08, 0.2), vTono);
				gl_FragColor = vec4(color * (0.9 + nucleo * 0.5), alfa);
			}
		`,
	});
	scene.add(new Points(geometriaPolvo, materialPolvo));

	// ── Red del modelo y red del fondo ──────────────────────────────────────
	const fondo = crearRed(perfil.fondo, RADIO_FONDO, "0.72, 0.77, 0.82");
	scene.add(fondo.lineas, fondo.puntos);

	const fondoVel = new Float32Array(perfil.fondo * 3);
	for (let i = 0; i < perfil.fondo; i += 1) {
		const o = i * 3;
		fondo.pos[o] = (Math.random() - 0.5) * 16;
		fondo.pos[o + 1] = (Math.random() - 0.5) * 10;
		fondo.pos[o + 2] = (Math.random() - 0.5) * 3;
		fondoVel[o] = (Math.random() - 0.5) * 0.01;
		fondoVel[o + 1] = (Math.random() - 0.5) * 0.01;
		fondoVel[o + 2] = (Math.random() - 0.5) * 0.005;
	}

	// ── Estado ──────────────────────────────────────────────────────────────
	let cohesionObjetivo = 0;
	let cohesion = 0;
	let empuje = 0;
	let scrollObjetivo = 0;
	let scrollSuave = 0;
	let activo = true;
	let visible = true;
	let ultimoFrame = 0;
	const intervalo = 1000 / perfil.fps;
	const inicio = performance.now();

	const redimensionar = () => {
		const { clientWidth, clientHeight } = canvas;
		if (clientWidth === 0 || clientHeight === 0) return;
		renderer.setSize(clientWidth, clientHeight, false);
		camera.aspect = clientWidth / clientHeight;
		camera.updateProjectionMatrix();
	};

	const dibujar = (tiempo: number) => {
		if (!activo || !visible || document.hidden || tiempo - ultimoFrame < intervalo) return;
		ultimoFrame = tiempo;
		const t = (tiempo - inicio) * 0.001;

		cohesion += (cohesionObjetivo - cohesion) * 0.045;
		empuje *= 0.9;
		scrollSuave += (scrollObjetivo - scrollSuave) * 0.09;
		uniformes.uTiempo.value = t;
		uniformes.uEmpuje.value = empuje;
		uniformes.uScroll.value = scrollSuave;

		const forma = clamp01(cohesion);

		// Fondo: deriva libre con rebote en los bordes.
		for (let i = 0; i < perfil.fondo; i += 1) {
			const o = i * 3;
			fondo.pos[o] += fondoVel[o] + Math.sin(t * 0.29 + i) * 0.0018;
			fondo.pos[o + 1] += fondoVel[o + 1] + Math.cos(t * 0.23 + i * 1.7) * 0.0018 + empuje * 0.05;
			fondo.pos[o + 2] += fondoVel[o + 2];
			if (Math.abs(fondo.pos[o]) > 8.6) fondoVel[o] *= -1;
			if (Math.abs(fondo.pos[o + 1]) > 5.4) fondoVel[o + 1] *= -1;
			if (Math.abs(fondo.pos[o + 2]) > 1.9) fondoVel[o + 2] *= -1;
		}

		fondo.tejer();
		// En las pausas de lectura la red respira un poco más fuerte.
		fondo.setIntensidad(0.4 + forma * 0.45);
		renderer.render(scene, camera);
	};

	const observador = new IntersectionObserver(([entrada]) => {
		visible = entrada.isIntersecting;
	});
	observador.observe(canvas);
	window.addEventListener("resize", redimensionar, { passive: true });
	redimensionar();
	renderer.setAnimationLoop(dibujar);

	return {
		setCohesion: (valor) => {
			cohesionObjetivo = clamp01(valor);
		},
		empujar: (delta) => {
			empuje = Math.max(-0.55, Math.min(0.55, empuje + delta));
		},
		setScroll: (valor) => {
			scrollObjetivo = valor;
		},
		dispose: () => {
			activo = false;
			observador.disconnect();
			window.removeEventListener("resize", redimensionar);
			renderer.setAnimationLoop(null);
			geometriaPolvo.dispose();
			materialPolvo.dispose();
			fondo.dispose();
			renderer.dispose();
		},
	};
}
