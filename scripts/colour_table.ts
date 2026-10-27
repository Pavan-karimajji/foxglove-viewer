// Copyright (c) LT EPS. All Rights Reserved.
// Proprietary and Confidential.
// COMPONENT: FOXGLOVE_VIEWER
/// @file
/// @brief
///   Prints the README colour table from src/style.ts. Run: npx vite-node scripts/colour_table.ts
/// @author Pavan Karimajji <Pavan.Karimajji@larsentoubro.com>

import type { Color } from "@foxglove/schemas";

import * as S from "../src/style";

const ROWS: [string, Color, string][] = [
  ["Ego car (box)", S.COLOR_EGO, "teal"],
  ["Car", S.COLOR_CAR, "blue"],
  ["Truck", S.COLOR_TRUCK, "orange"],
  ["Pedestrian", S.COLOR_PEDESTRIAN, "pink"],
  ["Two-wheeler (motorcycle, bicycle)", S.COLOR_TWO_WHEELER, "green"],
  ["Any other object class", S.COLOR_OTHER, "grey"],
  ["White lane marking", S.COLOR_LANE_WHITE, "white"],
  ["Yellow lane marking", S.COLOR_LANE_YELLOW, "yellow"],
  ["Lane marking of unknown colour", S.COLOR_LANE_UNKNOWN, "light grey"],
  ["Road edge", S.COLOR_ROAD_EDGE, "dark grey"],
];

function hex(c: Color): string {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

console.log("| What | Colour | Hex |\n|---|---|---|");
for (const [what, c, name] of ROWS) {
  console.log(`| ${what} | ${name} | \`${hex(c)}\` |`);
}
