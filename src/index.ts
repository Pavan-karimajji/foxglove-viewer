// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Extension entry point: registers the message converters, nothing else.
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import { ExtensionContext } from "@foxglove/extension";

import { convertObjects, DfObjList } from "./convert/objects";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerMessageConverter({
    type: "schema",
    fromSchemaName: "adas.perception.DfObjList",
    toSchemaName: "foxglove.SceneUpdate",
    converter: (msg: DfObjList, event) => convertObjects(msg, event.receiveTime),
  });
}
