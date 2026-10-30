# ANOMALY SIX: an impossible cabinet

A mobile-first experimental web app for the **MERGE Cube**. Six procedural, animated 3D exhibits become attached to six learned visual patterns on the cube. No account, no uploads, and no proprietary MERGE tracking SDK.

## Run

The app is a single `index.html` file. **Host it on HTTPS**, such as GitHub Pages. It uses browser camera access, which will not work reliably when opened directly as a `file://` URL. `http://localhost` also works for desktop testing.

The AR implementation uses [MindAR 1.2.5](https://hiukim.github.io/mind-ar-js-doc/) (MIT license) and [Three.js 0.147.0](https://threejs.org/) (MIT license), loaded from public CDNs, plus Google Fonts. An internet connection is required for those assets at initial load.

## Use

1. Open on a phone over HTTPS, tap **LEARN CUBE**, then **OPEN CAMERA**.
2. Put one face of a physical MERGE Cube squarely within the orange outline, front-on and in even lighting. Tap **CAPTURE FACE 1**.
3. Turn to a different face and repeat, ideally for all six. Avoid including hands, backgrounds, or adjacent cube faces in the orange square.
4. Tap **MAKE IT REAL**. The browser compiles image-recognition features on the device and saves them locally using IndexedDB. It may take some time on older phones.
5. In Cube Camera, point the device at a face you taught it. When tracking recognizes it, a unique 3D curiosity appears. Turning to another learned face changes the curiosity.
6. **DISTURB** provokes a reaction; **IMPROBABILITY** affects animation; **SOUND** enables optional synthesizer notes. Preview mode works without the cube or camera.

You can also import 1–6 front-on face photographs, or a `targets.mind` file produced by the public MindAR target compiler. Imported targets are interpreted in file order.

## Important technical limits

- This is **experimental per-face image tracking**, not MERGE's six-sided proprietary tracking. Faces are tracked individually and do not maintain a shared 6-DoF cube pose across fast rotations or occlusion. Expect brief loss of the augmentation while turning the cube.
- The calibration camera captures a centered square. For best results, position a single face in the guide, approximately filling it. The square is an approximate guide (the precise cropping can differ by camera aspect ratio).
- The mobile browser may evict locally saved calibration under storage pressure or in private browsing. Retake photos if that occurs.
- WebGL and a modern Safari or Chromium browser are required. Camera access needs HTTPS (or localhost).
- The app does not reproduce or distribute MERGE's proprietary face artwork. Capture the cube you already have for personal tracking.
- The six displays are procedural geometry, not externally downloaded models.

## Files

- `index.html`: entire application, visual design, cube learning, AR, WebGL rendering, sound, persistence.
- `README.md`: instructions and limitations.

The app is independent and unofficial. MERGE Cube is a product of MERGE Labs, Inc.