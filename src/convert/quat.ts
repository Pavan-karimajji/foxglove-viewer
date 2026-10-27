// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Yaw angle about +z -> quaternion.
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { Quaternion } from "@foxglove/schemas";

/** Rotation of `yawRad` about +z (CCW positive), as (0, 0, sin(yaw/2), cos(yaw/2)). */
export function yawToQuaternion(yawRad: number): Quaternion {
  return { x: 0, y: 0, z: Math.sin(yawRad / 2), w: Math.cos(yawRad / 2) };
}
