"""Sample GLB surfaces and write compact, browser-ready particle targets.

Run with Blender:
  blender --background --python scripts/export-particle-targets.py -- \
    --output public/assets/particle-targets.bin model-1.glb model-2.glb model-3.glb
"""

from __future__ import annotations

import argparse
import bisect
import math
import random
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


MAGIC = b"PTG1"
POINT_COUNT = 18_000
QUANTIZATION_SCALE = 6_000.0
MAX_WIDTH = 5.6
MAX_HEIGHT = 5.6
DEPTH_FACTOR = 0.44


def parse_args() -> argparse.Namespace:
	argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
	parser = argparse.ArgumentParser()
	parser.add_argument("models", nargs="+")
	parser.add_argument("--output", required=True)
	parser.add_argument("--count", type=int, default=POINT_COUNT)
	return parser.parse_args(argv)


def import_model(filepath: str):
	bpy.ops.wm.read_factory_settings(use_empty=True)
	bpy.ops.import_scene.gltf(filepath=filepath)
	mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
	if not mesh_objects:
		raise RuntimeError(f"No mesh found in {filepath}")
	return mesh_objects


def collect_triangles(mesh_objects):
	depsgraph = bpy.context.evaluated_depsgraph_get()
	triangles: list[tuple[Vector, Vector, Vector, float]] = []
	all_vertices: list[Vector] = []

	for source_object in mesh_objects:
		evaluated_object = source_object.evaluated_get(depsgraph)
		mesh = evaluated_object.to_mesh()
		mesh.calc_loop_triangles()
		matrix = evaluated_object.matrix_world

		for triangle in mesh.loop_triangles:
			a, b, c = (matrix @ mesh.vertices[index].co for index in triangle.vertices)
			area = (b - a).cross(c - a).length * 0.5
			if area > 1e-9:
				triangles.append((a.copy(), b.copy(), c.copy(), area))
				all_vertices.extend((a.copy(), b.copy(), c.copy()))

		evaluated_object.to_mesh_clear()

	if not triangles:
		raise RuntimeError("The imported model has no sampleable triangles")

	return triangles, all_vertices


def sample_surface(filepath: str, count: int, seed: int, front_bias: bool = False):
	triangles, vertices = collect_triangles(import_model(filepath))
	minimum = Vector((min(v.x for v in vertices), min(v.y for v in vertices), min(v.z for v in vertices)))
	maximum = Vector((max(v.x for v in vertices), max(v.y for v in vertices), max(v.z for v in vertices)))
	center = (minimum + maximum) * 0.5
	dimensions = maximum - minimum
	# glTF's front-facing plane maps to Blender X/Z after import. Keep Y as depth
	# so silhouettes match Blender's front preview in the Three.js camera.
	scale = min(MAX_WIDTH / max(dimensions.x, 1e-6), MAX_HEIGHT / max(dimensions.z, 1e-6))

	cumulative_areas: list[float] = []
	total_area = 0.0
	average_area = sum(triangle[3] for triangle in triangles) / len(triangles)
	for a, b, c, area in triangles:
		weight = area
		if front_bias:
			# Blender's front view looks toward +Y from the negative Y side. Favor that
			# surface heavily, while retaining a small rear contribution for volume.
			centroid_y = (a.y + b.y + c.y) / 3.0
			front_depth = 1.0 - ((centroid_y - minimum.y) / max(dimensions.y, 1e-6))
			normal = (b - a).cross(c - a).normalized()
			front_facing = max(0.0, -normal.y)
			visibility = 0.055 + 4.5 * (front_depth**4) + 1.4 * (front_facing**2)
			# Mix area weighting with topology weighting so small triangles around the
			# eyes, nose and teeth receive enough particles to remain legible.
			weight = (area * 0.7 + average_area * 0.3) * visibility
		total_area += weight
		cumulative_areas.append(total_area)

	rng = random.Random(seed)
	positions: list[tuple[float, float, float]] = []
	for _ in range(count):
		triangle_index = bisect.bisect_left(cumulative_areas, rng.random() * total_area)
		a, b, c, _ = triangles[min(triangle_index, len(triangles) - 1)]
		sqrt_r1 = math.sqrt(rng.random())
		r2 = rng.random()
		point = (1.0 - sqrt_r1) * a + sqrt_r1 * (1.0 - r2) * b + sqrt_r1 * r2 * c
		centered = point - center
		positions.append((centered.x * scale, centered.z * scale, -centered.y * scale * DEPTH_FACTOR))

	return positions, dimensions


def quantize(value: float) -> int:
	return max(-32767, min(32767, round(value * QUANTIZATION_SCALE)))


def main() -> None:
	args = parse_args()
	if len(args.models) != 3:
		raise ValueError("Exactly three model paths are required")

	targets = []
	for index, model_path in enumerate(args.models):
		positions, dimensions = sample_surface(
			model_path,
			args.count,
			seed=0x5EED + index * 997,
			front_bias=index == 0,
		)
		targets.append(positions)
		print(
			f"sampled {Path(model_path).name}: {args.count} points, "
			f"dimensions=({dimensions.x:.3f}, {dimensions.y:.3f}, {dimensions.z:.3f})"
		)

	output_path = Path(args.output).resolve()
	output_path.parent.mkdir(parents=True, exist_ok=True)
	with output_path.open("wb") as output:
		output.write(struct.pack("<4sIIf", MAGIC, args.count, len(targets), QUANTIZATION_SCALE))
		for target in targets:
			for point in target:
				output.write(struct.pack("<hhh", *(quantize(component) for component in point)))

	print(f"wrote {output_path} ({output_path.stat().st_size} bytes)")


if __name__ == "__main__":
	main()
