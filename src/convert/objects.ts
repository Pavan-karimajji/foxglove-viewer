// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   adas.perception.DfObjList -> foxglove.SceneUpdate: a 3D model per class with cuboid and sphere
///   fallback, velocity arrows, labels, ego car (plan 4.1, junction plan J-D4).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { Color, LineType, ModelPrimitive, SceneEntity, SceneUpdate, Time } from "@foxglove/schemas";

import { MODEL_DATA, ModelId } from "../models";
import * as S from "../style";
import { emptyEntity, pose } from "./entity";

export const MODEL_MEDIA_TYPE = "model/gltf-binary";

/** The alias topic that shows every object as a box; the 3D panel lists it beside the real objects topic. */
export const OBJECTS_TOPIC = "objects";
export const OBJECTS_BOXES_TOPIC = "objects_boxes";
const OBJECTS_SCHEMA = "adas.perception.DfObjList";

/** "dressed": a 3D model per class that has one. "boxes": every object with a box is a cuboid. */
export type ObjectsMode = "dressed" | "boxes";

export function modeForTopic(topic: string): ObjectsMode {
  return topic === OBJECTS_BOXES_TOPIC ? "boxes" : "dressed";
}

/** The boxes alias exists only when the recording has an objects topic of the right schema. */
export function objectsAliases(topics: readonly { name: string; schemaName?: string }[]): {
  name: string;
  sourceTopicName: string;
}[] {
  return topics.some((t) => t.name === OBJECTS_TOPIC && t.schemaName === OBJECTS_SCHEMA)
    ? [{ name: OBJECTS_BOXES_TOPIC, sourceTopicName: OBJECTS_TOPIC }]
    : [];
}

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

// foxglove.LineType.LINE_LOOP, by value: importing the enum would bundle all of @foxglove/schemas.
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
const LINE_LOOP = 1 as LineType;

/** Display height of a class (junction plan J-D3). */
export function classHeightM(classification: number): number {
  switch (className(classification)) {
    case "CAR":
      return S.HEIGHT_CAR_M;
    case "TRUCK":
      return S.HEIGHT_TRUCK_M;
    case "PEDESTRIAN":
      return S.HEIGHT_PEDESTRIAN_M;
    case "MOTORCYCLE":
      return S.HEIGHT_MOTORCYCLE_M;
    case "BICYCLE":
      return S.HEIGHT_BICYCLE_M;
    default:
      return S.OBJECT_HEIGHT_M;
  }
}

// The classes that have a 3D model. BICYCLE has none (no suitable licence-free model), so it is a cuboid.
function modelSpec(classification: number): { id: ModelId; spec: S.ModelSpec } | undefined {
  switch (className(classification)) {
    case "CAR":
      return { id: "CAR", spec: S.MODEL_CAR };
    case "TRUCK":
      return { id: "TRUCK", spec: S.MODEL_TRUCK };
    case "PEDESTRIAN":
      return { id: "PEDESTRIAN", spec: S.MODEL_PEDESTRIAN };
    case "MOTORCYCLE":
      return { id: "MOTORCYCLE", spec: S.MODEL_MOTORCYCLE };
    default:
      return undefined;
  }
}

/**
 * A model scaled per axis into a box length x width x height, standing on the ground at z = baseZ, centred
 * on (x, y), front along `heading`. Foxglove stands a glTF upright (Y-up -> Z-up) INSIDE the model and applies
 * `scale` to the result, then the pose: so scale.x = width (glTF X), scale.y = length (glTF Z, now -y),
 * scale.z = height (glTF Y, now z). Read from the 3D panel's model code and confirmed in Foxglove.
 */
function modelPrimitive(
  id: ModelId,
  spec: S.ModelSpec,
  box: { x: number; y: number; heading: number; length: number; width: number; height: number; baseZ: number },
  tint: Color | undefined,
): ModelPrimitive {
  const scaleX = box.width / spec.widthM;
  const scaleY = box.length / spec.lengthM;
  const scaleZ = box.height / spec.heightM;
  // The model's middle is not at its origin: move the origin back by that much, along the heading.
  const originShift = spec.frontSign * spec.centreAlongZM * scaleY;
  return {
    pose: pose(
      box.x - originShift * Math.cos(box.heading),
      box.y - originShift * Math.sin(box.heading),
      box.baseZ - spec.minUpM * scaleZ,
      box.heading + S.MODEL_YAW_RAD + (spec.frontSign < 0 ? Math.PI : 0),
    ),
    scale: { x: scaleX, y: scaleY, z: scaleZ },
    color: tint ?? S.MODEL_UNUSED_COLOR,
    override_color: tint != undefined,
    url: "",
    media_type: MODEL_MEDIA_TYPE,
    data: MODEL_DATA[id],
  };
}

function addOutline(entity: SceneEntity, x: number, y: number, yaw: number, length: number, width: number, color: Color): void {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const corner = (lx: number, ly: number) => ({ x: x + lx * c - ly * s, y: y + lx * s + ly * c, z: S.OUTLINE_Z_M });
  entity.lines.push({
    type: LINE_LOOP,
    pose: pose(0, 0, 0),
    thickness: S.OUTLINE_THICKNESS_M,
    scale_invariant: false,
    points: [corner(length / 2, width / 2), corner(length / 2, -width / 2), corner(-length / 2, -width / 2), corner(-length / 2, width / 2)],
    color,
    colors: [],
    indices: [],
  });
}

// Rider on a motorcycle: the pedestrian model standing on the seat (a motorcyclist is a bike with a person on it).
function riderPrimitive(x: number, y: number, g: { length: number; width: number; orientation: number }, tint: Color | undefined): ModelPrimitive {
  const c = Math.cos(g.orientation);
  const s = Math.sin(g.orientation);
  return modelPrimitive(
    "PEDESTRIAN",
    S.MODEL_PEDESTRIAN,
    {
      x: x + S.RIDER_FORWARD_M * c,
      y: y + S.RIDER_FORWARD_M * s,
      heading: g.orientation,
      length: Math.min(S.RIDER_LENGTH_M, g.length),
      width: Math.min(S.RIDER_WIDTH_M, g.width),
      height: S.HEIGHT_MOTORCYCLE_M - S.RIDER_SEAT_Z_M,
      baseZ: S.RIDER_SEAT_Z_M,
    },
    tint,
  );
}

function addObject(entity: SceneEntity, obj: DfObj, mode: ObjectsMode): void {
  const x = obj.kinematic?.dist_x ?? 0;
  const y = obj.kinematic?.dist_y ?? 0;
  const vx = obj.kinematic?.vabs_x ?? 0;
  const vy = obj.kinematic?.vabs_y ?? 0;
  const g = obj.geometry;
  const classification = obj.attributes?.classification ?? 0;
  const color = classColor(classification);
  const height = classHeightM(classification);

  let centreZ: number;
  let topZ: number;
  if (g != undefined && g.length > 0 && g.width > 0) {
    centreZ = height / 2;
    topZ = height;
    const model = mode === "dressed" ? modelSpec(classification) : undefined;
    if (model == undefined) {
      entity.cubes.push({
        pose: pose(x, y, centreZ, g.orientation),
        size: { x: g.length, y: g.width, z: height },
        color: withAlpha(color, S.OBJECT_ALPHA),
      });
    } else {
      const tint = S.MODEL_TINT_ENABLED ? withAlpha(color, S.MODEL_TINT_ALPHA) : undefined;
      const bikeHeight = model.id === "MOTORCYCLE" ? S.BIKE_HEIGHT_M : height;
      entity.models.push(
        modelPrimitive(
          model.id,
          model.spec,
          { x, y, heading: g.orientation, length: g.length, width: g.width, height: bikeHeight, baseZ: 0 },
          tint,
        ),
      );
      if (model.id === "MOTORCYCLE") {
        entity.models.push(riderPrimitive(x, y, g, tint));
      }
      addOutline(entity, x, y, g.orientation, g.length, g.width, color);
    }
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

export function convertObjects(msg: DfObjList, receiveTime: Time, mode: ObjectsMode = "dressed"): SceneUpdate {
  const entity = emptyEntity("objects", receiveTime);

  // The ego car, in both modes: it is not an object the sensor reported.
  entity.models.push(
    modelPrimitive(
      "EGO",
      S.MODEL_EGO,
      {
        x: S.EGO_CENTRE_X_M,
        y: 0,
        heading: 0,
        length: S.EGO_LENGTH_M,
        width: S.EGO_WIDTH_M,
        height: S.EGO_HEIGHT_TARGET_M,
        baseZ: 0,
      },
      undefined,
    ),
  );

  // Never filter on maintenance_state: older recordings carry 0 everywhere (plan section 3).
  const count = Math.min(msg.num_of_used_objects, msg.objects.length);
  for (const obj of msg.objects.slice(0, count)) {
    addObject(entity, obj, mode);
  }

  return { deletions: [], entities: [entity] };
}
