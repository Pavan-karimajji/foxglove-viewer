// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   adas.perception.DfObjList -> foxglove.SceneUpdate (S-1 spike: one fixed-size cube per object).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { SceneUpdate, Time } from "@foxglove/schemas";

// Spike constants (plan S-1); the real display constants move to style.ts in S-2.
const FRAME_ID = "ego";
const CUBE_Z_M = 0.8;
const CUBE_SIZE = { x: 4, y: 2, z: 1.6 };
const CUBE_COLOR = { r: 0.2, g: 0.6, b: 1, a: 0.6 };

// Decoded field casing is snake_case (plan section 9).
export type DfObjList = {
  num_of_used_objects: number;
  objects: { kinematic?: { dist_x: number; dist_y: number } }[];
};

export function convertObjects(msg: DfObjList, receiveTime: Time): SceneUpdate {
  const count = Math.min(msg.num_of_used_objects, msg.objects.length);
  const cubes = msg.objects.slice(0, count).map((obj) => ({
    pose: {
      position: { x: obj.kinematic?.dist_x ?? 0, y: obj.kinematic?.dist_y ?? 0, z: CUBE_Z_M },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
    },
    size: CUBE_SIZE,
    color: CUBE_COLOR,
  }));

  return {
    deletions: [],
    entities: [
      {
        timestamp: receiveTime,
        frame_id: FRAME_ID,
        id: "objects",
        lifetime: { sec: 0, nsec: 0 },
        frame_locked: true,
        metadata: [],
        arrows: [],
        cubes,
        spheres: [],
        cylinders: [],
        lines: [],
        triangles: [],
        texts: [],
        models: [],
      },
    ],
  };
}
