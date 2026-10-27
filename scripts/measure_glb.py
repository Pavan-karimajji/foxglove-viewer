# Copyright (c) LT EPS. All Rights Reserved.
# Proprietary and Confidential.
# COMPONENT: FOXGLOVE_VIEWER
# @file measure_glb.py
# @brief Prints the bounding box of a .glb from its POSITION accessor min/max (feeds the MODEL_* specs in src/style.ts).
# @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

"""Usage: py -3 scripts/measure_glb.py assets/car_q.glb [more.glb ...]

Reads the GLB's JSON chunk only (stdlib, no mesh decoding). It walks the scene's node tree, composes every
node's transform (translation, rotation, scale or a full matrix) and transforms the eight corners of each
primitive's POSITION accessor min/max, so models with rotated or scaled nodes are measured too. The box is
exact for parts aligned with the axes and slightly loose for rotated ones. glTF is right-handed, +Y up:
width = X extent, height = Y extent, length = Z extent. Which way is forward is NOT in the file: read it off
the model itself, and record it next to the constants in src/style.ts.

A model with a `skins` entry is flagged: Foxglove draws skinned models wrongly, so none may be embedded.
"""
import json
import struct
import sys


def read_json_chunk(path):
    with open(path, "rb") as f:
        magic, version, _length = struct.unpack("<4sII", f.read(12))
        if magic != b"glTF" or version != 2:
            raise SystemExit(f"{path}: not a glTF 2 binary")
        chunk_length, chunk_type = struct.unpack("<II", f.read(8))
        if chunk_type != 0x4E4F534A:  # "JSON"
            raise SystemExit(f"{path}: first chunk is not JSON")
        return json.loads(f.read(chunk_length))


IDENTITY = [[1.0 if r == c else 0.0 for c in range(4)] for r in range(4)]


def mat_mul(a, b):
    return [[sum(a[r][k] * b[k][c] for k in range(4)) for c in range(4)] for r in range(4)]


def local_matrix(node):
    """Row-major 4x4 of one node: its `matrix` (glTF stores it column-major), else T * R * S."""
    if "matrix" in node:
        m = node["matrix"]
        return [[m[c * 4 + r] for c in range(4)] for r in range(4)]
    tx, ty, tz = node.get("translation", [0.0, 0.0, 0.0])
    x, y, z, w = node.get("rotation", [0.0, 0.0, 0.0, 1.0])
    sx, sy, sz = node.get("scale", [1.0, 1.0, 1.0])
    rot = [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ]
    scale = (sx, sy, sz)
    return [
        [rot[0][0] * scale[0], rot[0][1] * scale[1], rot[0][2] * scale[2], tx],
        [rot[1][0] * scale[0], rot[1][1] * scale[1], rot[1][2] * scale[2], ty],
        [rot[2][0] * scale[0], rot[2][1] * scale[1], rot[2][2] * scale[2], tz],
        [0.0, 0.0, 0.0, 1.0],
    ]


def bounds(gltf):
    lo, hi = [float("inf")] * 3, [float("-inf")] * 3
    nodes = gltf["nodes"]

    def walk(index, parent):
        node = nodes[index]
        world = mat_mul(parent, local_matrix(node))
        if "mesh" in node:
            for prim in gltf["meshes"][node["mesh"]]["primitives"]:
                acc = gltf["accessors"][prim["attributes"]["POSITION"]]
                for cx in (acc["min"][0], acc["max"][0]):
                    for cy in (acc["min"][1], acc["max"][1]):
                        for cz in (acc["min"][2], acc["max"][2]):
                            for i in range(3):
                                v = world[i][0] * cx + world[i][1] * cy + world[i][2] * cz + world[i][3]
                                lo[i] = min(lo[i], v)
                                hi[i] = max(hi[i], v)
        for child in node.get("children", []):
            walk(child, world)

    for root in gltf["scenes"][gltf.get("scene", 0)]["nodes"]:
        walk(root, IDENTITY)
    return lo, hi


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    for path in sys.argv[1:]:
        gltf = read_json_chunk(path)
        lo, hi = bounds(gltf)
        print(path)
        for axis, a, b in zip("XYZ", lo, hi):
            print(f"  {axis}: min {a:+.4f}  max {b:+.4f}  extent {b - a:.4f}")
        print(
            f"  width {hi[0] - lo[0]:.4f}  height {hi[1] - lo[1]:.4f}  length {hi[2] - lo[2]:.4f}  "
            f"minUp {lo[1]:+.4f}  centreAlongZ {(lo[2] + hi[2]) / 2:+.4f}"
        )
        print(f"  skins: {len(gltf.get('skins', []))}" + ("  <-- SKINNED, do not embed" if gltf.get("skins") else ""))


if __name__ == "__main__":
    main()
