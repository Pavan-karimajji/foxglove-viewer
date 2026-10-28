# foxglove-viewer — Plan extension: class models + junction demo

One-shot plan extension, 2026-10-27. It extends `docs/plan.md` and changes none of its
decisions except D-6 (common box height), which J-D3 refines. Same style: no V-model,
no UIDs, a build order plus the decisions behind it, one ready-to-paste prompt per step (§7).

## 1. Goal

A demo a team or customer understands at a glance: a **signalised junction** where
**cars, trucks, pedestrians, motorcyclists and cyclists** cross in front of the ego car,
drawn in the 3D view as **realistic 3D models per class**, next to the camera video.

When the data does not say what an object is (a radar that does not classify, or classifies
only some objects), the same view **falls back to cuboids automatically**, object by object,
with no configuration change.

Visual quality is the priority: one consistent art style, correct sizes, smooth playback.

### Non-goals

- Still no algorithm, no resim, no driving-function outputs (`plan.md` §1).
- The viewer still invents nothing (`plan.md` D-4). A model is drawn **inside the box the
  recording reports**; it never makes an object bigger, smaller or more certain than the data.
- No traffic-light state in the 3D view in this pass. See J-D7.

## 2. What the data already gives

Checked 2026-10-27.

- `DfObj.attributes.classification` (enum, `PerceptionCore__Outputs/df_obj.proto`):
  `POINT 0, CAR 1, TRUCK 2, PEDESTRIAN 3, MOTORCYCLE 4, BICYCLE 5, WIDE 6, UNCLASSIFIED 7,
  OTHER_VEHICLE 8, TL 9, MULTIPLE 10`. The viewer already colours and labels by it.
- `DfObj.attributes.class_confidence` (uint32, unit not documented in the proto): not drawn
  today; the CARLA producer leaves it 0.
- `DfObj.shape.length` / `width` / `orientation`: the box. There is no height field.
- The CARLA producer already spawns `CAR`, `TRUCK`, `PEDESTRIAN`, `MOTORCYCLE` and `BICYCLE`
  (`_CLASSIFICATION`, `carla_producer.py`), and the CTA scenario
  `modules/df/tests/carla_scenarios/cta/cta_rx_class_gate_town05.yaml` already crosses a
  motorcycle, a bicycle and a pedestrian. That makes it the **interim test recording** for the
  viewer work (J-1), before the junction recording exists (J-3).
- Actors are moved kinematically (teleported, physics off). Pedestrians moved this way **slide
  without walking** in the camera image. J-D6 handles it.

## 3. Decisions

| ID | Decision | Why |
|---|---|---|
| J-D1 | **One 3D model per class that has a real-world shape: CAR, TRUCK, PEDESTRIAN, MOTORCYCLE (with rider), BICYCLE (with rider).** | These are the classes a radar or camera classifier realistically reports, and the ones in the demo scene. |
| J-D2 | **A model is scaled per axis into the object's own box:** length and width from `DfObj.shape`, height from the per-class constant (J-D3), yaw from `orientation`, centred on `dist_x/dist_y`, wheels or feet on the ground. | The box is the data; the model is how it is dressed. A 4.2 m car in the data is drawn 4.2 m long, the same per-axis method as the ego (`8dead85`). |
| J-D3 | **Per-class display height, one named constant each, in `style.ts`:** CAR 1.5, TRUCK 3.4, PEDESTRIAN 1.75, MOTORCYCLE 1.5, BICYCLE 1.7, everything else `OBJECT_HEIGHT_M` 1.6. | Still no height field (`plan.md` D-6). A pedestrian drawn 1.6 m wide-box-shaped is what makes today's view look unreal. A display choice, so it lives with the other display constants. |
| J-D4 | **Fallback ladder, decided per object, from the data only (no thresholds):** (1) class has a model **and** the box is valid → model; (2) box valid, class has no model (`POINT`, `WIDE`, `UNCLASSIFIED`, `OTHER_VEHICLE`, `MULTIPLE`, `TL`, any unknown value) → cuboid, today's style; (3) box not valid → sphere, today's style. | This is the "easy fallback": a radar that sends `UNCLASSIFIED` gets cuboids with no switch, and a radar that classifies some objects gets a mixed scene that is honest object by object. No confidence threshold, because the viewer owns no thresholds (`plan.md` D-4); a sender that is unsure sends `UNCLASSIFIED`. |
| J-D5 | **A presenter switch "cuboids only"** that draws rung (2) for every object with a valid box, and an optional thin **outline of the reported box** around each model. The mechanism is decided by the J-0 spike (§6). | Lets the presenter show the same recording "as the radar reports it" and "dressed", and shows the box the model was fitted into. |
| J-D6 | **Pedestrians in the camera image must walk, not slide.** The producer drives walkers so CARLA plays their walk animation, while keeping the recorded positions reproducible. The method is decided in the J-3 survey. | A sliding mannequin in the video next to a polished 3D view ruins the demo. |
| J-D7 | **The traffic light is part of the scene, not of the 3D view.** The scenario controls the signal (ego waits at red, cross traffic flows, then the phases swap) and the camera shows it. It is **not** drawn in the 3D view in this pass. | Drawing a signal state the sensors did not report, next to what they did, would let a viewer believe the radar sees traffic lights (`plan.md` D-4). If wanted later, it arrives as its own clearly separate "scene context" topic (§8). |
| J-D8 | **Class colour stays the identity in every rung.** The J-0 spike renders both options, models **tinted** in the class colour and models in their **own colours** plus a class-coloured footprint or outline, and the user picks from the screenshots. | The colour legend in the README must stay true whatever is drawn. Which option reads better is a visual call, made on real pixels. |
| J-D9 | **One consistent art style for all six models (five classes plus the ego).** CC0 only, no brand names or logos, each recorded in `assets/ASSETS.md` (source, author, licence, sha256), embedded in the `.foxe` so the demo runs offline. If no consistent CC0 set reaches the quality bar, the J-0 report says so and proposes a paid licensed pack instead. Nothing is used without a written licence. | Mixed styles (one toy car beside one realistic pedestrian) look worse than cuboids. The ego model may be swapped to keep the set consistent. |
| J-D10 | **Label shows the class confidence when the sender filled it** (`> 0`), for example `PEDESTRIAN 87%  #3  5 km/h`. The unit is checked against the radar software's documentation before showing a `%`; until confirmed, the raw number is shown. | Radar classification is less certain than camera classification, and the team will ask. 0 is what CARLA writes and means "not filled" here. |
| J-D11 | **Two recordings of the junction scene:** one with true classes, one with every class written as `UNCLASSIFIED` (a producer flag, recorded in the mcap metadata). | Shows the fallback with the same traffic, side by side or one after the other. |
| J-D12 | **The demo layout gets a second 3D panel, a top-down BEV**, beside today's chase view, both following `ego`. | A junction reads best from above; the chase view sells the 3D. |
| J-D13 | **Road context is its own topic, `map/context`, drawn under the objects, and the presenter can switch it off** (untick it in the 3D panel, like `objects_labels`). Real sensor recordings do not carry it, so it is simply absent there. Added 2026-10-28. | In the BEV, pedestrians read as "people crossing" only when a crosswalk is under them. It comes from the map, not from a sensor, so it must be separable from what the sensors reported (`plan.md` D-4). |
| J-D14 | **Content: road surface, sidewalks, crosswalks, stop lines, road edges, junction area. No lane markings.** | Lane markings already come from `RoadModel` (the `lanes` topic, perception). Two sources for one kind of line would disagree and the viewer could not say which is true. |
| J-D15 | **Schema `scene_context.Map`, JSON with a real JSON schema** (like `truth/actors`, never `{}`), every item `{kind, polyline}` or `{kind, triangles}`, metres, in the `map` frame, plus `source: "carla_map"`. The **producer triangulates** surfaces; the viewer only styles by `kind`. Not a protobuf in `interfaces`: it is demo tooling, never a component port or an ECU output. | The viewer still computes nothing (`plan.md` D-4): triangulation is geometry and belongs to the producer. A neutral name lets an HD map fill the same topic later; `source` says where it came from. |
| J-D16 | **Static geometry plus one transform per tick.** The map is sent in frame `map`, repeated once per second (so a seek always finds one); a `foxglove.FrameTransform` per tick on topic `map/frame` gives `map` in `ego` (parent `ego`, child `map`). The 3D panel keeps `ego` as its display frame. | Re-sending the whole junction in ego coordinates every tick would add tens of MB per recording. One small transform per tick does the same job. Both frames connect through that transform, which is exactly what the earlier failed attempt lacked (`plan.md` D-5). |
| J-D17 | **The transform uses the same ego pose and the same CARLA→ego conversion the producer already applies to objects** (rear-axle origin, CARLA's left-handed Y flipped). Never a second conversion. | If map and objects use two conversions, cars drift off the road by the difference, and the demo shows a wrong picture that looks right. Cars on the road and pedestrians on crosswalks become the alignment check. |
| J-D18 | **Style: dark asphalt surface, slightly lighter sidewalks, white crosswalk fill, white stop lines, grey road edges**, all named constants in `style.ts`, drawn just below `z = 0` in that order so nothing flickers against the lanes and objects. Demo layout: `map/context` **on**. | Readable on the dark theme, quiet enough that objects stay the focus. |

## 4. The junction scene (CARLA, `df` repo)

The producer and scenarios live in `modules/df/tools/carla` and
`modules/df/tests/carla_scenarios`, so this part is a `df` change, committed in `df` first
(R-GIT-1). A new scenario family, `demo/`, so no function's test set changes.

- **Place.** A four-way signalised junction with crosswalks, in a town with a good-looking
  camera view. J-3 picks it and records why.
- **Ego.** Approaches, stops at the stop line on red, waits, then goes on green and crosses
  the junction. About 30 s.
- **Cross traffic while ego waits.** Cars both ways, one truck, two motorcyclists, one cyclist,
  some turning.
- **Pedestrians.** A group crossing on the crosswalk in front of the ego during the ego's red,
  one crossing late, one standing at the kerb (a static pedestrian is a real test of a model's
  heading).
- **After ego's green.** Pedestrians on the side crosswalk while ego turns or crosses, so the
  scene changes around the ego.
- **Signal.** The producer sets and freezes each light's state from a timeline in the scenario
  YAML, so the camera, the traffic and the timing agree on every run.
- **Sensors.** The front coverage used for the object list is declared in the scenario's sensor
  model, never restated (R-SIM-9). Objects outside coverage are not in the list, which is
  realistic and is said in the README.
- **Object count.** Up to about 20 at once, which also tests playback smoothness with many models.
- **Lanes.** `RoadModel` polynomials do not describe a junction interior. J-3 checks what the
  producer emits there and prefers ending the lines at the junction over drawing a wrong curve.
- **Classes off.** `--classes-unclassified` writes `UNCLASSIFIED` for every object and records
  that in the mcap metadata (J-D11).

## 5. Build order

| Step | What | Repo | Done when |
|---|---|---|---|
| J-0 | Asset hunt + visual spike: model set, tint vs own colours, the J-D5 switch mechanism, performance with many models | foxglove-viewer | User has picked the style from screenshots; the switch mechanism is proven; nothing committed except `docs/` notes |
| J-1 | Class models + fallback ladder + per-class heights + switch + outline | foxglove-viewer | Tests for every rung; the interim CTA recording shows models, cuboids and spheres correctly; smooth at 1x |
| J-2 | Confidence in label + README legend update | foxglove-viewer | Tests; README class table shows the model and fallback rules |
| J-3 | Junction scenario + signal timeline + walking pedestrians + classes-off flag | df | Two mcaps produced; the camera shows walking pedestrians and correct signals; df gate green |
| J-4 | Junction recordings into `samples/`, BEV + chase demo layout, README demo script | foxglove-viewer | Layout imported; screenshots of both recordings in `docs/` |
| J-5 | Demo dry run on the laptop, same as `plan.md` S-5 | — | Run end to end offline |
| J-6 | Road context in the producer: `map/context` + `map/frame` (J-D13..J-D17) | df | Both junction mcaps regenerated with the two topics; pure-geometry tests green; df gate green |
| J-7 | Road context in the viewer: converter, style, demo layout (J-D15, J-D18) | foxglove-viewer | BEV screenshots: cars on the road, pedestrians on crosswalks/sidewalks; switches off cleanly; playback unchanged |

J-1/J-2 and J-3 can run in parallel (different repos); J-4 needs both.

## 6. Risks to check, not assume

- **Model reload per frame.** The ego model was checked not to reload (`6f78f98`). With twenty
  objects sharing five models, J-0 checks the same holds (the same `Uint8Array` instance per
  class, decoded once) and that playback stays smooth.
- **Switch mechanism.** Message converters have no settings UI. Candidates, in order: per-entity
  or per-namespace visibility in the 3D panel's topic settings (models and cuboids as separate
  entities); a topic alias registered by the extension (`registerTopicAliases`) whose converted
  output is cuboids only. J-0 proves one in Foxglove before J-1 builds it.
- **Bundle size.** Five or six models must stay small enough that the `.foxe` installs and loads
  instantly. J-0 reports sizes.
- **Pedestrian heading.** A walker standing still may report any `orientation`; check it looks
  sane in J-4 and note it if not.
- **Brand names.** CARLA blueprint ids carry brand names. Use them only in code where they
  already exist, never in docs or reports, and prefer unbranded blueprints.

## 7. Prompts (Sonnet 5.5, medium effort)

### J-0 — Asset hunt + visual spike

```
Read modules/foxglove-viewer/docs/plan.md and docs/plan_junction_demo.md (this plan).
Work in modules/foxglove-viewer on branch feature/foxglove-viewer. This step is a SPIKE:
do not commit source changes; write findings into docs/plan_junction_demo.md §9.

1. Find 3D models (.glb) for CAR, TRUCK, PEDESTRIAN, MOTORCYCLE with rider, BICYCLE with rider,
   and a matching ego car. Rules (J-D9): CC0 only, no brand names or logos, ONE consistent
   art style across all six, realistic enough for a customer demo, each under ~1 MB.
   Candidate CC0 sources to start from: Kenney (the current ego is Kenney Car Kit), Quaternius,
   Poly Pizza CC0 entries. Download into a new empty folder under logs/ (gitignored); never
   run anything from it. Measure each with scripts/measure_glb.py (forward axis, up axis,
   native L/W/H, min up). If no consistent CC0 set meets the bar, say so and list 1-2 paid
   packs with licence terms instead; do not use any of them.
2. Prove the J-D5 switch in Foxglove (§6 "Switch mechanism"): try per-entity visibility in
   the 3D panel's topic settings first, then a topic alias (registerTopicAliases) whose
   converter output is cuboids only. A throwaway build is fine. Report which works and how
   the presenter uses it.
3. Throwaway build drawing each object in samples/bsd_passby_dv16.mcap and in a CTA class-gate
   recording (start CARLA: C:\ws\sw\carla\CarlaUE4.exe -vulkan -windowed -ResX=800 -ResY=600
   -nosound, wait ~45 s; then from modules/df/tools/carla: py -3.12 carla_producer.py
   ../../tests/carla_scenarios/cta/cta_rx_class_gate_town05.yaml --camera, NOT --record;
   it writes .scratch_<id>.mcap there; copy it to samples/cta_class_gate.mcap)
   as its class model, scaled per axis into its own box (J-D2), heights from J-D3.
   Render two variants (J-D8): (a) models tinted in the class colour, (b) models in their
   own colours with a class-coloured footprint outline. Screenshot both from the chase view
   and from top down into docs/j0_tint.png, docs/j0_own.png.
4. Performance: play the CTA recording at 1x and report max frame gap and whether any model
   is recreated during playback (same check as 6f78f98). Report the .foxe size.
5. Write §9 "J-0 findings": the chosen set (source, licence, sizes, measured axes), the
   switch mechanism, the two screenshots, performance numbers, anything unsure.
End with a short summary and the two screenshot paths so the user can pick tint vs own.
```

### J-1 — Class models + fallback ladder

```
Read docs/plan.md, docs/plan_junction_demo.md (J-D1..J-D9, §9 J-0 findings and the user's
tint/own-colour choice recorded there). Work in modules/foxglove-viewer on
feature/foxglove-viewer. Do not push.

1. Add the chosen models to assets/ with one ASSETS.md row each (file, source URL, author,
   licence, retrieved date, sha256, changes). Generate the embedded TS modules the same way
   as the ego (scripts/gen_ego_model.py, generalise it; keep 100-char lines), decoded ONCE
   at load. Replace the ego model too if J-0 chose a new consistent set.
2. style.ts: per-class height constants (J-D3), per-model native size / axes / centre
   constants with the "from scripts/measure_glb.py" comment, the yaw fix per model.
3. src/convert/objects.ts: implement the fallback ladder J-D4 exactly: model / cuboid /
   sphere, per object, from classification + box validity only. Per-axis scale into the
   object's own length/width and the class height (same axis mapping as the ego, comment
   included), yaw = orientation, feet/wheels on ground. Keep the label and arrow as today.
   Add the J-D5 switch with the mechanism J-0 proved and the optional box outline. Class
   colour per J-D8 choice.
4. Tests: one per rung (model, cuboid for each model-less class including an unknown value,
   sphere); per-axis scale equals length/native, width/native, height/native in the mapped
   order; the same Uint8Array instance per class across two calls; cuboids-only switch draws
   zero models; heights per class. Plant-and-revert one wrong value.
5. Check in Foxglove with the CTA class-gate recording and bsd_passby_dv16.mcap: every class
   faces its direction of travel, stands on the ground, fits its box (outline on); playback
   smooth at 1x (max frame gap, no model recreated). Screenshots into docs/.
6. README: class table becomes "class | model | colour", plus the fallback rule in two plain
   sentences and how to use the switch. CHANGELOG 0.3.0, version 0.3.0.
7. Gate once with seconds: npm ci, lint, test, package. Commit
   "feat(viewer): 3D model per object class with cuboid fallback" ending with
   Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
End with: commit, tests, .foxe size, screenshot paths, anything unsure.
```

### J-2 — Confidence in the label

```
Read docs/plan_junction_demo.md J-D10. In modules/foxglove-viewer: label shows class
confidence only when attributes.class_confidence > 0, raw number until its unit is confirmed
(state in README "Known limits" that the unit is unconfirmed). Tests for 0 (absent from label)
and a filled value. CHANGELOG 0.3.1. Gate once with seconds, commit
"feat(viewer): class confidence in the object label" with the Sonnet co-author line.
```

### J-3 — Junction scene (df)

```
Read modules/foxglove-viewer/docs/plan_junction_demo.md §4 and J-D6/J-D7/J-D11, then
modules/df/tools/carla/README.md, carla_producer.py, route_traffic.py, actor_behaviour.py,
road_follower.py and lane_staging.py. Work in modules/df on a new branch
feature/junction-demo-scene from its current branch. Do not push.

1. SURVEY first, write findings into plan_junction_demo.md §9 "J-3 survey" before coding:
   how actors move today (kinematic teleport), whether any existing route kind follows a
   path through a junction, how lanes are emitted inside a junction, how sensor coverage is
   declared, and the options for walking pedestrians that stay reproducible (e.g. walker
   control or AI controller in synchronous mode with a fixed seed, vs teleport + animation).
   Pick one and say why.
2. Pick a four-way signalised junction with crosswalks (Town05 or Town10HD; check which has
   crosswalks and a good camera view). Record the choice and its coordinates as a location
   in the scenario data, like existing locations.
3. Add what is missing, smallest change first: a route kind that follows a polyline or a
   CARLA waypoint path (so turning vehicles and crosswalk pedestrians move correctly); a
   scenario `signals:` timeline that sets and freezes traffic-light states; walking
   pedestrians per the survey; flag --classes-unclassified (writes UNCLASSIFIED for every
   object, recorded in mcap metadata). Unit tests for every pure-geometry piece (no CARLA).
4. Write tests/carla_scenarios/demo/junction_signal_town<N>.yaml per §4 of the plan: ego stops
   on red, cross traffic (cars both ways, one truck, two motorcyclists, one cyclist, some
   turning), pedestrians on the crosswalk in front of ego, one late, one static at the kerb;
   then ego green and crosses with pedestrians on the side crosswalk. About 30 s, up to ~20
   objects. Prefer unbranded blueprints; never write brand names into docs or reports.
5. Produce both mcaps with CARLA (-vulkan -windowed, wait ~45 s; carla_producer.py ... --camera,
   NOT --record), once with true classes, once with --classes-unclassified. Check in the
   camera image: pedestrians walk, signals match the traffic, nothing floats or clips.
6. Run the df unit gate once (python -m pytest -q scripts/tests, plus
   python scripts/check_invariants.py from the superproject root), with seconds. Commit in df
   "feat(carla): signalised junction demo scene with walking pedestrians" ending with
   Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
End with: commit, mcap paths and sizes, object count range, screenshots of the camera at
3 moments, anything unsure.
```

### J-4 — Samples, BEV layout, demo script

```
Read docs/plan_junction_demo.md J-D11/J-D12. In modules/foxglove-viewer: copy the two J-3
mcaps into samples/ (gitignored) as junction_classes.mcap and junction_unclassified.mcap.
Extend layouts/demo_layout.json with a second 3D panel, top-down BEV (orthographic if it
renders correctly, else perspective from high above), both following ego, grid hidden,
next to the chase 3D panel and the camera. Import it in Foxglove, play both recordings,
screenshot each into docs/. README: a "Junction demo" section with a 2-minute presenter
script (what to point at, when to flip the cuboids-only switch, when to open the
unclassified recording). CHANGELOG, version bump. Gate once with seconds; commit with the
Sonnet co-author line.
```

### J-6 — Road context in the producer (df)

```
Read modules/foxglove-viewer/docs/plan_junction_demo.md J-D13..J-D18 and §9 (J-3 survey),
then modules/df/tools/carla/carla_producer.py (how objects are converted to the ego frame:
Pose, rear_axle_xy, to_ego_frame; how truth/actors registers its JSON schema) and
mcap_recorder.py. Work in modules/df on feature/junction-demo-scene. Do not push.

1. New pure module tools/carla/scene_context.py (no `carla` import, file header per
   R-STYLE-1): plain dataclasses for the items (kind, polyline or triangles, metres, map
   frame); triangulation of a lane-section strip (two edge polylines -> triangles); a
   closed polygon -> triangles for crosswalks (CARLA gives convex quads; refuse a
   non-convex one with a clear error rather than mis-triangulate); the map->ego
   FrameTransform from the ego pose, built FROM THE SAME conversion the producer uses for
   objects (J-D17), never re-derived; to_json() matching the JSON schema exactly.
   Unit tests in scripts/tests/: triangulation counts and winding, a quad -> 2 triangles,
   non-convex refused, transform round trip (a point placed at an object's world position
   lands at that object's dist_x/dist_y), schema validates every emitted message.
2. CARLA extraction (in the producer, behind a flag --map-context, default off): once per
   run, within a radius of the scene (a named constant, enough to cover the junction and
   its approaches): driving-lane surfaces and sidewalks from map waypoints (lane type,
   lane width, both edges), road edges (outer edges of the drivable area), crosswalks
   (map.get_crosswalks()), stop lines (traffic lights' stop waypoints, one short line
   across each lane), the junction area. Remember CARLA is left-handed (Y right): convert
   with the producer's existing helpers only.
3. Recording: register schema `scene_context.Map` (encoding jsonschema, a real schema, not
   `{}`), topic `map/context`, written at t0 and then once per second (same content); topic
   `map/frame`, schema foxglove.FrameTransform (the same encoding the camera image uses for
   its foxglove schema), one per tick, parent `ego`, child `map`. Record --map-context in
   the mcap metadata.
4. Regenerate both junction recordings with --map-context (CARLA -vulkan -windowed, wait
   ~45 s; carla_producer.py ... --camera --map-context, NOT --record; with and without
   --classes-unclassified). Report each topic's message count and the size added.
5. Alignment check WITHOUT the viewer: a small script (logs/, not committed) that reads one
   recording and, at t = 5, 10, 21 s, reports for every CAR/TRUCK whether its centre lies
   on a road-surface triangle, and for every PEDESTRIAN whether it lies on a sidewalk,
   crosswalk or road triangle, after applying map/frame. Expect all true; investigate any
   false before committing.
6. df unit gate once with seconds (python -m pytest -q scripts/tests; python
   scripts/check_invariants.py from the superproject root). Commit
   "feat(carla): road context topic (map surface, crosswalks, stop lines) for the demo"
   ending with Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
End with: commit, mcap paths and sizes, alignment-check result, anything unsure.
```

### J-7 — Road context in the viewer

```
Read docs/plan_junction_demo.md J-D13..J-D18 and the J-6 commit message. Work in
modules/foxglove-viewer on feature/foxglove-viewer. Do not push.

1. src/convert/map_context.ts: converter fromSchemaName `scene_context.Map` ->
   foxglove.SceneUpdate. One entity per kind, frame_id "map", frame_locked true,
   lifetime 0. triangles -> TriangleListPrimitive, polyline -> LinePrimitive. Style by
   kind only, colours and z offsets as named constants in style.ts (J-D18). Unknown kind:
   skip it and count it in the entity metadata, never guess a style. Register it in
   src/index.ts. No topic-name checks (plan.md D-3).
2. Tests: one per kind; unknown kind skipped; frame_id is "map"; z order is surface <
   sidewalk < crosswalk < stop line/edge < 0; a message with no items gives an empty
   entity, not an error. Plant-and-revert one wrong value.
3. Demo layout: map/context on in both 3D panels; nothing else changes. Check the
   3D panel's display frame stays `ego` (map/frame connects the two).
4. In Foxglove with both junction recordings (copied to samples/ from the J-6 run):
   BEV + chase screenshots at t = 5, 10, 21 s (docs/j7_*.png): cars on the road,
   pedestrians on crosswalks/sidewalks, the perception lane lines on the map's lanes,
   nothing flickering. Seek backwards and forwards: the map stays. Untick map/context:
   the view is exactly the 0.5.0 view. Playback numbers as in J-5 (max gap, gaps > 40 ms).
5. README: one line in the legend for each kind, and in the presenter script "the map is
   shown for orientation; it comes from the map, not from the radar". Known limits: real
   recordings have no map topic. CHANGELOG 0.6.0, version 0.6.0.
6. Gate once with seconds: npm ci, lint, test, package. Commit
   "feat(viewer): road context layer (surface, crosswalks, stop lines) under the objects"
   ending with Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
End with: commit, tests, .foxe size, screenshot paths, playback numbers, anything unsure.
```

## 8. Later (not now)

- **Custom model set, parked 2026-10-28:** a commissioned, company-owned set (car, SUV, truck,
  bus, pedestrian, motorcyclist, cyclist) in one style, replacing the CC0 models and the
  two-wheeler cuboids (`BOX_ONLY_CLASSES`). Code change is only the asset swap.
- Traffic-light state as part of the road context topic (J-D13), off for real sensor data (J-D7).
- Real object height, once `DfObj` carries it (replaces J-D3).
- Animated pedestrian models in the 3D view (needs a walk phase the data does not carry).

## 9. Findings

Filled in by J-0 and J-3.

### J-0 findings (2026-10-28, Foxglove 3.4.2)

**Verdict on J-D9.** No single CC0 set covers all six models at the "realistic enough for a customer
demo" bar. What exists is a consistent **low-poly, flat-shaded** family (Quaternius) with cars and a
truck, plus single models from other authors. A motorcyclist is **a motorcycle with a pedestrian on
top** (user, 2026-10-28), so it is built from two models: the only CC0 motorcycle is a cartoon, and
**there is no CC0 bicycle at all**. The spike drew BICYCLE as the J-D4 fallback (cuboid). The rider
composition was tried once (below, `docs/j0_rider.png`). The user decides whether to accept low-poly
plus fallback (J-1 as planned) or to buy a pack (below).

**Sources.** Kenney, Poly Pizza (CC0 entries) and Quaternius were searched; kenney.nl, itch.io,
OpenGameArt and quaternius.com refuse automated downloads (HTTP 403) from this machine, so models came
from poly.pizza (CC0 shown on each model page) and the earlier GitHub mirror of Kenney's Car Kit.
Downloaded to `logs/j0_assets/` (gitignored), nothing run from it.

| Class | Model (poly.pizza id) | Author | Licence | Size | Tris | sha256 (first 12) |
|---|---|---|---|---|---|---|
| CAR | Car (`unqqkULtRU`) | Quaternius | CC0 1.0 | 174,320 B | 2,274 | `e5f5fa41c441` |
| ego | SUV (`xsMtZhBkxL`) | Quaternius | CC0 1.0 | 181,608 B | 2,444 | `1a9ce2bba813` |
| TRUCK | Truck (`cXw6oiFtZ8`) | Quaternius | CC0 1.0 | 326,828 B | 5,546 | `a5d107b5b06f` |
| PEDESTRIAN | Mannequin (`tYwjQJvcFX`) | reyshapes | CC0 1.0 | 14,808 B | not read | `7d053b5b2625` |
| MOTORCYCLE (stand-in, no rider, cartoon style) | Cartoony Purple Motorcycle (`j20srJUjpB`) | AliceCassie | CC0 1.0 | 91,144 B | 1,500 | `86219f3bd3c1` |
| BICYCLE | none found | | | | | |

Other CC0 candidates seen and **not used**: Quaternius Pickup Truck (`qn4grQgHm8`, 273 KB), Police Car,
Sports Car, Quaternius and Polygonal Mind characters (see the skin finding), iPoly3D Fitness Character
(`eMOTyGEAxj`, static, 200 KB, not rendered). Every URL is `https://poly.pizza/m/<id>`; the file is at
the `static.poly.pizza/*.glb` link on that page. All six used files together are 0.79 MB.

**Measured native size and axes** (`logs/j0_assets/measure_any.py`; X = width, Y = up, Z = length;
glTF is +Y up). Front is +Z for CAR, SUV and TRUCK (checked from above: windscreen and hood, and the
truck's cab, are on the +Z side). Motorcycle and mannequin front **not verified** (cartoon and
symmetric shapes).

| Model | W (X) | H (Y) | L (Z) | min up | centre along Z |
|---|---|---|---|---|---|
| Car | 1.64 | 1.15 | 3.31 | -0.03 | +0.005 |
| SUV (ego) | 2.11 | 1.53 | 4.21 | -0.02 | 0 |
| Truck | 2.71 | 2.88 | 5.26 | 0 | -0.435 |
| Mannequin | 2.51 | 9.01 | 1.81 | 0 | 0 |
| Motorcycle | 0.21 | 0.49 | 1.04 | -0.01 | +0.075 |

`scripts/measure_glb.py` refuses nodes with rotation or scale, which four of the models have. J-1 must
generalise it (the throwaway `logs/j0_assets/measure_any.py` composes the full node tree).

**Rigged characters do not work in Foxglove's `ModelPrimitive`. Use static (unskinned) meshes only.**
A skinned glb (anything with a `skins` entry, which is every Quaternius character, also "Woman") was
drawn lying down at the frame origin, ignoring pose and scale; its white outline went to the right
place but the textured body did not. Cause (read from the app's model code): it clones the cached
model, and a cloned skinned mesh keeps pointing at the original skeleton. Check `skins` is empty before
accepting a model. Static people exist (Mannequin, iPoly3D Fitness Character, two Polygonal Mind women
and men; those two are in T-pose, arms along Z, and cannot be squeezed into a 0.4 m box).

**Placement that works** (confirmed from above and side, same mapping as the ego car): scale
`(x: width/W, y: length/L, z: height/H)`; yaw `orientation + pi/2`; position = box centre minus
`centreAlongZ * scaleY` along the heading; z = `-minUp * scaleZ`. A model sits inside its reported box:
the outline (below) matches it on every class. Foxglove draws a thin white edge outline on every model
by default; the 3D topic setting "Show outlines" turns it off, and it is noisy on a dark background.

**Switch mechanism (J-D5): topic alias works, per-entity visibility does not exist.**
1. Per-entity visibility: in Foxglove 3.4.2 the 3D panel's topic settings for a SceneUpdate topic hold
   only Color, Show outlines, Selection variable and Vertex normals. There is no per-entity or
   per-namespace toggle. Not usable.
2. Topic alias: `registerTopicAliases` returns `objects_tint` and `objects_boxes` with source topic
   `objects`; the one schema converter reads `event.topic` and branches (`objects` normal,
   `objects_boxes` cuboids only, `objects_tint` tinted). Both aliases appear in the 3D panel's topic
   list with their own visibility checkbox, and each draws the right output
   (`docs/j0_switch_boxes.png` is `objects_boxes`). **Presenter use:** open the 3D panel settings,
   untick the `objects` topic and tick `objects_boxes` to show "as the sensor reports it", and swap
   back to return. The demo layout ships with `objects` on and the two aliases off. The alias is only
   registered when the recording has an `objects` topic of schema `adas.perception.DfObjList`.

**Tint or own colours (J-D8), for the user to pick** from `docs/j0_tint.png` and `docs/j0_own.png`
(left: chase view, right: top view; synthetic showcase, one object per class, see "Recordings"):
- (a) Tint (`override_color`, class colour, alpha 0.9): class identity is instant at any distance, but
  the model flattens to one colour with only its edge lines visible; looks like wireframe plastic.
- (b) Own colours plus a class-coloured footprint outline on the ground: cars and the truck read as real
  vehicles and the footprint shows the box the model was fitted into; class identity comes from the
  outline and the label, and the grey mannequin is the weakest read.
- Recommendation: (b) as the default, with "Show outlines" off. J-1 keeps (a) behind one named constant.

**Recordings.** `samples/cta_class_gate.mcap` produced as specified (521 ticks, 26 s, 26.9 MB, classes
MOTORCYCLE, BICYCLE and PEDESTRIAN only, boxes 2.19 x 0.87, 1.66 x 0.58 and 0.38 x 0.38 m; no CAR or
TRUCK in it). No recording in the repo contains a TRUCK, and none contains every class, so the
screenshots use a **synthetic** `logs/j0_showcase.mcap` (the bsd camera and lanes with the object list
replaced by one object per class, plus an UNCLASSIFIED one). It is for judging models only and is not a
sample; `logs/j0_make_showcase.py` and `logs/j0_make_truck.py` rebuild it.

**Performance** (1x playback, `logs/j0_build`, 5 models embedded): showcase, 9 models on screen, 20 s:
longest animation-frame gap 17 ms, none above 40 ms, no model recreated (0 blob URLs created during
playback). CTA class gate, 26 s: longest gap 17 ms, none above 40 ms, 3 blob URLs in total, one per
distinct model (ego, motorcycle, pedestrian) when each first appears, none per frame. Same `Uint8Array`
per model, decoded once. **`.foxe` size: 819,310 B** with five models (0.2.1 is 195,372 B).

**Paid packs, if the CC0 route is rejected** (not used, licences not confirmed beyond the listings):
- ithappy "Low Poly City and Vehicles" (ithappystudios.com, one-time purchase licence agreement:
  royalty-free in a product, reselling the assets as standalone items not allowed); glTF and FBX; no
  motorcycle, cyclist or pedestrian confirmed.
- Synty POLYGON packs (syntystore.com one-time purchase EULA, text not retrieved); stylised, wide
  coverage of people and vehicles.
Both need a written answer on whether embedding the model bytes inside a distributed `.foxe` counts as
redistributing the asset, which most such licences forbid in extractable form.

**Rider on a motorcycle (tried once).** MOTORCYCLE draws two `ModelPrimitive`s: the motorcycle fitted
into the box, and the mannequin (pedestrian model) scaled to the bike's height minus 0.15 m, standing at
the box centre at z = 0.15 m. It works technically (both models are cached once, playback unchanged) but
looks poor: the cartoon bike body hides most of the standing mannequin, leaving a head and shoulders
above the seat (`docs/j0_rider.png`). J-1 needs a rider scale and seat height tuned per bike model, or a
bike whose body is not solid; a BICYCLE rider would have the same issue plus the missing bicycle.

**Unsure.** Motorcycle and mannequin forward axis; the mannequin footprint of
0.38 m is only about 12 px at the top-view zoom used here; Foxglove auto-updated to 3.4.2 during the
spike, so the app is now 3.4.2 (the earlier steps ran on the previous version). Foxglove was restarted
with the debug port, so a normal launch has none.

### J-3 survey (2026-10-28, CARLA 0.9.16, Town05)

Facts read from the code and measured on the running server; the choices are the last list.

**How actors move today.** In both schema-3 producers every road user is teleported: `set_simulate_physics(False)`
and `set_transform` once per tick (synchronous mode, 0.05 s). The recorded position is the scripted one, not read
back. A pedestrian is moved the same way, so it slides (§2). Three kinds place road users: `Actor` (a straight line
from a location's reference pose; `lane_through_junction` is the straight chord from a crossing's entry to its exit),
`route_traffic.RouteActor` (a lane offset and a distance relative to the ego's own lane route) and, in a lane-route
scenario, nothing else.

**Route kinds through a junction.** None follows a path of its own. The ego's lane route (`lane_geometry.build_route`)
walks `next()` and takes the candidate that keeps the heading, so it goes straight through a junction. A `RouteActor`
exists only relative to that route, so it cannot cross it or turn off it. `lane_through_junction` is a straight chord:
no curve, no turn. The map does give the connection lanes (`Junction.get_waypoints`): at Town05 junction 1427 there
are 16 (8 straight, 4 left, 4 right), and walking `previous()`/`next()` further than about 55 m crosses the
neighbouring junction (90 m away) and, at its connection lanes, can leave the road's own line.

**Lanes inside a junction.** Measured on the ego's route through junction 1427 (`ego_lines` at 6 m steps). Before and
after it four lines are reported (painted). Inside it the route's lane table holds the connection lane and one
neighbour (the map gives no lane on the left there), and the producer still reports three lines: a `ROAD_EDGE` on the
left of the lane, the lane's right boundary as `PAINTED_MARKING`, and a `ROAD_EDGE` beyond the neighbour. A junction has
no painted lanes, so those are curves of the map's connection geometry, not of anything on the road.

**Sensor coverage.** A scenario names a preset in `sim/sensor_models/` (`ground_truth_ideal`). That file declares
`object_range_m: 100` and `num_object_slots: 50`, but only the legacy bridge reads them; the schema-3 producers read
neither, and the lane-route producer lists every road user at any distance. The one declared filter is
`raycast_occlusion` (the staged producer only, from the two rear corner poses; its own comment says no front pose
exists, Q22). No project file calibrates a front sensor, so there is nothing to reference.

**Walking pedestrians, measured** (three walkers on one crosswalk, synchronous 20 Hz, 1.4 m/s):

| Option | Result |
|---|---|
| Teleport, physics off (today) | Slides, no walk cycle (§2). |
| Walker controller alone (`WalkerControl(direction, speed)`) | Walks, legs animate. The server moves it exactly `speed * dt` (0.07 m) per tick; its position is the physics' own, so it needs feedback to stay on a path and differs from run to run by the spawn settle (about 0.06 m measured). |
| Controller `speed` plus `set_transform` each tick | Walks, legs animate in the camera image. Position is whatever the script sets. Putting the walker `speed * dt` behind its scripted point first makes the controller's step end exactly on it. |
| AI controller (`go_to_location`, navigation mesh) | Not tried: its route and speed are the navigation system's (seeded), not a scripted path, and a crosswalk crossing could not be timed against a light. |

The walker's origin is its body centre: `get_location().z` read 0.95 m on level ground, so a teleport to ground level
buries it (the first try, z = 0, drew nothing).

**Decisions.**
- Walkers: the third row. The recorded and drawn positions are a pure function of time (reproducible, no physics in the
  result) and the legs animate from the controller's speed.
- Paths: a new route kind, `route: {kind: path}`, a polyline in world metres (lane connections and crosswalks written
  by a probe from the map into the location's `paths:`), used by turning and cross traffic and by pedestrians.
- Signals: a scenario `signals:` timeline per signal head of the location, every head listed, set and frozen by the
  producer.
- Lanes: `ego.lines_end_at_junction` ends the lines where the route enters a junction and sends nothing inside, rather
  than the connection geometry.
- Coverage: a `coverage:` sector (front, 130 degrees, 80 m, marked assumed like the front poses) in a new preset,
  `front_coverage_assumed`; an object outside it is not in the list. Other presets have none and list everything.
- Place: Town05 junction 1427 (four lights, four crosswalks, 78 m of straight road each side), over Town10HD whose
  four-light junction has crosswalks on two arms.
