// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   adas.common.VehDyn -> foxglove.SceneUpdate: ego speed text above the ego car (plan 4.3).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { SceneUpdate, Time } from "@foxglove/schemas";

import * as S from "../style";
import { emptyEntity, pose } from "./entity";

// Decoded shape (plan section 9); only the field drawn. Proto: VehSigProvider__Outputs/veh_dyn.proto.
export type VehDyn = { longitudinal?: { velocity: number } | null };

export function egoSpeedText(msg: VehDyn): string {
  return `${Math.round((msg.longitudinal?.velocity ?? 0) * S.MPS_TO_KMH)} km/h`;
}

export function convertEgo(msg: VehDyn, receiveTime: Time): SceneUpdate {
  const entity = emptyEntity("ego_hud", receiveTime);
  entity.texts.push({
    pose: pose(S.EGO_CENTRE_X_M, 0, S.EGO_HEIGHT_M + S.LABEL_OFFSET_M),
    billboard: true,
    font_size: S.LABEL_FONT_SIZE_PX,
    scale_invariant: true,
    color: S.LABEL_COLOR,
    text: egoSpeedText(msg),
  });
  return { deletions: [], entities: [entity] };
}
