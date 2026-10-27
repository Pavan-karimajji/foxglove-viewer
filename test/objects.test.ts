// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Unit tests of the DfObjList -> SceneUpdate converter.
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { describe, expect, it } from "vitest";

import { convertObjects } from "../src/convert/objects";

const T = { sec: 12, nsec: 345 };

describe("convertObjects (spike)", () => {
  it("draws num_of_used_objects cubes at dist_x/dist_y in frame ego with the receive time", () => {
    const out = convertObjects(
      {
        num_of_used_objects: 1,
        objects: [{ kinematic: { dist_x: 7, dist_y: -2 } }, { kinematic: { dist_x: 1, dist_y: 1 } }],
      },
      T,
    );
    const entity = out.entities[0]!;
    expect(entity.frame_id).toBe("ego");
    expect(entity.timestamp).toEqual(T);
    expect(entity.cubes).toHaveLength(1);
    expect(entity.cubes[0]!.pose.position).toEqual({ x: 7, y: -2, z: 0.8 });
  });
});
