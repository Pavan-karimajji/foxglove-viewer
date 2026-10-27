# foxglove-viewer — Plan

One-shot plan, 2026-10-27. Not a requirement set (no V-model, no UIDs) — a
build order plus the decisions behind it. Implementation is prompt-driven:
§8 holds one ready-to-paste prompt per step.

## 1. Goal

Open an **mcap recording** in Foxglove and show, in a 3D view, what the car
perceives: **objects** and **lanes**, around the ego car. For **customer
demos**, on a **laptop**.

The recordings come from CARLA today and from real data streams later. Both
work as long as they carry the same protobuf message types (§3).

### Non-goals

- No algorithm simulation, no resim, no driving-function outputs.
- No component layers or plug-ins. Perception, `df`, `viz` and `sim` are not
  involved and are not changed.
- No world view (ego driving through a map). Ego-fixed view only (D-5).

## 2. Decisions

| ID | Decision | Why |
|---|---|---|
| D-1 | **Own repo, `modules/foxglove-viewer`.** | It is a small standalone app. `viz` forbids naming message types like `DfObjList` (ANL-VZ-02); `interfaces` holds contracts only; `df` and perception are not the owners. One repo per component. |
| D-2 | **A Foxglove extension with message converters** (TypeScript). | Open any mcap and it draws immediately, with no preprocessing step per recording. |
| D-3 | **Converters key on the schema name, never on the topic name or CARLA.** | Future data streams may use other topic names; the schema `adas.perception.DfObjList` is the contract. |
| D-4 | **The extension only translates; it computes nothing.** Every drawn value comes straight from a message field. Display-only choices (colour, box height, arrow scale) are named constants in one file. | The picture must always show what is in the recording, nothing invented. |
| D-5 | **One coordinate frame, `ego`**, at the rear-axle centre, +x forward, +y left (R-COORD-1). Every entity uses `frame_id: "ego"`. | Objects and lanes are already ego-relative. A second frame id is how an earlier attempt rendered nothing (`docs/df_carla_viz_plan.md` §2, design #2). |
| D-6 | **Common box height for every object: `OBJECT_HEIGHT_M = 1.6`.** | `DfObj` has no height field. To be replaced later (§7). |
| D-7 | **Scope = what is recorded today:** `DfObjList`, `RoadModel`, `VehDyn`, plus the camera image that Foxglove already shows natively. | Radar detections, free space and sensor FOV are added when a recording carries them (§7). |

## 3. Input contract

Checked against `modules/foxglove-viewer/samples/bsd_passby_dv16.mcap` and
`modules/df/tools/carla/carla_producer.py`.

| Topic today | Schema (the key) | Used for |
|---|---|---|
| `objects` | `adas.perception.DfObjList` | Object boxes, velocity arrows, labels, and the ego car box |
| `lanes` | `adas.perception.RoadModel` | Lane boundary lines |
| `egoDyn` | `adas.common.VehDyn` | Ego speed text; Plot panel |
| `carla/chase_camera` | `foxglove.CompressedImage` | Image panel (native, no converter) |
| `vehSig`, `truth/actors` | — | Not used |

Proto sources: `modules/interfaces/proto/PerceptionCore__Outputs/df_obj.proto`,
`df_obj_list.proto`, `road_model.proto`, `perception/lane_boundary_types.proto`.

**Things to know about the data (do not "fix" them in the converter):**

- `maintenance_state` (DELETED=0, NEW=1, MAINTAINED=2) is filled by the CARLA
  producer from `producer_version` 3 (2026-10-27): NEW on an object's first tick
  in the list, MAINTAINED after. **Older recordings carry 0 everywhere**, so the
  converter must **not** skip objects on `maintenance_state`. It draws
  `objects[0 .. min(num_of_used_objects, objects.length) - 1]`. CARLA does not
  set `global_id`, so labels use `local_id`.
- Reference recording: `modules/foxglove-viewer/samples/bsd_passby_dv16.mcap`
  (producer version 3, 401 ticks, one passing car, lanes and chase camera; not
  committed, `.gitignore`d).
- A box is valid iff `geometry.length > 0 && geometry.width > 0`
  (`df_obj.proto`). It is centred on `kinematic.dist_x/dist_y`, and its
  heading is `geometry.orientation` (rad, CCW+, vs ego +x).
- A lane line is `y(x) = c0_m + c1·x + c2_inv_m·x² + c3_inv_m2·x³` for
  `x_start_m ≤ x ≤ x_end_m`. `x_end_m ≤ x_start_m` means unknown: skip the line.
- Enum value 0 is "unknown" for every lane enum.

## 4. Mapping — what gets drawn

All constants live in `src/style.ts`. Colours are RGBA in 0..1.

### 4.1 `DfObjList` → `foxglove.SceneUpdate`

One entity `id: "objects"`, replaced on every message, so objects that
disappear vanish. `lifetime` is 0 and `frame_locked` is true.

| Per object | Primitive | From |
|---|---|---|
| Box (valid geometry) | `cubes[]`: position `(dist_x, dist_y, OBJECT_HEIGHT_M/2)`, yaw = `orientation` as quaternion `(0, 0, sin(yaw/2), cos(yaw/2))`, size `(length, width, OBJECT_HEIGHT_M)` | `kinematic`, `geometry` |
| No valid box | `spheres[]`: diameter `NO_BOX_MARKER_M = 0.6` at `(dist_x, dist_y, 0.3)` | `kinematic` |
| Colour | By `attributes.classification`: car / truck / pedestrian / two-wheeler (MOTORCYCLE, BICYCLE) / other. Alpha `OBJECT_ALPHA = 0.6` | `attributes` |
| Velocity arrow | `arrows[]` from the box centre, direction `atan2(vabs_y, vabs_x)`, shaft length `speed × ARROW_S_PER_MPS (0.5)`, capped at `ARROW_MAX_M = 15`; omitted below `ARROW_MIN_MPS = 0.5` | `kinematic.vabs_x/vabs_y` (absolute velocity, already in ego axes) |
| Label | `texts[]`, billboard, above the box: `"<CLASS> #<local_id>  <km/h>"` | `classification`, `local_id`, `vabs` |

Plus one **ego car** cube in the same entity: `EGO_LENGTH_M = 4.5`,
`EGO_WIDTH_M = 1.8`, centre `(EGO_CENTRE_X_M = 1.35, 0, OBJECT_HEIGHT_M/2)`,
in a distinct colour. These are display constants; take them from
`ego_params.yaml` later (§7).

### 4.2 `RoadModel` → `foxglove.SceneUpdate`

One entity `id: "lanes"`, replaced on every message.

| Per boundary | Primitive | From |
|---|---|---|
| Line | `lines[]`, `LINE_STRIP`, points sampled every `LANE_SAMPLE_M = 1.0` from `x_start_m` to `x_end_m` (at most `LANE_MAX_POINTS = 300`), `z = 0.02` | `c0_m..c3_inv_m2`, `x_start_m`, `x_end_m` |
| Thickness | `marker_width_m` if > 0, else `LANE_DEFAULT_WIDTH_M = 0.15`; a road edge (`KIND_ROAD_EDGE`) uses `ROAD_EDGE_WIDTH_M = 0.3` | `marker_width_m`, `kind` |
| Colour | `MARKER_WHITE` → white, `MARKER_YELLOW` → yellow, unknown → light grey, road edge → dark grey | `marker_colour`, `kind` |
| Alpha | `SOURCE_MEASURED` → 1.0; predicted / virtual / unknown → `LANE_UNMEASURED_ALPHA = 0.4` | `source` |

Dashed rendering (`MARKER_DASHED`) is a stretch item in step S-3, not required.

### 4.3 `VehDyn` → `foxglove.SceneUpdate`

One entity `id: "ego_hud"`: a single text above the ego car, `"<km/h>"`,
from `vx`. The ego speed also goes on the Plot panel natively.

## 5. Repo layout (target)

```
modules/foxglove-viewer/
  docs/plan.md                 <- this file
  README.md                    <- how to build, install and run the demo (S-4)
  package.json, tsconfig.json  <- from the official extension template (S-1)
  .gitignore                   <- node_modules/, dist/, *.foxe, samples/*.mcap (exists already)
  samples/                     <- reference recordings, never committed
  src/
    index.ts                   <- activate(): registers the three converters, nothing else
    style.ts                   <- every display constant from §4
    convert/objects.ts         <- DfObjList -> SceneUpdate (pure function)
    convert/lanes.ts           <- RoadModel -> SceneUpdate (pure function)
    convert/ego.ts             <- VehDyn    -> SceneUpdate (pure function)
    convert/quat.ts            <- yaw -> quaternion
  test/                        <- unit tests of the pure functions, hand-built input objects
  layouts/demo_layout.json     <- exported Foxglove layout (S-4)
```

Converters are pure functions `(message) -> SceneUpdate`, with no Foxglove
runtime import, so they unit-test without the app.

## 6. Build order

| Step | Lands | Done when |
|---|---|---|
| S-0 | **Prerequisites (human)** — install Node.js LTS (not on this machine today); choose **Foxglove desktop or Lichtblick** and confirm the licence fits customer demos; later, create the remote repo and `git submodule add` it | `node --version` works; the app is chosen |
| S-1 | **Scaffold + spike** — official extension template; a minimal `DfObjList` converter drawing one cube per object; local install; open the sample mcap | Moving boxes visible in the 3D panel with display frame `ego`; §9 findings filled in |
| S-2 | **Objects** — full §4.1 mapping + ego car + unit tests | Tests pass; boxes, arrows and labels look right on the sample mcap |
| S-3 | **Lanes** — §4.2 mapping + unit tests (+ optional dashed) | Tests pass; lanes line up under the objects |
| S-4 | **Ego HUD, layout, packaging** — §4.3, `layouts/demo_layout.json` (3D main + Image + Plot of `egoDyn.vx`), `npm run package` → `.foxe`, `README.md` | A fresh install from the `.foxe` + layout shows the full demo |
| S-5 | **Demo dry run** — on the demo laptop, from the `.foxe` and README only, with 2–3 recordings (LDW, BSD, AEB) | Works without this repo's checkout; issues fed back as §7 items |

## 7. Later (not now)

- Real object height (needs a field in `DfObj`, or a per-class default as a style decision).
- Ego dimensions from `ego_params.yaml` instead of constants.
- Radar detections / point cloud, free space, sensor FOV cones — when a recording carries them.
- Real data streams: confirm they use the same schemas (§3). If not, add one converter per new schema.
- Fixed-slot object lists: if real data pads `objects[]`, revisit the `num_of_used_objects` rule in §3.
- World view (needs ego pose).

## 8. Prompts (Sonnet 5.5, medium effort)

Paste one prompt per session, in order. Each assumes the previous step is done.

### S-1 — Scaffold + spike

```
Read modules/foxglove-viewer/docs/plan.md fully. Do step S-1 only.

1. In modules/foxglove-viewer/, scaffold a Foxglove extension using the official
   template (npm init foxglove-extension@latest), so package.json, tsconfig.json
   and src/index.ts land directly in this folder. Keep the existing .gitignore and samples/.
2. In src/index.ts register ONE message converter: fromSchemaName
   "adas.perception.DfObjList" -> toSchemaName "foxglove.SceneUpdate". It emits one
   entity id "objects", frame_id "ego", with one cube per object at
   (dist_x, dist_y, 0.8), size (4, 2, 1.6). Check the exact registerMessageConverter
   signature in the installed @foxglove/extension type definitions; do not guess.
   Use @foxglove/schemas types for SceneUpdate.
3. Log one decoded message (console.log) so we can see how fields arrive.
4. Build and local-install (the template's local-install script). Tell me the exact
   steps to open modules/foxglove-viewer/samples/bsd_passby_dv16.mcap,
   add a 3D panel, enable the "objects" topic and set the display frame to "ego".
5. After I confirm boxes are visible, fill in plan §9: field-name casing (snake_case
   or camelCase), how enums arrive (number or string), how the 64-bit sig_header fields
   arrive, the exact converter signature, and any frame issue.

Rules: plan D-3, D-4, D-5. Copy the file header block from
.claude/templates/file_header.py into each .ts file, adapted to // comments, with
COMPONENT: FOXGLOVE_VIEWER. Do not touch any other module. Do not commit.
```

### S-2 — Objects

```
Read modules/foxglove-viewer/docs/plan.md fully, including the §9 findings. Do step S-2 only.

1. Create src/style.ts with every constant named in plan §4.1 and §4.2.
2. Create src/convert/quat.ts and src/convert/objects.ts: a pure function
   DfObjList -> SceneUpdate implementing plan §4.1 exactly, including the ego car cube
   and the §3 rules (draw the first min(num_of_used_objects, objects.length) objects,
   never skip on maintenance_state, label with local_id, sphere when the box is invalid).
   Use the field casing recorded in §9.
3. Replace the spike converter in src/index.ts with this function.
4. Add unit tests in test/ (use vitest unless the template already has a runner):
   a valid box with yaw 90 deg, an invalid box -> sphere, a slow object -> no arrow,
   num_of_used_objects smaller than objects.length, an empty list -> ego car only.
   Each test must be able to fail: check the actual numbers.
5. Build, run the tests, local-install, and tell me what to look at in the sample mcap.

Rules: plan D-4 (no computed values beyond §4, all constants in style.ts), D-5.
File headers as in S-1. Do not touch any other module. Do not commit.
```

### S-3 — Lanes

```
Read modules/foxglove-viewer/docs/plan.md fully, including §9. Do step S-3 only.

1. Create src/convert/lanes.ts: a pure function RoadModel -> SceneUpdate implementing
   plan §4.2 exactly (cubic y(x), sampling, skip when x_end_m <= x_start_m, thickness,
   colour and alpha rules). Register it in src/index.ts for schema
   "adas.perception.RoadModel".
2. Unit tests: a straight line (c1..c3 = 0) -> constant y; a curved line -> check
   y at one sampled x; an unknown range -> no line; a road edge -> edge width and colour;
   a predicted source -> reduced alpha; LANE_MAX_POINTS cap.
3. Optional, only if 1-2 are done and green: dashed rendering for MARKER_DASHED
   as LINE_LIST segments, with the dash/gap lengths as constants in style.ts.
4. Build, test, local-install; tell me what to check on
   modules/foxglove-viewer/samples/bsd_passby_dv16.mcap.

Rules as in S-2. Do not commit.
```

### S-4 — Ego HUD, layout, packaging

```
Read modules/foxglove-viewer/docs/plan.md fully, including §9. Do step S-4 only.

1. Create src/convert/ego.ts: VehDyn -> SceneUpdate per plan §4.3; register it for
   "adas.common.VehDyn". Unit test: vx = 10 m/s -> "36 km/h".
2. Guide me through building the demo layout in the app: 3D panel (display frame ego,
   topics objects, lanes, egoDyn; camera looking forward from behind the ego car),
   Image panel on the camera topic, Plot panel of egoDyn vx. Then I export it and you
   save it as layouts/demo_layout.json.
3. Package the extension (the template's package script) into a .foxe.
4. Write README.md for a demo presenter who has never seen this repo: install the app,
   install the .foxe, import the layout, open an mcap, what each colour means
   (from style.ts), and known limits (common height, ego-fixed view).
5. Fill in any remaining §9 findings.

Rules as in S-2. Do not commit.
```

### S-5 — Demo dry run

```
Read modules/foxglove-viewer/docs/plan.md and README.md. Do step S-5 only.
Walk me through a dry run on the demo laptop using ONLY the .foxe, the layout and the
README, with one LDW, one BSD and one AEB recording from modules/df/tests/carla_testruns/.
Record every problem found as a bullet in plan §7 (what happened, which recording).
Fix only README wording during this step; code fixes become new prompts.
Do not commit.
```

## 9. Findings (filled in during S-1..S-4)

- Field-name casing as decoded: _tbd (S-1)_
- Enums arrive as: _tbd (S-1)_
- 64-bit fields arrive as: _tbd (S-1)_
- Exact `registerMessageConverter` signature used: _tbd (S-1)_
- Frame / display-frame notes: _tbd (S-1)_
