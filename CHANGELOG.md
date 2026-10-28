# Changelog

`npm run package` refuses to build a `.foxe` without this file.

## 0.5.0

- Labels moved to their own topic `objects_labels` (off by default in the demo layout); `objects` and `objects_boxes` draw no text. A label is short: `CAR`, `TRK`, `PED`, `MOTO`, `BIKE`, `OBJ`, the speed only for a moving object (the arrow's 0.5 m/s limit), the confidence as before; no `#id` (the id is in the entity's `metadata`, visible when an object is selected). Label font 14 -> 12 px.
- Pedestrians are drawn with a static CC0 person model (iPoly3D "Fitness Character") instead of the mannequin; the model is centred across its heading too (`centreAcrossXM`).
- MOTORCYCLE and BICYCLE are class-coloured boxes (`BOX_ONLY_CLASSES`); the cartoon motorcycle, the rider composition and the mannequin are removed from the bundle (`assets/ASSETS.md`).
- Demo layout: the chase view looks ahead with the ego in the lower third; the BEV is straight down (orthographic, ego +x up, ego near the bottom, about 50 m ahead); "Show outlines" is off on the object topics.

## 0.4.0

- `layouts/demo_layout.json` has a second 3D panel, a high-above BEV (perspective, tilted 40 degrees, 28 m, 8 m ahead of the ego car), beside the chase view and the camera. Both follow `ego`, grid hidden, `objects_boxes` hidden by default.
- Junction demo recordings (`samples/junction_classes.mcap`, `samples/junction_unclassified.mcap`, not in git) and a 2-minute presenter script in the README.
- Extension code unchanged.

## 0.3.1

- The object label shows the class confidence when the sender filled it (above 0), as the raw number: `PEDESTRIAN conf 87  #3  5 km/h`. Its unit is unconfirmed, so there is no percent sign. A 0 or absent confidence leaves the label as before.

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
