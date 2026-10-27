// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   The ego car .glb as bytes, decoded once when the extension loads (never per message).
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { EGO_MODEL_BASE64 } from "./ego_model_data";

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/** One instance for the whole session: every message hands Foxglove this same array. */
export const EGO_MODEL_DATA: Uint8Array = decodeBase64(EGO_MODEL_BASE64);
