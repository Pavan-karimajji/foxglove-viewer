// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   adas.perception.RoadModel -> foxglove.SceneUpdate: one line strip per lane boundary (plan 4.2).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { Color, LineType, Point3, SceneUpdate, Time } from "@foxglove/schemas";

import * as S from "../style";
import { emptyEntity, pose } from "./entity";

// foxglove.LineType.LINE_STRIP, by value: importing the enum would bundle all of @foxglove/schemas.
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
const LINE_STRIP = 0 as LineType;

// adas.perception enums, by value (decoded as numbers, plan section 9).
const KIND_ROAD_EDGE = 2;
const SOURCE_MEASURED = 1;
const MARKER_WHITE = 1;
const MARKER_YELLOW = 2;

// Decoded shape (plan section 9): snake_case fields, enums as numbers.
export type LaneBoundary = {
  kind: number;
  source: number;
  c0_m: number;
  c1: number;
  c2_inv_m: number;
  c3_inv_m2: number;
  x_start_m: number;
  x_end_m: number;
  marker_width_m: number;
  marker_colour: number;
};
export type RoadModel = { boundaries: LaneBoundary[] };

/** x positions from x_start_m to x_end_m inclusive, every LANE_SAMPLE_M, at most LANE_MAX_POINTS. */
export function sampleXs(xStart: number, xEnd: number): number[] {
  const range = xEnd - xStart;
  let step = S.LANE_SAMPLE_M;
  if (Math.ceil(range / step) + 1 > S.LANE_MAX_POINTS) {
    step = range / (S.LANE_MAX_POINTS - 1);
  }
  const xs: number[] = [];
  for (let i = 0; xStart + i * step < xEnd - 1e-9; i++) {
    xs.push(xStart + i * step);
  }
  xs.push(xEnd);
  return xs;
}

function laneColor(b: LaneBoundary): Color {
  if (b.kind === KIND_ROAD_EDGE) {
    return S.COLOR_ROAD_EDGE;
  }
  switch (b.marker_colour) {
    case MARKER_WHITE:
      return S.COLOR_LANE_WHITE;
    case MARKER_YELLOW:
      return S.COLOR_LANE_YELLOW;
    default:
      return S.COLOR_LANE_UNKNOWN;
  }
}

function laneThickness(b: LaneBoundary): number {
  if (b.kind === KIND_ROAD_EDGE) {
    return S.ROAD_EDGE_WIDTH_M;
  }
  return b.marker_width_m > 0 ? b.marker_width_m : S.LANE_DEFAULT_WIDTH_M;
}

export function convertLanes(msg: RoadModel, receiveTime: Time): SceneUpdate {
  const entity = emptyEntity("lanes", receiveTime);

  for (const b of msg.boundaries) {
    if (b.x_end_m <= b.x_start_m) {
      continue; // unknown range (plan section 3)
    }
    const points: Point3[] = sampleXs(b.x_start_m, b.x_end_m).map((x) => ({
      x,
      y: b.c0_m + b.c1 * x + b.c2_inv_m * x * x + b.c3_inv_m2 * x * x * x,
      z: S.LANE_Z_M,
    }));
    const alpha = b.source === SOURCE_MEASURED ? S.LANE_MEASURED_ALPHA : S.LANE_UNMEASURED_ALPHA;
    entity.lines.push({
      type: LINE_STRIP,
      pose: pose(0, 0, 0),
      thickness: laneThickness(b),
      scale_invariant: false,
      points,
      color: { ...laneColor(b), a: alpha },
      colors: [],
      indices: [],
    });
  }

  return { deletions: [], entities: [entity] };
}
