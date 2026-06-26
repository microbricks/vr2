// ===============================
// PANELS
// ===============================
const panels = {
  browser: document.querySelector("#panel-browser"),
  notes: document.querySelector("#panel-notes"),
  settings: document.querySelector("#panel-settings"),
};

const panelText = {
  browser: document.querySelector("#panel-browser-text"),
  notes: document.querySelector("#panel-notes-text"),
  settings: document.querySelector("#panel-settings-text"),
};

function showPanel(name) {
  Object.values(panels).forEach(p => p.setAttribute("visible", "false"));
  Object.values(panelText).forEach(t => t.setAttribute("visible", "false"));

  if (panels[name]) panels[name].setAttribute("visible", "true");
  if (panelText[name]) panelText[name].setAttribute("visible", "true");
}

// ===============================
// TILES
// ===============================
const tileBrowser = document.querySelector("#tile-browser");
const tileNotes = document.querySelector("#tile-notes");
const tileSettings = document.querySelector("#tile-settings");
const tileAR = document.querySelector("#tile-ar");

tileBrowser.addEventListener("click", () => showPanel("browser"));
tileNotes.addEventListener("click", () => showPanel("notes"));
tileSettings.addEventListener("click", () => showPanel("settings"));

// ===============================
// AR BACKGROUND
// ===============================
const bgVideo = document.querySelector("#bgVideo");
let arActive = false;
let camStream = null;

tileAR.addEventListener("click", async () => {
  if (!arActive) {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      bgVideo.srcObject = camStream;
      bgVideo.style.display = "block";

      const scene = document.querySelector("a-scene");
      scene.renderer.setClearColor(0x000000, 0);
      document.querySelector("#sky").setAttribute("visible", "false");

      arActive = true;
      tileAR.setAttribute("color", "#1f7b4b");
      tileAR.setAttribute("text", "value: AR Background (aan); align: center; color: #FFFFFF; width: 3;");
    } catch (err) {
      console.error("Camera fout:", err);
    }
  } else {
    if (camStream) {
      camStream.getTracks().forEach(t => t.stop());
      camStream = null;
    }
    bgVideo.style.display = "none";

    const scene = document.querySelector("a-scene");
    scene.renderer.setClearColor(0x1a1f2b, 1);
    document.querySelector("#sky").setAttribute("visible", "true");

    arActive = false;
    tileAR.setAttribute("color", "#264b7b");
    tileAR.setAttribute("text", "value: AR Background; align: center; color: #FFFFFF; width: 3;");
  }
});

// ===============================
// LOCOMOTION (KEYBOARD + JOY-CON)
// ===============================
const rig = document.querySelector("#cameraRig");

let leftJoycon = null;
let rightJoycon = null;

window.addEventListener("gamepadconnected", () => {
  const pads = navigator.getGamepads();
  for (const gp of pads) {
    if (!gp) continue;

    if (gp.id.includes("Joy-Con (L)")) {
      leftJoycon = gp.index;
      console.log("Left Joy-Con connected:", gp.index);
    }

    if (gp.id.includes("Joy-Con (R)")) {
      rightJoycon = gp.index;
      console.log("Right Joy-Con connected:", gp.index);
    }
  }
});

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

let velocityY = 0;
let grounded = true;
const gravity = -0.01;

const armSwingForce = 0.06;
const keyboardForce = 0.08;
const jumpForce = 0.18;
const climbForce = 0.10;

let prevLeftY = 0;
let prevRightY = 0;

function moveForward(speed) {
  const dir = new THREE.Vector3(0, 0, -1);
  rig.object3D.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  dir.multiplyScalar(speed);
  rig.object3D.position.add(dir);
}

function moveBackward(speed) {
  const dir = new THREE.Vector3(0, 0, 1);
  rig.object3D.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  dir.multiplyScalar(speed);
  rig.object3D.position.add(dir);
}

function moveLeft(speed) {
  const dir = new THREE.Vector3(-1, 0, 0);
  rig.object3D.position.addScaledVector(dir, speed);
}

function moveRight(speed) {
  const dir = new THREE.Vector3(1, 0, 0);
  rig.object3D.position.addScaledVector(dir, speed);
}

function joyconMovement(pads) {
  // LEFT JOY-CON (arm swing)
  if (leftJoycon !== null) {
    const gp = pads[leftJoycon];
    if (gp) {
      const ly = gp.axes[1];
      const swing = prevLeftY - ly;

      if (swing > 0.25) moveForward(armSwingForce);

      prevLeftY = ly;
    }
  }

  // RIGHT JOY-CON (arm swing + buttons + ray)
  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp) {
      const ry = gp.axes[1];
      const swing = prevRightY - ry;

      if (swing > 0.25) moveForward(armSwingForce);

      prevRightY = ry;

      // A = Jump
      if (gp.buttons[0].pressed && grounded) {
        velocityY = jumpForce;
        grounded = false;
      }

      // B = Tag + ray-click
      if (gp.buttons[1].pressed) {
        rig.object3D.position.y += 0.1;
        setTimeout(() => rig.object3D.position.y -= 0.1, 150);
        joyconRayClick();
      }

      // X = Climb
      if (gp.buttons[2].pressed) {
        rig.object3D.position.y += climbForce;
      }

      // update pointer ray
      updateJoyconRay();
    }
  }
}

function locomotionLoop() {
  const pads = navigator.getGamepads();

  // Joy-Con locomotion
  joyconMovement(pads);

  // Keyboard locomotion
  if (keys["w"]) moveForward(keyboardForce);
  if (keys["s"]) moveBackward(keyboardForce);
  if (keys["a"]) moveLeft(keyboardForce);
  if (keys["d"]) moveRight(keyboardForce);

  // Keyboard jump
  if (keys[" "] && grounded) {
    velocityY = jumpForce;
    grounded = false;
  }

  // Keyboard climb
  if (keys["Shift"]) {
    rig.object3D.position.y += climbForce;
  }

  // Gravity
  if (!grounded) {
    velocityY += gravity;
    rig.object3D.position.y += velocityY;

    if (rig.object3D.position.y <= 1.6) {
      rig.object3D.position.y = 1.6;
      velocityY = 0;
      grounded = true;
    }
  }

  requestAnimationFrame(locomotionLoop);
}

locomotionLoop();

// ===============================
// GAZE TIMER + GAZE CLICK
// ===============================
const gazeCircle = document.querySelector("#gazeCircle");
let gazeTarget = null;
let gazeStart = 0;
const gazeDelay = 1000; // 1 seconde

function gazeLoop() {
  const cameraEl = document.querySelector("[camera]");
  if (!cameraEl) {
    requestAnimationFrame(gazeLoop);
    return;
  }

  const camera = cameraEl.object3D;
  const raycaster = new THREE.Raycaster();
  const dir = new THREE.Vector3(0, 0, -1);
  camera.getWorldDirection(dir);
  raycaster.set(camera.position, dir);

  const clickableEls = Array.from(document.querySelectorAll(".clickable"));
  const clickableObjs = clickableEls.map(el => el.object3D);

  const hits = raycaster.intersectObjects(clickableObjs, true);

  if (hits.length > 0) {
    const hitObj = hits[0].object;
    let targetEl = hitObj.el;

    clickableEls.forEach(el => {
      el.setAttribute("color", el.id === "tile-ar" ? "#264b7b" : "#303545");
    });
    targetEl.setAttribute("color", "#4a8cff");

    if (gazeTarget !== targetEl) {
      gazeTarget = targetEl;
      gazeStart = performance.now();
      gazeCircle.style.display = "block";
    }

    const progress = (performance.now() - gazeStart) / gazeDelay;
    const angle = Math.min(progress * 360, 360);

    gazeCircle.style.background = `
      conic-gradient(
        rgba(74,140,255,1) ${angle}deg,
        rgba(255,255,255,0) ${angle}deg
      )
    `;

    if (progress >= 1) {
      targetEl.emit("click");
      gazeStart = performance.now() + 999999;
      gazeCircle.style.display = "none";
    }

  } else {
    clickableEls.forEach(el => {
      el.setAttribute("color", el.id === "tile-ar" ? "#264b7b" : "#303545");
    });
    gazeTarget = null;
    gazeCircle.style.display = "none";
  }

  requestAnimationFrame(gazeLoop);
}

gazeLoop();

// ===============================
// JOY-CON POINTER RAY + RAY CLICK
// ===============================
const joyconRay = document.querySelector("#joyconRay");

function updateJoyconRay() {
  if (rightJoycon === null) {
    joyconRay.setAttribute("visible", "false");
    return;
  }

  const cameraEl = document.querySelector("[camera]");
  if (!cameraEl) return;

  const camObj = cameraEl.object3D;
  const rayObj = joyconRay.object3D;

  rayObj.position.copy(camObj.position);

  joyconRay.setAttribute("line", {
    start: "0 0 0",
    end: "0 0 -3",
    color: "#4a8cff"
  });

  joyconRay.setAttribute("visible", "true");
}

function joyconRayClick() {
  const cameraEl = document.querySelector("[camera]");
  if (!cameraEl) return;

  const camObj = cameraEl.object3D;
  const raycaster = new THREE.Raycaster();
  const dir = new THREE.Vector3(0, 0, -1);
  camObj.getWorldDirection(dir);
  raycaster.set(camObj.position, dir);

  const clickableEls = Array.from(document.querySelectorAll(".clickable"));
  const clickableObjs = clickableEls.map(el => el.object3D);

  const hits = raycaster.intersectObjects(clickableObjs, true);

  if (hits.length > 0) {
    const hitObj = hits[0].object;
    const targetEl = hitObj.el;
    targetEl.emit("click");
  }
}
