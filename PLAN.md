# Set Card Game Camera Solver — Phased Build

Build this project in **5 phases**, committing after each one works. Each phase builds on the last. Use HTML + vanilla JS + CSS in a single `index.html` unless a phase explicitly says to add files. The app must work on mobile (phone camera pointed at table).

---

## Rules of Set (reference for all phases)

Each card has 4 attributes, each with 3 possible values:

| Attribute | Values                        |
|-----------|-------------------------------|
| Number    | 1, 2, 3                       |
| Color     | Red, Green, Purple            |
| Shape     | Diamond, Squiggle, Oval       |
| Shading   | Solid, Striped, Empty         |

Three cards form a **valid Set** if, for **each** of the 4 attributes, the three cards are either **all the same** or **all different**.

Validation shortcut: `(a + b + c) % 3 === 0` for each attribute (encoding values as 0, 1, 2).

---

## Phase 1 — Set Logic Engine + Manual Input UI

**Goal:** Get the core Set math working with a simple manual card picker. No camera yet.

### What to build
- A card data model: `{ number: 0|1|2, color: 0|1|2, shape: 0|1|2, shading: 0|1|2 }`
- `isValidSet(c1, c2, c3)` — returns `true`/`false` using the mod-3 trick
- `findAllSets(cards[])` — brute-force O(n³) over all triples
- A simple UI where the user can **manually add cards** via 4 dropdown menus (number, color, shape, shading) + "Add card" button
- Display added cards as **rendered SVG cards** (not just text) in a grid
- A "Check for Sets" button that highlights all valid sets found among the added cards
- When a set is found, show **which attributes** make it valid (all same vs all different per attribute)

### SVG card rendering
Each card is a white rounded rectangle with 1–3 shapes stacked vertically:
- **Diamond**: rhombus `<polygon>`
- **Oval**: `<ellipse>` or rounded `<rect>`
- **Squiggle**: `<path>` with cubic beziers forming an S-blob
- **Colors**: Red `#E8453C`, Green `#2EA043`, Purple `#7B61FF`
- **Shading**:
  - Solid = shape filled with color
  - Striped = outline + horizontal line `<pattern>` fill (lines in the shape's color, ~3px spacing)
  - Empty = outline only, no fill

### Testing checklist
- Add 3 cards that form a valid set → correctly detected
- Add 3 cards that don't → correctly rejected
- Add 12 cards → finds multiple sets
- SVG renders all 81 possible card types correctly

---

## Phase 1.5 — GitHub CI/CD Pipeline + GitHub Pages

**Goal:** Set up continuous integration and deploy the app to GitHub Pages.

### What to build

#### GitHub Actions CI Pipeline
- Create `.github/workflows/ci.yml` with:
  - **Trigger:** On push to `main` and on pull requests
  - **Test job:** Run the project's test suite (unit tests for Set logic engine)
  - **Lint job (optional):** Run any configured linters
  - **Build job:** Ensure the project builds/bundles correctly
- Use Node.js environment for running tests
- Cache dependencies for faster CI runs

#### GitHub Pages Deployment
- Create `.github/workflows/deploy.yml` (or add to ci.yml) with:
  - **Trigger:** On push to `main` only
  - **Build step:** Prepare static files for deployment
  - **Deploy step:** Use `actions/deploy-pages` to publish to GitHub Pages
- Configure the repository for GitHub Pages deployment from Actions
- Ensure the `index.html` is at the root of the deployed site

#### Test Infrastructure
- Set up a test runner (e.g., a simple Node.js-based test harness, or a lightweight framework like Vitest)
- Ensure all Phase 1 unit tests can run in CI (headless, no browser required for logic tests)
- Add a `package.json` with `test` script
- Add test coverage reporting (optional but recommended)

### Testing checklist
- Push to main → CI pipeline runs automatically
- Tests pass in CI environment
- GitHub Pages site is accessible and shows the app
- Pull requests show CI status checks

---

## Phase 2 — Camera Feed + Card Localization

**Goal:** Access the phone camera and detect where cards are on the table. Don't classify them yet — just find the card rectangles.

### What to build
- Load **OpenCV.js** from CDN: `https://docs.opencv.org/4.10.0/opencv.js`
- Access the rear camera via `getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })`
- Display the live camera feed in a `<video>` element, mirror to a `<canvas>` for processing
- **Card detection pipeline:**
  1. Convert frame to grayscale (`cv.cvtColor`, `COLOR_RGBA2GRAY`)
  2. Gaussian blur (`cv.GaussianBlur`, 5×5 kernel)
  3. Adaptive threshold or Otsu's (`cv.threshold`, `THRESH_OTSU`)
  4. Find contours (`cv.findContours`, `RETR_TREE`)
  5. Approximate each contour to a polygon (`cv.approxPolyDP`)
  6. Keep only quadrilaterals (4 vertices) with area > minimum threshold
  7. Sort by area, keep the largest N (expect 12–15 cards)
- **Perspective correction:** For each detected quad, use `cv.getPerspectiveTransform` + `cv.warpPerspective` to extract a flat, axis-aligned card image (standardize to ~200×130 px)
- Draw green bounding boxes on the detected cards in an overlay canvas
- Show a counter: "Cards detected: N"
- Add a **"Freeze"** button that pauses the camera feed and locks the current detected cards for the next phase

### Performance
- Process every 3rd frame (not every frame — cards don't move)
- Run OpenCV processing in `requestAnimationFrame` loop but throttled
- Show FPS counter in debug mode

### Testing checklist
- Point at 12 Set cards on a table → detects 12 rectangles
- Cards at slight angles → still detected via perspective correction
- Partially overlapping cards → gracefully handles (detects what it can)
- Works on both iPhone and Android

---

## Phase 3 — Card Attribute Classification

**Goal:** Given the extracted card images from Phase 2, classify each card's 4 attributes.

### What to build

#### Number detection (easiest)
- Within each warped card image, convert to grayscale, threshold, find internal contours
- Filter contours by minimum area (>5% of card area) to exclude noise
- Count remaining contours → 1, 2, or 3

#### Color detection (hardest — invest the most effort here)
- Sample pixels from inside the shape contours (not the background)
- **Dual approach for robustness:**
  - **HSV method:** Convert to HSV. Red = H in [0,10] or [160,180]. Green = H in [35,85]. Purple = H in [100,160].
  - **RGB ratio method (fallback):** Red: R > 1.5×G and R > 1.5×B. Green: G > 1.3×R and G > 1.3×B. Purple: R > 0.7×B and B > 1.3×G.
- Use majority voting across many sampled pixels
- **Calibration mode (important):** On first launch, show a prompt: "Point camera at a RED card, then tap." Repeat for green and purple. Store the actual HSV ranges for the user's lighting conditions. Fall back to defaults if user skips calibration.

#### Shape detection
- Extract the largest interior contour
- Compare using `cv.matchShapes()` with Hu moments against 3 reference shapes
- **Alternative/fallback:** Compute the ratio of contour area to bounding rectangle area:
  - Diamond ≈ 0.5 (pointy, lots of empty space in bbox)
  - Oval ≈ 0.75–0.80 (round, fills most of bbox)
  - Squiggle ≈ 0.60–0.70 (irregular, middle ground)
- Use whichever method gives higher confidence; if both disagree, flag as uncertain

#### Shading detection
- Within the shape contour, compute the ratio of colored pixels to total pixels:
  - Solid: > 70% filled
  - Striped: 30%–70% filled
  - Empty: < 30% filled
- **Alternative for striped:** Look for regular horizontal frequency patterns using a 1D projection histogram (count pixels per row inside the contour — striped cards show a periodic wave pattern, solid shows a flat high line, empty shows a flat low line)

### UI updates
- Below the camera feed, show a row of **classified card thumbnails** — each showing the warped card image + the detected attributes as text labels (e.g., "2 Red Striped Diamond")
- Color-code confidence: green border = high confidence, yellow = uncertain, red = failed
- Allow the user to **tap a classified card to manually correct** any attribute (dropdown override) — this feeds back into the Set solver and also helps you collect ground-truth for debugging

### Testing checklist
- Point at 12 cards → all 4 attributes correctly classified for each
- Test under different lighting (daylight, warm indoor, fluorescent)
- Test with cards at various orientations
- Red vs purple distinction works reliably

---

## Phase 4 — Set Solving with Camera Results

**Goal:** Connect Phase 3's classified cards to Phase 1's Set engine. Show results overlaid on the camera feed.

### What to build
- After freezing the frame and classifying all cards, automatically run `findAllSets()` on the classified cards
- **Overlay mode:** Draw on the camera canvas:
  - Outline each detected card with a thin white border
  - Label each card with a small number (1, 2, 3... N)
  - When showing a valid Set, highlight the 3 cards with thick colored borders (e.g., bright yellow) and draw lines connecting them
- **Set browser:** Show "Set 1 of N" with left/right arrows to cycle through found Sets
- For each displayed Set, show the 3 cards rendered as SVGs (from Phase 1) side by side below the camera view, with annotations showing why it's valid (e.g., "Color: all different ✓, Shape: all same ✓, ...")
- **Quick check mode:** Instead of auto-finding all Sets, let the user tap exactly 3 cards on the camera view and check if those 3 form a Set (using the Phase 2 card positions for tap-to-card hit detection)
- Handle edge case: if < 3 cards detected, show a message. If no Sets exist among detected cards, say so and suggest adding 3 more cards to the table.

### Testing checklist
- Full flow: point camera → freeze → classify → find Sets → display results
- Tap 3 cards that form a Set → confirmed
- Tap 3 cards that don't → shows which attribute fails
- Works with 12 and 15 card layouts

---

## Phase 5 — Polish, UX, and Real-Time Mode

**Goal:** Make it feel like a finished app, not a prototype.

### UX improvements
- **Real-time mode (stretch goal):** Instead of freeze-then-analyze, continuously detect and classify cards, and show Set count updating live. Only attempt this if Phase 2–3 runs at >10 FPS total.
- **Smooth transitions:** When switching between camera and results view, animate the card thumbnails sliding into place
- **Sound/haptic feedback:** Short vibration on Set found (`navigator.vibrate(100)`)
- **Dark mode** for the UI chrome (camera feed is always full brightness)
- **Score tracking:** Keep a running tally of Sets found this session
- **Share:** "Found 6 Sets!" screenshot/share button

### Robustness
- Retry classification on uncertain cards (re-sample pixels from slightly different positions)
- If a card can't be classified, show it as "?" and exclude from Set solving but let user manually classify it
- Handle camera permission denied gracefully
- Handle OpenCV.js load failure (slow network) with a loading spinner and retry
- Responsive layout: portrait mode on phone, landscape works too

### Performance
- Measure and display: frame capture time, OpenCV processing time, classification time, total pipeline time
- Target: < 500ms total from freeze to showing results
- Lazy-load OpenCV.js (it's 5+ MB) — show the manual card input UI (Phase 1) immediately while OpenCV loads in background

### Files
If the single `index.html` is getting unwieldy (>1500 lines), split into:
- `index.html` — layout + UI
- `set-engine.js` — card model, validation, Set finding
- `camera.js` — getUserMedia, OpenCV pipeline, card detection
- `classifier.js` — attribute classification logic
- `ui.js` — rendering, overlays, interactions
- `style.css` — all styles

---

## Technical Reference

### OpenCV.js CDN
```html
<script async src="https://docs.opencv.org/4.10.0/opencv.js" onload="onOpenCvReady()" type="text/javascript"></script>
```

### Camera access
```js
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
});
video.srcObject = stream;
```

### Key OpenCV operations
```js
// Grayscale
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

// Blur + threshold
cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

// Find contours
let contours = new cv.MatVector();
let hierarchy = new cv.Mat();
cv.findContours(thresh, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

// Perspective transform
let srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [x1,y1, x2,y2, x3,y3, x4,y4]);
let dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0,0, 200,0, 200,130, 0,130]);
let M = cv.getPerspectiveTransform(srcPts, dstPts);
cv.warpPerspective(src, dst, M, new cv.Size(200, 130));

// HSV color detection
cv.cvtColor(card, hsv, cv.COLOR_RGB2HSV);
let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [35, 50, 50, 0]);
let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [85, 255, 255, 0]);
cv.inRange(hsv, low, high, mask); // mask for green

// Shape matching
let similarity = cv.matchShapes(contour1, contour2, cv.CONTOURS_MATCH_I1, 0);
// lower = more similar, < 0.1 is usually a match
```

### Memory management (critical with OpenCV.js!)
```js
// ALWAYS delete Mats when done — OpenCV.js uses C++ memory via WASM
gray.delete(); blurred.delete(); thresh.delete();
contours.delete(); hierarchy.delete();
// Forgetting this WILL cause memory leaks and crashes
```
