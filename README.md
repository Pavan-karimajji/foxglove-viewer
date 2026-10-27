# ADAS Foxglove Viewer

This is a small add-on (an *extension*) for the Foxglove app. Open a
recording (`.mcap`) and it draws, in a 3D view, what the car perceived:

- the **objects** around the car, as boxes with an arrow showing where each
  one is moving and a label with its class and speed;
- the **lane lines**;
- the **ego car** itself, with its speed above it.

The view moves with the ego car. Next to it you see the camera video and a
speed plot, both drawn by Foxglove itself.

![Demo layout](docs/demo_layout.png)

## Before a demo

- [ ] **Dark theme.** *Profile menu (top right) -> Settings -> Appearance ->
  Color scheme -> Dark.* White lane lines and labels are hard to read on the light theme.
- [ ] **Timestamp format in seconds.** Same page, *Visualization timestamp
  format -> Seconds*, so the time bar shows `11.7` rather than a 1970 date.
- [ ] **`demo_layout` imported and selected** (see below).
- [ ] **Extension version 0.1.1** shown under *profile menu -> Extensions*.

## Set up the demo laptop (once)

1. **Install Foxglove desktop** from <https://foxglove.dev/download> and sign in.
2. **Install the extension.** Drag `adas.foxglove-viewer-0.1.1.foxe` onto the
   Foxglove window. Check it under *profile menu (top right) -> Extensions*:
   "ADAS Foxglove Viewer" should be listed.
   - **Updating to a new `.foxe`?** First remove the old one: *Extensions ->
     ADAS Foxglove Viewer -> Uninstall*. Then drag in the new file and
     restart Foxglove (or press `Ctrl+R`).
3. **Import the layout.** Click the layout name at the top right ->
   *Import from file…* -> pick `layouts/demo_layout.json`. A layout called
   `demo_layout` appears and becomes active.

## Run the demo

1. *Dashboard -> Open local file(s)* and pick a recording, such as
   `samples/bsd_passby_dv16.mcap`. Allow file access if Foxglove asks.
2. Make sure the layout at the top right says `demo_layout`.
3. Press play (or drag the time bar at the bottom).

The large panel on the left is the 3D view, seen from behind and above the
ego car. The right side shows the camera video (`carla/chase_camera`) and the
ego speed over time.

## What you see

| What | Colour | Hex |
|---|---|---|
| Ego car (box) | teal | `#00d9d9` |
| Car | blue | `#4099ff` |
| Truck | orange | `#ff8c1a` |
| Pedestrian | pink | `#ff40a6` |
| Two-wheeler (motorcycle, bicycle) | green | `#4de64d` |
| Any other object class | grey | `#b3b3b3` |
| White lane marking | white | `#ffffff` |
| Yellow lane marking | yellow | `#ffd900` |
| Lane marking of unknown colour | light grey | `#bfbfbf` |
| Road edge | dark grey | `#595959` |

*This table is printed by `npx vite-node scripts/colour_table.ts` from the
values in `src/style.ts`. Rerun it and paste the output here if a colour changes.*

- **Boxes** are see-through. A small **ball** marks an object whose size is unknown.
- **Arrow**: it starts at the middle of an object and points where the object
  is moving over the ground. A longer arrow means a faster object
  (0.5 m of arrow per m/s, at most 15 m). Objects slower than 0.5 m/s get no arrow.
- **Label** above each object: class, the object's number in this recording,
  and its speed over the ground, for example `CAR #1  88 km/h`.
- **Text above the ego car**: the ego speed in km/h.
- A **faded lane line** was predicted, not measured, in this frame.
  A fully opaque line was measured.

## Known limits

- **Every box is 1.6 m tall.** The recordings carry no object height.
- **Ego-fixed view only.** The ego car stays in the middle and the world moves
  past it. There is no map and no driven path.
- The ego box size is fixed (4.5 m x 1.8 m). It is not read from the recording.
- **Only these recordings work:** ones whose topics use the
  `adas.perception.DfObjList` (objects), `adas.perception.RoadModel` (lanes)
  and `adas.common.VehDyn` (ego speed) schemas. Topic names do not matter.
- Recordings made before 2026-10-27 may show `Error in topic truth/actors` in
  the *Problems* tab. That topic is not used by the viewer and the error can be ignored.

## Rebuild the `.foxe` (developers)

In WSL, from this folder:

```sh
export PATH=$HOME/.local/node-v20.18.0-linux-x64/bin:$PATH
npm ci            # clean install of the pinned dependencies
npm test          # unit tests of the converters
npm run package   # writes adas.foxglove-viewer-<version>.foxe here
```

The code lives in `src/`. `src/convert/*.ts` turns each message type into
3D shapes, and every size and colour is a named value in `src/style.ts`. The
design and build order are in `docs/plan.md`.
