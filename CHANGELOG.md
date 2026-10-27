# Changelog

`npm run package` refuses to build a `.foxe` without this file.

## 0.3.0

- Objects are drawn as 3D models per class: car, truck, pedestrian, and motorcycle with a rider (CC0, `assets/ASSETS.md`). Each model is scaled per axis into the object's own reported box, with a class-coloured footprint outline.
- Per-class display heights: car 1.5 m, truck 3.4 m, pedestrian 1.75 m, motorcycle 1.5 m, bicycle 1.7 m, other 1.6 m.
- Fallback per object: no model for the class (bicycle, unclassified, unknown, ...) -> box; no valid box -> ball.
- New topic `objects_boxes` (appears beside `objects` in the 3D panel settings): every object as a box, as the sensor reports it.
- The ego car is a different model (an SUV shape), still 4.5 x 1.8 x 1.5 m. The Kenney sedan is removed.
- The `.foxe` grows to carry the models (about 0.8 MB, was 0.2 MB).

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
