# Copyright (c) LT EPS. All Rights Reserved.
# Proprietary and Confidential.
# COMPONENT: FOXGLOVE_VIEWER
# @file measure_glb.py
# @brief Prints the bounding box of a .glb from its POSITION accessor min/max (feeds EGO_MODEL_NATIVE_* in src/style.ts).
# @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

"""Usage: py -3 scripts/measure_glb.py assets/ego_car.glb

Reads the GLB's JSON chunk only (stdlib, no mesh decoding): for every node with a mesh it takes each
primitive's POSITION accessor min/max, adds the node's translation, and takes the union. glTF is
right-handed, +Y up. Which way is forward is NOT in the file: read it off the printed extents and the
model itself, and record it next to the constants in src/style.ts.
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


def bounds(gltf):
    lo, hi = [float("inf")] * 3, [float("-inf")] * 3
    for node in gltf["nodes"]:
        if "mesh" not in node:
            continue
        if "rotation" in node or "scale" in node or "matrix" in node:
            raise SystemExit(f"node {node.get('name')}: rotation/scale/matrix not handled by this script")
        t = node.get("translation", [0.0, 0.0, 0.0])
        for prim in gltf["meshes"][node["mesh"]]["primitives"]:
            acc = gltf["accessors"][prim["attributes"]["POSITION"]]
            for i in range(3):
                lo[i] = min(lo[i], acc["min"][i] + t[i])
                hi[i] = max(hi[i], acc["max"][i] + t[i])
    return lo, hi


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    lo, hi = bounds(read_json_chunk(sys.argv[1]))
    for axis, a, b in zip("XYZ", lo, hi):
        print(f"{axis}: min {a:+.4f}  max {b:+.4f}  extent {b - a:.4f}")


if __name__ == "__main__":
    main()
