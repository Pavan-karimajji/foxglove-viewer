// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   The embedded .glb models as bytes, each decoded once when the extension loads (never per message).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { MODEL_BASE64 } from "./models_data";

export type ModelId = keyof typeof MODEL_BASE64;

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/** One instance per model for the whole session: every message hands Foxglove these same arrays. */
export const MODEL_DATA: Record<ModelId, Uint8Array> = {
  CAR: decodeBase64(MODEL_BASE64.CAR),
  TRUCK: decodeBase64(MODEL_BASE64.TRUCK),
  PEDESTRIAN: decodeBase64(MODEL_BASE64.PEDESTRIAN),
  EGO: decodeBase64(MODEL_BASE64.EGO),
};
