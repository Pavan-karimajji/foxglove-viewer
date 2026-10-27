# Changelog

`npm run package` refuses to build a `.foxe` without this file.

## 0.1.1

- Smaller bundle: `convert/lanes.ts` no longer imports the `LineType` enum, so the extension no longer pulls in all of `@foxglove/schemas`.
- Demo polish documented: dark theme and timestamps in seconds ("Before a demo" checklist in the README); new `demo_layout.png`.

## 0.1.0

- Objects from `adas.perception.DfObjList`: boxes coloured by class, velocity arrows, labels, ego car.
- Lane lines from `adas.perception.RoadModel`.
- Ego speed from `adas.common.VehDyn`.
- Demo layout `layouts/demo_layout.json`.
