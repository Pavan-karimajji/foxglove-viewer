// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   An empty SceneEntity in frame "ego", replaced on every message (shared by every converter).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { Pose, SceneEntity, Time } from "@foxglove/schemas";

import { FRAME_ID } from "../style";
import { yawToQuaternion } from "./quat";

export function emptyEntity(id: string, timestamp: Time): SceneEntity {
  return {
    timestamp,
    frame_id: FRAME_ID,
    id,
    lifetime: { sec: 0, nsec: 0 },
    frame_locked: true,
    metadata: [],
    arrows: [],
    cubes: [],
    spheres: [],
    cylinders: [],
    lines: [],
    triangles: [],
    texts: [],
    models: [],
  };
}

export function pose(x: number, y: number, z: number, yawRad = 0): Pose {
  return { position: { x, y, z }, orientation: yawToQuaternion(yawRad) };
}
