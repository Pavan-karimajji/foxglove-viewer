// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Every display-only constant (plan section 4): sizes, scales, colours. No message value lives here.
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { Color } from "@foxglove/schemas";

/** The one coordinate frame every entity is drawn in (plan D-5). */
export const FRAME_ID = "ego";

/** m/s -> km/h, for speed text. */
export const MPS_TO_KMH = 3.6;

// ---- Objects (plan 4.1) ----

/** Common box height for every object; DfObj has no height field (plan D-6). */
export const OBJECT_HEIGHT_M = 1.6;
/** Box and marker transparency, so overlapping objects stay readable. */
export const OBJECT_ALPHA = 0.6;
/** Diameter of the sphere drawn for an object with no valid box. */
export const NO_BOX_MARKER_M = 0.6;

/** Velocity arrow shaft length per m/s of speed. */
export const ARROW_S_PER_MPS = 0.5;
/** Longest velocity arrow shaft. */
export const ARROW_MAX_M = 15;
/** Below this speed no arrow is drawn. */
export const ARROW_MIN_MPS = 0.5;
export const ARROW_SHAFT_DIAMETER_M = 0.15;
export const ARROW_HEAD_LENGTH_M = 0.6;
export const ARROW_HEAD_DIAMETER_M = 0.45;

/** Gap between the top of a box (or marker) and its label. */
export const LABEL_OFFSET_M = 0.4;
/** Label size in screen pixels (labels are scale invariant). */
export const LABEL_FONT_SIZE_PX = 14;
export const LABEL_COLOR: Color = { r: 1, g: 1, b: 1, a: 1 };

// Ego car box: display constants, to come from ego_params.yaml later (plan section 7).
export const EGO_LENGTH_M = 4.5;
export const EGO_WIDTH_M = 1.8;
/** Car centre ahead of the rear axle (the ego origin). */
export const EGO_CENTRE_X_M = 1.35;

// Ego car model (assets/ego_car.glb, assets/ASSETS.md). The EGO_MODEL_NATIVE_* values come from
// `py -3 scripts/measure_glb.py assets/ego_car.glb` (bounding box of the model's own units, glTF is +Y up);
// forward = glTF +Z was read off the model itself (long hood on the +Z side). Rerun after changing the model.
/** Model length along its forward axis (glTF Z). */
export const EGO_MODEL_NATIVE_LENGTH_M = 2.55;
/** Model width along its lateral axis (glTF X). */
export const EGO_MODEL_NATIVE_WIDTH_M = 1.5;
/** Model height along its up axis (glTF Y). */
export const EGO_MODEL_NATIVE_HEIGHT_M = 1.3;
/** Lowest point of the model on its up axis (the wheel bottoms); 0 means its origin is on the ground. */
export const EGO_MODEL_NATIVE_MIN_UP_M = 0;
/** Middle of the model along its forward axis (glTF Z), from the same measurement: not at the origin. */
export const EGO_MODEL_NATIVE_CENTRE_FORWARD_M = -0.025;
/** Roof height the drawn car should have (a passenger car, not the model's own 1.3 m x length scale). */
export const EGO_HEIGHT_TARGET_M = 1.5;
// One factor per axis, so the drawn car is EGO_LENGTH_M x EGO_WIDTH_M x EGO_HEIGHT_TARGET_M.
export const EGO_MODEL_SCALE_LENGTH = EGO_LENGTH_M / EGO_MODEL_NATIVE_LENGTH_M;
export const EGO_MODEL_SCALE_WIDTH = EGO_WIDTH_M / EGO_MODEL_NATIVE_WIDTH_M;
export const EGO_MODEL_SCALE_HEIGHT = EGO_HEIGHT_TARGET_M / EGO_MODEL_NATIVE_HEIGHT_M;
/** Roof height of the drawn model; the ego speed text sits above this. */
export const EGO_HEIGHT_M = EGO_MODEL_NATIVE_HEIGHT_M * EGO_MODEL_SCALE_HEIGHT;
/**
 * Yaw that turns the model's forward (glTF +Z) onto ego +x. The 3D panel's default mesh up axis
 * ("y_up") already stands a glTF upright (+Y -> +z, +Z -> -y), so what is left is a quarter turn about z.
 */
export const EGO_MODEL_YAW_RAD = Math.PI / 2;
/** Required by ModelPrimitive but ignored: override_color is false, so the model keeps its own colours. */
export const EGO_MODEL_UNUSED_COLOR: Color = { r: 1, g: 1, b: 1, a: 1 };

// One colour per class group, alpha applied separately.
/** Passenger cars (CAR). */
export const COLOR_CAR: Color = { r: 0.25, g: 0.6, b: 1, a: 1 };
/** Trucks (TRUCK). */
export const COLOR_TRUCK: Color = { r: 1, g: 0.55, b: 0.1, a: 1 };
/** Pedestrians (PEDESTRIAN). */
export const COLOR_PEDESTRIAN: Color = { r: 1, g: 0.25, b: 0.65, a: 1 };
/** Two-wheelers (MOTORCYCLE, BICYCLE). */
export const COLOR_TWO_WHEELER: Color = { r: 0.3, g: 0.9, b: 0.3, a: 1 };
/** Every other or unknown classification. */
export const COLOR_OTHER: Color = { r: 0.7, g: 0.7, b: 0.7, a: 1 };

// ---- Lanes (plan 4.2) ----

/** Distance between sampled points along a lane line. */
export const LANE_SAMPLE_M = 1.0;
/** Most points per lane line; the step widens beyond this. */
export const LANE_MAX_POINTS = 300;
/** Height of lane lines above the ground plane, so the grid does not hide them. */
export const LANE_Z_M = 0.02;
/** Line width when the boundary carries no marker width. */
export const LANE_DEFAULT_WIDTH_M = 0.15;
/** Line width of a road edge. */
export const ROAD_EDGE_WIDTH_M = 0.3;
/** Alpha of a predicted, virtual or unknown-source line; measured lines are opaque. */
export const LANE_UNMEASURED_ALPHA = 0.4;
/** Alpha of a measured line. */
export const LANE_MEASURED_ALPHA = 1.0;

/** White painted marking. */
export const COLOR_LANE_WHITE: Color = { r: 1, g: 1, b: 1, a: 1 };
/** Yellow painted marking. */
export const COLOR_LANE_YELLOW: Color = { r: 1, g: 0.85, b: 0, a: 1 };
/** Marking of unknown colour. */
export const COLOR_LANE_UNKNOWN: Color = { r: 0.75, g: 0.75, b: 0.75, a: 1 };
/** Road edge (kerb, barrier, verge). */
export const COLOR_ROAD_EDGE: Color = { r: 0.35, g: 0.35, b: 0.35, a: 1 };
