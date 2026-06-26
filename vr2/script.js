// ===============================
// 3D PANEL MANAGER
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
// TILE CLICKS (APPS)
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
// JOY-CON + KEYBOARD LOCOMOTION
// ===============================
const rig = document.querySelector("#cameraRig");

let leftJoycon = null;
let rightJoycon = null;

window.addEventListener("gamepadconnected", () => {
  const pads = navigator.getGamepads();
  for (const gp of pads) {
    if (!gp) continue;
    if (gp.id.includes("Joy-Con (L)")) leftJoycon = gp.index;
    if (gp.id.includes("Joy-Con (R)")) rightJoycon = gp.index;
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

function locomotionLoop() {
  const pads = navigator.getGamepads();

  if (leftJoycon !== null) {
    const gp = pads[leftJoycon];
    if (gp) {
      const ly = gp.axes[1];
      const swing = prevLeftY - ly;
      if (swing > 0.25) moveForward(armSwingForce);
      prevLeftY = ly;
    }
  }

  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp) {
      const ry = gp.axes[1];
      const swing = prevRightY - ry;
      if (swing > 0.25) moveForward(armSwingForce);
      prevRightY = ry;

      if (gp.buttons[0].pressed && grounded) {
        velocityY = jumpForce;
        grounded = false;
      }
      if (gp.buttons[2].pressed) {
        rig.object3D.position.y += climbForce;
      }
      if (gp.buttons[1].pressed) {
        rig.object3D.position.y += 0.1;
        setTimeout(() => rig.object3D.position.y -= 0.1, 150);
      }
    }
  }

  if (keys["w"]) moveForward(keyboardForce);
  if (keys["s"]) moveBackward(keyboardForce);
  if (keys["a"]) moveLeft(keyboardForce);
  if (keys["d"]) moveRight(keyboardForce);

  if (keys[" "] && grounded) {
    velocityY = jumpForce;
    grounded = false;
  }
  if (keys["Shift"]) {
    rig.object3D.position.y += climbForce;
  }

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
