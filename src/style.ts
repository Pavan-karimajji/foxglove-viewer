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
/** Box centre ahead of the rear axle (the ego origin). */
export const EGO_CENTRE_X_M = 1.35;

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
/** The ego car. */
export const COLOR_EGO: Color = { r: 0, g: 0.85, b: 0.85, a: 1 };

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
