// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Unit tests of the RoadModel -> SceneUpdate converter (plan 4.2).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { describe, expect, it } from "vitest";

import { convertLanes, LaneBoundary } from "../src/convert/lanes";
import * as S from "../src/style";

const T = { sec: 3, nsec: 50 };
const KIND_PAINTED = 1;
const KIND_ROAD_EDGE = 2;
const SOURCE_MEASURED = 1;
const SOURCE_PREDICTED = 2;
const MARKER_WHITE = 1;
const MARKER_YELLOW = 2;

function boundary(over: Partial<LaneBoundary> = {}): LaneBoundary {
  return {
    kind: KIND_PAINTED,
    source: SOURCE_MEASURED,
    c0_m: 1.75,
    c1: 0,
    c2_inv_m: 0,
    c3_inv_m2: 0,
    x_start_m: 0,
    x_end_m: 40,
    marker_width_m: 0.12,
    marker_colour: MARKER_WHITE,
    ...over,
  };
}

function lines(...bs: LaneBoundary[]) {
  const out = convertLanes({ boundaries: bs }, T);
  expect(out.entities).toHaveLength(1);
  return out.entities[0]!.lines;
}

describe("convertLanes", () => {
  it("straight line c0 = 1.75 -> every point y = 1.75, z = 0.02, one per metre", () => {
    const [l] = lines(boundary());
    expect(l!.points).toHaveLength(41);
    for (const p of l!.points) {
      expect(p.y).toBe(1.75);
      expect(p.z).toBe(0.02);
    }
    expect(l!.points[1]!.x).toBe(1);
    expect(l!.thickness).toBe(0.12);
    expect(l!.scale_invariant).toBe(false);
    expect(l!.color).toEqual({ ...S.COLOR_LANE_WHITE, a: 1 });
  });

  it("curve c2_inv_m = 0.001 -> y at x = 20 is c0 + 0.4", () => {
    const [l] = lines(boundary({ c0_m: -1.8, c2_inv_m: 0.001 }));
    const p = l!.points.find((q) => q.x === 20)!;
    expect(p.y).toBeCloseTo(-1.8 + 0.4, 9);
  });

  it("all four coefficients are used", () => {
    const [l] = lines(boundary({ c0_m: 1, c1: 0.01, c2_inv_m: 0.001, c3_inv_m2: 0.0001 }));
    const p = l!.points.find((q) => q.x === 10)!;
    expect(p.y).toBeCloseTo(1 + 0.1 + 0.1 + 0.1, 9);
  });

  it("unknown range (x_end_m <= x_start_m) -> no line", () => {
    expect(lines(boundary({ x_start_m: 5, x_end_m: 5 }), boundary({ x_start_m: 5, x_end_m: 0 }))).toHaveLength(0);
  });

  it("road edge -> ROAD_EDGE_WIDTH_M and the edge colour", () => {
    const [l] = lines(boundary({ kind: KIND_ROAD_EDGE, marker_width_m: 0, marker_colour: MARKER_YELLOW }));
    expect(l!.thickness).toBe(0.3);
    expect(l!.color).toEqual({ ...S.COLOR_ROAD_EDGE, a: 1 });
  });

  it("yellow marking -> yellow; unknown colour -> light grey", () => {
    const [y, u] = lines(boundary({ marker_colour: MARKER_YELLOW }), boundary({ marker_colour: 0 }));
    expect(y!.color).toEqual({ ...S.COLOR_LANE_YELLOW, a: 1 });
    expect(u!.color).toEqual({ ...S.COLOR_LANE_UNKNOWN, a: 1 });
  });

  it("predicted or unknown source -> LANE_UNMEASURED_ALPHA", () => {
    const [p, u] = lines(boundary({ source: SOURCE_PREDICTED }), boundary({ source: 0 }));
    expect(p!.color.a).toBe(0.4);
    expect(u!.color.a).toBe(0.4);
  });

  it("0..500 m range -> <= LANE_MAX_POINTS points, first x = 0, last x = 500", () => {
    const [l] = lines(boundary({ x_end_m: 500 }));
    expect(l!.points.length).toBeLessThanOrEqual(300);
    expect(l!.points.length).toBeGreaterThan(290);
    expect(l!.points[0]!.x).toBe(0);
    expect(l!.points[l!.points.length - 1]!.x).toBe(500);
  });

  it("range not a whole number of steps still ends exactly at x_end_m", () => {
    const [l] = lines(boundary({ x_start_m: 2, x_end_m: 4.5 }));
    expect(l!.points.map((p) => p.x)).toEqual([2, 3, 4, 4.5]);
  });

  it("marker_width_m = -1 (unknown) -> LANE_DEFAULT_WIDTH_M", () => {
    expect(lines(boundary({ marker_width_m: -1 }))[0]!.thickness).toBe(0.15);
  });

  it("entity 'lanes' in frame ego with the timestamp passed in", () => {
    const e = convertLanes({ boundaries: [boundary()] }, T).entities[0]!;
    expect(e.id).toBe("lanes");
    expect(e.frame_id).toBe("ego");
    expect(e.timestamp).toEqual({ sec: 3, nsec: 50 });
  });
});
