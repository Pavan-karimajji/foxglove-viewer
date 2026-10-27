// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Unit tests of the class models, the fallback ladder and the boxes-only switch (junction plan J-D4, J-D5).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { describe, expect, it } from "vitest";

import {
  classHeightM,
  convertObjects,
  DfObj,
  DfObjList,
  modeForTopic,
  ObjectsMode,
  objectsAliases,
} from "../src/convert/objects";
import { MODEL_DATA } from "../src/models";
import * as S from "../src/style";

const T = { sec: 1, nsec: 2 };
const POINT = 0;
const CAR = 1;
const TRUCK = 2;
const PEDESTRIAN = 3;
const MOTORCYCLE = 4;
const BICYCLE = 5;
const UNKNOWN_VALUE = 42;

function obj(cls: number, over: Partial<{ x: number; y: number; len: number; wid: number; yaw: number }> = {}): DfObj {
  return {
    kinematic: { dist_x: over.x ?? 10, dist_y: over.y ?? -3, vabs_x: 0, vabs_y: 0 },
    geometry: { length: over.len ?? 4.2, width: over.wid ?? 1.8, orientation: over.yaw ?? 0 },
    attributes: { classification: cls },
    general: { local_id: 1 },
  };
}

function entityOf(objects: DfObj[], mode: ObjectsMode = "dressed") {
  const msg: DfObjList = { num_of_used_objects: objects.length, objects };
  return convertObjects(msg, T, mode).entities[0]!;
}

// models[0] is always the ego car; the object models follow.
describe("fallback ladder (J-D4)", () => {
  it("rung 1: a class with a model and a valid box -> a model and an outline, no cuboid", () => {
    const e = entityOf([obj(CAR)]);
    expect(e.models).toHaveLength(2);
    expect(e.cubes).toHaveLength(0);
    expect(e.spheres).toHaveLength(0);
    expect(e.lines).toHaveLength(1);
  });

  it("rung 2: BICYCLE has no model -> a cuboid, no model, no outline", () => {
    const e = entityOf([obj(BICYCLE)]);
    expect(e.models).toHaveLength(1);
    expect(e.cubes).toHaveLength(1);
    expect(e.lines).toHaveLength(0);
    expect(e.cubes[0]!.size.z).toBe(1.7);
  });

  it("rung 2: an unknown classification value (42) -> a cuboid in the default height", () => {
    const e = entityOf([obj(UNKNOWN_VALUE)]);
    expect(e.models).toHaveLength(1);
    expect(e.cubes).toHaveLength(1);
    expect(e.cubes[0]!.size.z).toBe(S.OBJECT_HEIGHT_M);
    expect(e.cubes[0]!.color).toEqual({ ...S.COLOR_OTHER, a: S.OBJECT_ALPHA });
  });

  it("rung 2: every other model-less class -> a cuboid", () => {
    for (const cls of [POINT, 6, 7, 8, 9, 10]) {
      const e = entityOf([obj(cls)]);
      expect(e.models, `class ${cls}`).toHaveLength(1);
      expect(e.cubes, `class ${cls}`).toHaveLength(1);
    }
  });

  it("rung 3: an invalid box -> a sphere, for a class with a model too", () => {
    for (const cls of [CAR, MOTORCYCLE, BICYCLE]) {
      const e = entityOf([obj(cls, { len: 0 })]);
      expect(e.models, `class ${cls}`).toHaveLength(1);
      expect(e.cubes, `class ${cls}`).toHaveLength(0);
      expect(e.spheres, `class ${cls}`).toHaveLength(1);
      expect(e.lines, `class ${cls}`).toHaveLength(0);
    }
  });

  it("a mixed list is decided object by object", () => {
    const e = entityOf([obj(CAR), obj(7), obj(TRUCK, { wid: 0 })]);
    expect(e.models).toHaveLength(2); // ego + the car
    expect(e.cubes).toHaveLength(1);
    expect(e.spheres).toHaveLength(1);
  });
});

describe("model placement and scale", () => {
  it("CAR: scale x = width/native width, y = length/native length, z = height/native height", () => {
    const m = entityOf([obj(CAR, { len: 4.2, wid: 1.8 })]).models[1]!;
    expect(m.scale.x).toBe(1.8 / 1.6384);
    expect(m.scale.y).toBe(4.2 / 3.3096);
    expect(m.scale.z).toBe(1.5 / 1.1456);
    expect(m.override_color).toBe(false);
    expect(m.media_type).toBe("model/gltf-binary");
  });

  it("TRUCK: scale x = width/native width, y = length/native length, z = 3.4/native height", () => {
    const m = entityOf([obj(TRUCK, { len: 9, wid: 2.5 })]).models[1]!;
    expect(m.scale.x).toBe(2.5 / 2.7093);
    expect(m.scale.y).toBe(9 / 5.2556);
    expect(m.scale.z).toBe(3.4 / 2.884);
  });

  it("drawn size = native size x scale = the box", () => {
    const m = entityOf([obj(TRUCK, { len: 9, wid: 2.5 })]).models[1]!;
    expect(S.MODEL_TRUCK.widthM * m.scale.x).toBeCloseTo(2.5, 9);
    expect(S.MODEL_TRUCK.lengthM * m.scale.y).toBeCloseTo(9, 9);
    expect(S.MODEL_TRUCK.heightM * m.scale.z).toBeCloseTo(3.4, 9);
  });

  it("origin: box centre minus (native centre along Z x scale) along the heading; feet on the ground", () => {
    const e0 = entityOf([obj(TRUCK, { x: 20, y: 5, len: 9, wid: 2.5, yaw: 0 })]).models[1]!;
    const shift = -0.4352 * (9 / 5.2556);
    expect(e0.pose.position.x).toBeCloseTo(20 - shift, 9);
    expect(e0.pose.position.y).toBeCloseTo(5, 9);
    expect(e0.pose.position.z).toBeCloseTo(-0.0007 * (3.4 / 2.884), 9);
    const e1 = entityOf([obj(TRUCK, { x: 20, y: 5, len: 9, wid: 2.5, yaw: Math.PI / 2 })]).models[1]!;
    expect(e1.pose.position.x).toBeCloseTo(20, 9);
    expect(e1.pose.position.y).toBeCloseTo(5 - shift, 9);
  });

  it("yaw = box orientation + a quarter turn", () => {
    const m = entityOf([obj(CAR, { yaw: 0 })]).models[1]!;
    expect(m.pose.orientation.z).toBeCloseTo(0.7071, 4);
    expect(m.pose.orientation.w).toBeCloseTo(0.7071, 4);
    const turned = entityOf([obj(CAR, { yaw: Math.PI / 2 })]).models[1]!;
    expect(turned.pose.orientation.z).toBeCloseTo(1, 4); // half a turn in total
    expect(turned.pose.orientation.w).toBeCloseTo(0, 4);
  });

  it("the outline is the box rectangle on the ground in the class colour", () => {
    const line = entityOf([obj(CAR, { x: 10, y: 0, len: 4, wid: 2 })]).lines[0]!;
    expect(line.type).toBe(1); // LINE_LOOP
    expect(line.color).toEqual(S.COLOR_CAR);
    expect(line.thickness).toBe(S.OUTLINE_THICKNESS_M);
    expect(line.points).toEqual([
      { x: 12, y: 1, z: S.OUTLINE_Z_M },
      { x: 12, y: -1, z: S.OUTLINE_Z_M },
      { x: 8, y: -1, z: S.OUTLINE_Z_M },
      { x: 8, y: 1, z: S.OUTLINE_Z_M },
    ]);
  });

  it("tint is off by default: models keep their own colours", () => {
    expect(S.MODEL_TINT_ENABLED).toBe(false);
  });
});

describe("per-class heights (J-D3)", () => {
  it("height constants", () => {
    expect(classHeightM(CAR)).toBe(1.5);
    expect(classHeightM(TRUCK)).toBe(3.4);
    expect(classHeightM(PEDESTRIAN)).toBe(1.75);
    expect(classHeightM(MOTORCYCLE)).toBe(1.5);
    expect(classHeightM(BICYCLE)).toBe(1.7);
    expect(classHeightM(UNKNOWN_VALUE)).toBe(1.6);
  });

  it("the label sits LABEL_OFFSET_M above the class height", () => {
    for (const cls of [CAR, TRUCK, PEDESTRIAN, MOTORCYCLE, BICYCLE, 7]) {
      const t = entityOf([obj(cls)]).texts[0]!;
      expect(t.pose.position.z, `class ${cls}`).toBeCloseTo(classHeightM(cls) + 0.4, 9);
    }
  });

  it("PEDESTRIAN model is 1.75 m tall", () => {
    const m = entityOf([obj(PEDESTRIAN, { len: 0.4, wid: 0.4 })]).models[1]!;
    expect(S.MODEL_PEDESTRIAN.heightM * m.scale.z).toBeCloseTo(1.75, 9);
  });
});

describe("motorcycle and rider", () => {
  it("MOTORCYCLE emits exactly two models (bike, rider); PEDESTRIAN and CAR one", () => {
    expect(entityOf([obj(MOTORCYCLE, { len: 2.2, wid: 0.9 })]).models).toHaveLength(3);
    expect(entityOf([obj(PEDESTRIAN, { len: 0.4, wid: 0.4 })]).models).toHaveLength(2);
    expect(entityOf([obj(CAR)]).models).toHaveLength(2);
  });

  it("the bike fills the box; the rider stands on the seat, inside the box, topping out at the class height", () => {
    const [, bike, rider] = entityOf([obj(MOTORCYCLE, { len: 2.2, wid: 0.9 })]).models;
    expect(S.MODEL_MOTORCYCLE.widthM * bike!.scale.x).toBeCloseTo(0.9, 9);
    expect(S.MODEL_MOTORCYCLE.lengthM * bike!.scale.y).toBeCloseTo(2.2, 9);
    expect(S.MODEL_MOTORCYCLE.heightM * bike!.scale.z).toBeCloseTo(S.BIKE_HEIGHT_M, 9);
    expect(S.MODEL_PEDESTRIAN.widthM * rider!.scale.x).toBeLessThanOrEqual(0.9);
    expect(S.MODEL_PEDESTRIAN.lengthM * rider!.scale.y).toBeLessThanOrEqual(2.2);
    expect(S.MODEL_PEDESTRIAN.heightM * rider!.scale.z + S.RIDER_SEAT_Z_M).toBeCloseTo(1.5, 9);
  });

  it("the rider never exceeds a narrow box", () => {
    const rider = entityOf([obj(MOTORCYCLE, { len: 0.3, wid: 0.2 })]).models[2]!;
    expect(S.MODEL_PEDESTRIAN.widthM * rider.scale.x).toBeCloseTo(0.2, 9);
    expect(S.MODEL_PEDESTRIAN.lengthM * rider.scale.y).toBeCloseTo(0.3, 9);
  });
});

describe("models are decoded once", () => {
  it("each class hands out the same Uint8Array instance on every call", () => {
    const first = entityOf([obj(CAR), obj(TRUCK), obj(PEDESTRIAN), obj(MOTORCYCLE)]).models;
    const second = entityOf([obj(CAR), obj(TRUCK), obj(PEDESTRIAN), obj(MOTORCYCLE)]).models;
    expect(first).toHaveLength(6); // ego, car, truck, pedestrian, bike, rider
    for (let i = 0; i < first.length; i++) {
      expect(second[i]!.data).toBe(first[i]!.data);
    }
    expect(first[1]!.data).toBe(MODEL_DATA.CAR);
    expect(first[2]!.data).toBe(MODEL_DATA.TRUCK);
    expect(first[3]!.data).toBe(MODEL_DATA.PEDESTRIAN);
    expect(first[4]!.data).toBe(MODEL_DATA.MOTORCYCLE);
    expect(first[5]!.data).toBe(MODEL_DATA.PEDESTRIAN); // the rider
    expect(first[0]!.data).toBe(MODEL_DATA.EGO);
  });
});

describe("embedded files", () => {
  function jsonChunk(bytes: Uint8Array): { skins?: unknown[] } {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getUint32(12 + 4, true)).toBe(0x4e4f534a); // "JSON"
    const length = view.getUint32(12, true);
    return JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + length))) as { skins?: unknown[] };
  }

  it("every model is a glb with no skins (Foxglove draws a skinned model lying at the origin)", () => {
    for (const [id, bytes] of Object.entries(MODEL_DATA)) {
      expect(String.fromCharCode(...bytes.slice(0, 4)), id).toBe("glTF");
      const gltf = jsonChunk(bytes);
      expect(gltf.skins, id).toBeUndefined();
    }
  });
});

describe("boxes-only switch (J-D5)", () => {
  it("topic -> mode: objects_boxes is boxes, anything else is dressed", () => {
    expect(modeForTopic("objects_boxes")).toBe("boxes");
    expect(modeForTopic("objects")).toBe("dressed");
    expect(modeForTopic("")).toBe("dressed");
  });

  it("the alias exists only for an objects topic of schema DfObjList", () => {
    const ok = [{ name: "objects", schemaName: "adas.perception.DfObjList" }];
    expect(objectsAliases(ok)).toEqual([{ name: "objects_boxes", sourceTopicName: "objects" }]);
    expect(objectsAliases([])).toEqual([]);
    expect(objectsAliases([{ name: "objects", schemaName: "adas.perception.RoadModel" }])).toEqual([]);
    expect(objectsAliases([{ name: "other", schemaName: "adas.perception.DfObjList" }])).toEqual([]);
    expect(objectsAliases([{ name: "objects" }])).toEqual([]);
  });

  it("boxes mode: zero object models and outlines, only the ego car; one cuboid per valid box", () => {
    const objects = [obj(CAR), obj(TRUCK), obj(PEDESTRIAN), obj(MOTORCYCLE), obj(BICYCLE), obj(7), obj(CAR, { len: 0 })];
    const e = entityOf(objects, "boxes");
    expect(e.models).toHaveLength(1);
    expect(e.models[0]!.data).toBe(MODEL_DATA.EGO);
    expect(e.lines).toHaveLength(0);
    expect(e.cubes).toHaveLength(6);
    expect(e.spheres).toHaveLength(1);
    expect(e.cubes.map((c) => c.size.z)).toEqual([1.5, 3.4, 1.75, 1.5, 1.7, 1.6]);
  });

  it("dressed and boxes keep the same label and arrow", () => {
    const o = { ...obj(CAR), kinematic: { dist_x: 10, dist_y: 0, vabs_x: 10, vabs_y: 0 } };
    const a = entityOf([o], "dressed");
    const b = entityOf([o], "boxes");
    expect(b.texts).toEqual(a.texts);
    expect(b.arrows).toEqual(a.arrows);
  });
});
