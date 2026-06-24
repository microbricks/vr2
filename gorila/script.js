// ===============================
// JOY-CON DETECTIE
// ===============================
let leftJoycon = null;
let rightJoycon = null;

window.addEventListener("gamepadconnected", () => {
  const pads = navigator.getGamepads();

  for (const gp of pads) {
    if (!gp) continue;

    if (gp.id.includes("Joy-Con (L)")) {
      leftJoycon = gp.index;
      console.log("Linker Joy-Con gevonden op kanaal", gp.index);
    }

    if (gp.id.includes("Joy-Con (R)")) {
      rightJoycon = gp.index;
      console.log("Rechter Joy-Con gevonden op kanaal", gp.index);
    }
  }
});

// ===============================
// KEYBOARD CONTROLS
// ===============================
const keys = {};

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ===============================
// GORILLA LOCOMOTION VARIABELEN
// ===============================
const rig = document.querySelector('#cameraRig');

let velocityY = 0;
let grounded = true;
const gravity = -0.01;

const armSwingForce = 0.06;
const keyboardForce = 0.08;
const jumpForce = 0.18;
const climbForce = 0.10;

let prevLeftY = 0;
let prevRightY = 0;

// ===============================
// GORILLA TAG BEWEGING
// ===============================
function gorillaMove() {
  const pads = navigator.getGamepads();

  // -------------------------------
  // 1. ARM SWING LOCOMOTION (Joy-Cons)
  // -------------------------------
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
    }
  }

  // -------------------------------
  // 2. KEYBOARD LOCOMOTION
  // -------------------------------
  if (keys["w"]) moveForward(keyboardForce);
  if (keys["s"]) moveBackward(keyboardForce);
  if (keys["a"]) moveLeft(keyboardForce);
  if (keys["d"]) moveRight(keyboardForce);

  // Jump (space)
  if (keys[" "] && grounded) {
    velocityY = jumpForce;
    grounded = false;
  }

  // Climb (shift)
  if (keys["Shift"]) {
    rig.object3D.position.y += climbForce;
  }

  // Tag (E)
  if (keys["e"]) {
    rig.object3D.position.y += 0.1;
    setTimeout(() => rig.object3D.position.y -= 0.1, 150);
  }

  // -------------------------------
  // 3. JUMP (Joy-Con A)
  // -------------------------------
  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp && gp.buttons[0].pressed && grounded) {
      velocityY = jumpForce;
      grounded = false;
    }
  }

  // -------------------------------
  // 4. CLIMB (Joy-Con X)
  // -------------------------------
  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp && gp.buttons[2].pressed) {
      rig.object3D.position.y += climbForce;
    }
  }

  // -------------------------------
  // 5. TAG (Joy-Con B)
  // -------------------------------
  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp && gp.buttons[1].pressed) {
      rig.object3D.position.y += 0.1;
      setTimeout(() => rig.object3D.position.y -= 0.1, 150);
    }
  }

  // -------------------------------
  // 6. GRAVITY
  // -------------------------------
  if (!grounded) {
    velocityY += gravity;
    rig.object3D.position.y += velocityY;

    if (rig.object3D.position.y <= 1.6) {
      rig.object3D.position.y = 1.6;
      velocityY = 0;
      grounded = true;
    }
  }

  requestAnimationFrame(gorillaMove);
}

gorillaMove();

// ===============================
// BEWEGING FUNCTIES
// ===============================
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
