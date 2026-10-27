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

/** Box height of a class with no height of its own; DfObj has no height field (plan D-6). */
export const OBJECT_HEIGHT_M = 1.6;
// Display height per class (junction plan J-D3): a model or box is drawn this tall, and the label sits above it.
export const HEIGHT_CAR_M = 1.5;
export const HEIGHT_TRUCK_M = 3.4;
export const HEIGHT_PEDESTRIAN_M = 1.75;
/** A motorcycle with its rider. */
export const HEIGHT_MOTORCYCLE_M = 1.5;
export const HEIGHT_BICYCLE_M = 1.7;
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

// ---- 3D models (assets/*.glb, assets/ASSETS.md) ----
// Each model's native size and axes come from `py -3 scripts/measure_glb.py assets/<file>.glb` (the bounding
// box in the model's own units; glTF is +Y up: width = X, height = Y, length = Z). Rerun it after changing a model.

/** What one embedded model looks like in its own units (see the block comment above). */
export type ModelSpec = {
  /** Extent along glTF X. */
  widthM: number;
  /** Extent along glTF Y (up). */
  heightM: number;
  /** Extent along glTF Z. */
  lengthM: number;
  /** Lowest point on the up axis; 0 means the model's origin is on the ground. */
  minUpM: number;
  /** Middle of the model along glTF Z: not at the origin for every model. */
  centreAlongZM: number;
  /** +1: the model's front is glTF +Z. -1: it is -Z, so the model is turned half a turn. */
  frontSign: 1 | -1;
};

export const MODEL_CAR: ModelSpec = {
  widthM: 1.6384,
  heightM: 1.1456,
  lengthM: 3.3096,
  minUpM: -0.0283,
  centreAlongZM: 0.0055,
  frontSign: 1,
};
export const MODEL_TRUCK: ModelSpec = {
  widthM: 2.7093,
  heightM: 2.884,
  lengthM: 5.2556,
  minUpM: 0.0007,
  centreAlongZM: -0.4352,
  frontSign: 1,
};
/** Standing, arms out and stretched wide: it is squeezed into the pedestrian's box (about 0.4 m). */
export const MODEL_PEDESTRIAN: ModelSpec = {
  widthM: 2.5095,
  heightM: 9.0146,
  lengthM: 1.8105,
  minUpM: 0.0002,
  centreAlongZM: 0,
  frontSign: 1,
};
export const MODEL_MOTORCYCLE: ModelSpec = {
  widthM: 0.2081,
  heightM: 0.4876,
  lengthM: 1.039,
  minUpM: -0.008,
  centreAlongZM: 0.0748,
  // Headlight and handlebars are on the -Z side (seen from behind in Foxglove): the model is turned half a turn.
  frontSign: -1,
};
/** The ego car (an SUV shape). */
export const MODEL_EGO: ModelSpec = {
  widthM: 2.1111,
  heightM: 1.5279,
  lengthM: 4.2093,
  minUpM: -0.0181,
  centreAlongZM: -0.0002,
  frontSign: 1,
};

/** Roof height the drawn ego car should have. */
export const EGO_HEIGHT_TARGET_M = 1.5;
/** Roof height of the drawn ego model; the ego speed text sits above this. */
export const EGO_HEIGHT_M = EGO_HEIGHT_TARGET_M;
/**
 * Yaw that turns a model's front (glTF +Z) onto the box heading. The 3D panel's default mesh up axis
 * ("y_up") already stands a glTF upright (+Y -> +z, +Z -> -y), so what is left is a quarter turn about z.
 */
export const MODEL_YAW_RAD = Math.PI / 2;
/** Required by ModelPrimitive but ignored while override_color is false: the model keeps its own colours. */
export const MODEL_UNUSED_COLOR: Color = { r: 1, g: 1, b: 1, a: 1 };

/** Paint every model in its class colour instead of its own colours (junction plan J-D8, option "tint"). */
export const MODEL_TINT_ENABLED = false as boolean;
/** Opacity of a tinted model. */
export const MODEL_TINT_ALPHA = 0.9;

// Footprint outline drawn on the ground around every object drawn as a model, in the class colour.
export const OUTLINE_Z_M = 0.04;
export const OUTLINE_THICKNESS_M = 0.12;

// The rider on a motorcycle: the pedestrian model, standing on the seat and squeezed to a seated size.
/** Height of the motorcycle model itself (the rider stands on it up to HEIGHT_MOTORCYCLE_M). */
export const BIKE_HEIGHT_M = 1.0;
/** Height where the rider model starts (its stand is hidden inside the bike body). */
export const RIDER_SEAT_Z_M = 0.3;
/** Rider footprint along the bike. */
export const RIDER_LENGTH_M = 0.55;
/** Rider footprint across the bike (never wider than the object's own box). */
export const RIDER_WIDTH_M = 0.5;
/** Rider centre ahead of the box centre. */
export const RIDER_FORWARD_M = -0.1;

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
