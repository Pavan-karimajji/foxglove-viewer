// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   adas.perception.DfObjList -> foxglove.SceneUpdate: boxes, velocity arrows, labels, ego car (plan 4.1).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { Color, SceneEntity, SceneUpdate, Time } from "@foxglove/schemas";

import * as S from "../style";
import { emptyEntity, pose } from "./entity";

// Decoded shape (plan section 9): snake_case fields, enums as numbers; an unset sub-message may be absent.
export type DfObj = {
  kinematic?: { dist_x: number; dist_y: number; vabs_x: number; vabs_y: number } | null;
  geometry?: { length: number; width: number; orientation: number } | null;
  attributes?: { classification: number } | null;
  general?: { local_id: number; maintenance_state?: number } | null;
};
export type DfObjList = { num_of_used_objects: number; objects: DfObj[] };

// adas.perception.DfObj.Classification, by value.
const CLASS_NAMES = [
  "POINT",
  "CAR",
  "TRUCK",
  "PEDESTRIAN",
  "MOTORCYCLE",
  "BICYCLE",
  "WIDE",
  "UNCLASSIFIED",
  "OTHER_VEHICLE",
  "TL",
  "MULTIPLE",
];

export function className(classification: number): string {
  return CLASS_NAMES[classification] ?? `CLASS_${classification}`;
}

export function classColor(classification: number): Color {
  switch (className(classification)) {
    case "CAR":
      return S.COLOR_CAR;
    case "TRUCK":
      return S.COLOR_TRUCK;
    case "PEDESTRIAN":
      return S.COLOR_PEDESTRIAN;
    case "MOTORCYCLE":
    case "BICYCLE":
      return S.COLOR_TWO_WHEELER;
    default:
      return S.COLOR_OTHER;
  }
}

function withAlpha(c: Color, a: number): Color {
  return { r: c.r, g: c.g, b: c.b, a };
}

export function objectLabel(obj: DfObj): string {
  const k = obj.kinematic;
  const kmh = Math.round(Math.hypot(k?.vabs_x ?? 0, k?.vabs_y ?? 0) * S.MPS_TO_KMH);
  return `${className(obj.attributes?.classification ?? 0)} #${obj.general?.local_id ?? 0}  ${kmh} km/h`;
}

function addObject(entity: SceneEntity, obj: DfObj): void {
  const x = obj.kinematic?.dist_x ?? 0;
  const y = obj.kinematic?.dist_y ?? 0;
  const vx = obj.kinematic?.vabs_x ?? 0;
  const vy = obj.kinematic?.vabs_y ?? 0;
  const g = obj.geometry;
  const color = classColor(obj.attributes?.classification ?? 0);

  let centreZ: number;
  let topZ: number;
  if (g != undefined && g.length > 0 && g.width > 0) {
    centreZ = S.OBJECT_HEIGHT_M / 2;
    topZ = S.OBJECT_HEIGHT_M;
    entity.cubes.push({
      pose: pose(x, y, centreZ, g.orientation),
      size: { x: g.length, y: g.width, z: S.OBJECT_HEIGHT_M },
      color: withAlpha(color, S.OBJECT_ALPHA),
    });
  } else {
    centreZ = S.NO_BOX_MARKER_M / 2;
    topZ = S.NO_BOX_MARKER_M;
    entity.spheres.push({
      pose: pose(x, y, centreZ),
      size: { x: S.NO_BOX_MARKER_M, y: S.NO_BOX_MARKER_M, z: S.NO_BOX_MARKER_M },
      color: withAlpha(color, S.OBJECT_ALPHA),
    });
  }

  const speed = Math.hypot(vx, vy);
  if (speed >= S.ARROW_MIN_MPS) {
    entity.arrows.push({
      pose: pose(x, y, centreZ, Math.atan2(vy, vx)),
      shaft_length: Math.min(speed * S.ARROW_S_PER_MPS, S.ARROW_MAX_M),
      shaft_diameter: S.ARROW_SHAFT_DIAMETER_M,
      head_length: S.ARROW_HEAD_LENGTH_M,
      head_diameter: S.ARROW_HEAD_DIAMETER_M,
      color,
    });
  }

  entity.texts.push({
    pose: pose(x, y, topZ + S.LABEL_OFFSET_M),
    billboard: true,
    font_size: S.LABEL_FONT_SIZE_PX,
    scale_invariant: true,
    color: S.LABEL_COLOR,
    text: objectLabel(obj),
  });
}

export function convertObjects(msg: DfObjList, receiveTime: Time): SceneUpdate {
  const entity = emptyEntity("objects", receiveTime);

  entity.cubes.push({
    pose: pose(S.EGO_CENTRE_X_M, 0, S.OBJECT_HEIGHT_M / 2),
    size: { x: S.EGO_LENGTH_M, y: S.EGO_WIDTH_M, z: S.OBJECT_HEIGHT_M },
    color: withAlpha(S.COLOR_EGO, S.OBJECT_ALPHA),
  });

  // Never filter on maintenance_state: older recordings carry 0 everywhere (plan section 3).
  const count = Math.min(msg.num_of_used_objects, msg.objects.length);
  for (const obj of msg.objects.slice(0, count)) {
    addObject(entity, obj);
  }

  return { deletions: [], entities: [entity] };
}
