# Changelog

`npm run package` refuses to build a `.foxe` without this file.

## 0.2.1

- The ego car model is scaled per axis to 4.5 m long, 1.8 m wide and 1.5 m high (0.2.0 scaled it evenly to a too wide, too tall 2.65 x 2.3 m), and centred on the ego centre.
- The ego speed text sits 0.4 m above the new 1.5 m roof.

## 0.2.0

- The ego vehicle is drawn as a 3D car model (CC0, `assets/ASSETS.md`) instead of a box, bundled inside the extension.
- The ego speed text sits above the roof of the model.
- `layouts/demo_layout.json` ships with the grid hidden; new `demo_layout.png`.

## 0.1.1

- Smaller bundle: `convert/lanes.ts` no longer imports the `LineType` enum, so the extension no longer pulls in all of `@foxglove/schemas`.
- Demo polish documented: dark theme and timestamps in seconds ("Before a demo" checklist in the README); new `demo_layout.png`.

## 0.1.0

- Objects from `adas.perception.DfObjList`: boxes coloured by class, velocity arrows, labels, ego car.
- Lane lines from `adas.perception.RoadModel`.
- Ego speed from `adas.common.VehDyn`.
- Demo layout `layouts/demo_layout.json`.
