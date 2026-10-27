// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Unit tests of the VehDyn -> SceneUpdate converter (plan 4.3).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { describe, expect, it } from "vitest";

import { convertEgo } from "../src/convert/ego";

const T = { sec: 1, nsec: 2 };

describe("convertEgo", () => {
  it("10 m/s -> '36 km/h' above the ego car, entity ego_hud in frame ego", () => {
    const e = convertEgo({ longitudinal: { velocity: 10 } }, T).entities[0]!;
    expect(e.id).toBe("ego_hud");
    expect(e.frame_id).toBe("ego");
    expect(e.timestamp).toEqual({ sec: 1, nsec: 2 });
    expect(e.texts).toHaveLength(1);
    expect(e.texts[0]!.text).toBe("36 km/h");
    expect(e.texts[0]!.pose.position).toEqual({ x: 1.35, y: 0, z: 2.0 });
  });

  it("0 m/s -> '0 km/h'", () => {
    expect(convertEgo({ longitudinal: { velocity: 0 } }, T).entities[0]!.texts[0]!.text).toBe("0 km/h");
  });
});
