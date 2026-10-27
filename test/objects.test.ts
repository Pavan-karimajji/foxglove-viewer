// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Unit tests of the DfObjList -> SceneUpdate converter (plan 4.1).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { describe, expect, it } from "vitest";

import { convertObjects, DfObj, DfObjList, ObjectsMode } from "../src/convert/objects";
import * as S from "../src/style";

const T = { sec: 12, nsec: 345 };
const CAR = 1;
const BICYCLE = 5;

function obj(over: Partial<{ x: number; y: number; vx: number; vy: number; len: number; wid: number; yaw: number; cls: number; id: number; ms: number }> = {}): DfObj {
  return {
    kinematic: { dist_x: over.x ?? 10, dist_y: over.y ?? -3, vabs_x: over.vx ?? 0, vabs_y: over.vy ?? 0 },
    geometry: { length: over.len ?? 4.5, width: over.wid ?? 2, orientation: over.yaw ?? 0 },
    attributes: { classification: over.cls ?? CAR },
    general: { local_id: over.id ?? 1, maintenance_state: over.ms ?? 2 },
  };
}

function list(objects: DfObj[], used = objects.length): DfObjList {
  return { num_of_used_objects: used, objects };
}

function entityOf(msg: DfObjList, mode: ObjectsMode = "dressed") {
  const out = convertObjects(msg, T, mode);
  expect(out.entities).toHaveLength(1);
  return out.entities[0]!;
}

// The ego car is the one model in an empty entity; the per-class model rungs are in models.test.ts.
// Cuboid tests use the "boxes" mode, where every object with a box is a cuboid.
describe("convertObjects", () => {
  it("empty list -> exactly one model (the ego car) and no cubes", () => {
    const e = entityOf(list([]));
    expect(e.id).toBe("objects");
    expect(e.models).toHaveLength(1);
    expect(e.cubes).toHaveLength(0);
    expect(e.spheres).toHaveLength(0);
    expect(e.arrows).toHaveLength(0);
    expect(e.texts).toHaveLength(0);
  });

  it("ego model: glb media type, own colours, centred on EGO_CENTRE_X_M, on the ground", () => {
    const m = entityOf(list([])).models[0]!;
    expect(m.media_type).toBe("model/gltf-binary");
    expect(m.override_color).toBe(false);
    expect(m.url).toBe("");
    // The model's middle is 0.0002 m behind its origin (before scale), so the origin moves forward by that much.
    expect(m.pose.position.x).toBeCloseTo(1.35 + 0.0002 * (4.5 / 4.2093), 9);
    expect(m.pose.position.y).toBe(0);
    // Its lowest point is 0.0181 m below its origin (before scale): lifted so the wheels touch the ground.
    expect(m.pose.position.z).toBeCloseTo(0.0181 * (1.5 / 1.5279), 9);
    expect(m.pose.orientation.z).toBeCloseTo(0.7071, 4); // quarter turn about z: model forward -> +x
    expect(m.pose.orientation.w).toBeCloseTo(0.7071, 4);
  });

  it("ego model scale per axis: x = width, y = length, z = height (Foxglove applies it after Y-up -> Z-up)", () => {
    const s = entityOf(list([])).models[0]!.scale;
    expect(s.x).toBe(S.EGO_WIDTH_M / S.MODEL_EGO.widthM);
    expect(s.y).toBe(S.EGO_LENGTH_M / S.MODEL_EGO.lengthM);
    expect(s.z).toBe(S.EGO_HEIGHT_TARGET_M / S.MODEL_EGO.heightM);
    expect(s.x).toBeCloseTo(0.8526, 4); // 1.8 / 2.1111
    expect(s.y).toBeCloseTo(1.0691, 4); // 4.5 / 4.2093
    expect(s.z).toBeCloseTo(0.9817, 4); // 1.5 / 1.5279
    // The drawn car: 2.1111 m x 4.2093 m x 1.5279 m native -> 1.8 m wide, 4.5 m long, 1.5 m high.
    expect(2.1111 * s.x).toBeCloseTo(1.8, 9);
    expect(4.2093 * s.y).toBeCloseTo(4.5, 9);
    expect(1.5279 * s.z).toBeCloseTo(1.5, 9);
  });

  it("ego model bytes are a glb", () => {
    const m = entityOf(list([])).models[0]!;
    expect(m.data.length).toBeGreaterThan(100_000);
    expect(String.fromCharCode(...m.data.slice(0, 4))).toBe("glTF");
  });

  it("the model bytes are the same Uint8Array instance on every call (decoded once)", () => {
    const a = entityOf(list([])).models[0]!.data;
    const b = entityOf(list([obj()])).models[0]!.data;
    expect(b).toBe(a);
  });

  it("valid box -> one cube with exact position, size and orientation", () => {
    const e = entityOf(list([obj({ x: 20, y: 3.5, len: 4.8, wid: 2.1, yaw: Math.PI / 2 })]), "boxes");
    expect(e.cubes).toHaveLength(1);
    expect(e.models).toHaveLength(1);
    const c = e.cubes[0]!;
    expect(c.pose.position).toEqual({ x: 20, y: 3.5, z: 0.75 });
    expect(c.size).toEqual({ x: 4.8, y: 2.1, z: 1.5 });
    expect(c.pose.orientation.z).toBeCloseTo(0.7071, 4);
    expect(c.pose.orientation.w).toBeCloseTo(0.7071, 4);
    expect(c.color).toEqual({ ...S.COLOR_CAR, a: 0.6 });
  });

  it("invalid box (length 0) -> a sphere, no cube for it", () => {
    const e = entityOf(list([obj({ x: 7, y: 1, len: 0 })]));
    expect(e.cubes).toHaveLength(0);
    expect(e.spheres).toHaveLength(1);
    expect(e.spheres[0]!.pose.position).toEqual({ x: 7, y: 1, z: 0.3 });
    expect(e.spheres[0]!.size).toEqual({ x: 0.6, y: 0.6, z: 0.6 });
  });

  it("two-wheeler colour for BICYCLE", () => {
    const e = entityOf(list([obj({ cls: BICYCLE })]));
    expect(e.cubes[0]!.color).toEqual({ ...S.COLOR_TWO_WHEELER, a: 0.6 });
  });

  it("0.3 m/s -> no arrow", () => {
    expect(entityOf(list([obj({ vx: 0.3 })])).arrows).toHaveLength(0);
  });

  it("10 m/s -> shaft 5.0 m, pointing along atan2(vy, vx)", () => {
    const e = entityOf(list([obj({ vx: 0, vy: 10, x: 5, y: 2 })]));
    expect(e.arrows).toHaveLength(1);
    const a = e.arrows[0]!;
    expect(a.shaft_length).toBeCloseTo(5.0, 9);
    expect(a.pose.position).toEqual({ x: 5, y: 2, z: 0.75 });
    expect(a.pose.orientation.z).toBeCloseTo(0.7071, 4); // +90 deg: moving left
  });

  it("50 m/s -> shaft capped at ARROW_MAX_M", () => {
    expect(entityOf(list([obj({ vx: 50 })])).arrows[0]!.shaft_length).toBe(15);
  });

  it("num_of_used_objects = 1 with objects.length = 3 -> exactly one object drawn", () => {
    const e = entityOf(list([obj({ x: 1 }), obj({ x: 2 }), obj({ x: 3 })], 1), "boxes");
    expect(e.cubes).toHaveLength(1);
    expect(e.cubes[0]!.pose.position.x).toBe(1);
    expect(e.texts).toHaveLength(1);
  });

  it("num_of_used_objects larger than objects.length -> objects.length drawn", () => {
    expect(entityOf(list([obj(), obj()], 5), "boxes").cubes).toHaveLength(2);
  });

  it("maintenance_state = 0 on every object -> all still drawn", () => {
    expect(entityOf(list([obj({ ms: 0 }), obj({ ms: 0 }), obj({ ms: 0 })]), "boxes").cubes).toHaveLength(3);
  });

  it("label for a CAR, local_id 4, vabs (10, 0) -> 'CAR #4  36 km/h', above the box", () => {
    const e = entityOf(list([obj({ id: 4, vx: 10, x: 9, y: -1 })]));
    const t = e.texts[0]!;
    expect(t.text).toBe("CAR #4  36 km/h");
    expect(t.billboard).toBe(true);
    expect(t.pose.position).toEqual({ x: 9, y: -1, z: 1.9 });
  });

  it("every entity has frame_id 'ego' and the timestamp passed in", () => {
    const out = convertObjects(list([obj()]), T);
    for (const e of out.entities) {
      expect(e.frame_id).toBe("ego");
      expect(e.timestamp).toEqual({ sec: 12, nsec: 345 });
      expect(e.frame_locked).toBe(true);
      expect(e.lifetime).toEqual({ sec: 0, nsec: 0 });
    }
  });
});
