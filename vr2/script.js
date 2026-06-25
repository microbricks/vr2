// ===============================
// WINDOW MANAGER
// ===============================
const windows = {
  browser: document.querySelector("#win-browser"),
  notes: document.querySelector("#win-notes"),
  settings: document.querySelector("#win-settings"),
};

function openWindow(name) {
  Object.values(windows).forEach(w => w.style.display = "none");
  if (windows[name]) windows[name].style.display = "flex";
}

function closeWindow(name) {
  if (windows[name]) windows[name].style.display = "none";
}

document.querySelectorAll(".dock-btn[data-app]").forEach(btn => {
  btn.addEventListener("click", () => {
    const app = btn.getAttribute("data-app");
    openWindow(app);
  });
});

document.querySelectorAll(".window-close").forEach(btn => {
  btn.addEventListener("click", () => {
    const app = btn.getAttribute("data-close");
    closeWindow(app);
  });
});

// ===============================
// AR CAMERA BACKGROUND
// ===============================
const cameraBtn = document.querySelector("#cameraBgBtn");
const bgVideo = document.querySelector("#bgVideo");
const arStatus = document.querySelector("#arStatus");
let arActive = false;
let camStream = null;

cameraBtn.addEventListener("click", async () => {
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
      arStatus.textContent = "Aan";
      cameraBtn.textContent = "AR Background uit";
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
    scene.renderer.setClearColor(0x000010, 1);
    document.querySelector("#sky").setAttribute("visible", "true");

    arActive = false;
    arStatus.textContent = "Uit";
    cameraBtn.textContent = "AR Background";
  }
});

// ===============================
// JOY-CON + KEYBOARD LOCOMOTION
// ===============================
const rig = document.querySelector("#cameraRig");

let leftJoycon = null;
let rightJoycon = null;
const joyconStatus = document.querySelector("#joyconStatus");

window.addEventListener("gamepadconnected", () => {
  const pads = navigator.getGamepads();
  for (const gp of pads) {
    if (!gp) continue;
    if (gp.id.includes("Joy-Con (L)")) leftJoycon = gp.index;
    if (gp.id.includes("Joy-Con (R)")) rightJoycon = gp.index;
  }
  if (leftJoycon !== null || rightJoycon !== null) {
    joyconStatus.textContent = "Actief";
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
