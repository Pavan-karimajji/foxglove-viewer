// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Unit tests of yaw -> quaternion.
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { describe, expect, it } from "vitest";

import { yawToQuaternion } from "../src/convert/quat";

describe("yawToQuaternion", () => {
  it("90 deg -> (0, 0, 0.7071, 0.7071)", () => {
    const q = yawToQuaternion(Math.PI / 2);
    expect(q.x).toBe(0);
    expect(q.y).toBe(0);
    expect(q.z).toBeCloseTo(0.7071, 4);
    expect(q.w).toBeCloseTo(0.7071, 4);
  });

  it("0 -> identity, -90 deg -> negative z", () => {
    expect(yawToQuaternion(0)).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    expect(yawToQuaternion(-Math.PI / 2).z).toBeCloseTo(-0.7071, 4);
  });
});
