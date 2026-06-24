// ===============================
// JOY-CON DETECTIE
// ===============================
let leftJoycon = null;
let rightJoycon = null;

window.addEventListener("gamepadconnected", () => {
  const pads = navigator.getGamepads();

  for (const gp of pads) {
    if (!gp) continue;

    // Linker Joy-Con
    if (gp.id.includes("Joy-Con (L)")) {
      leftJoycon = gp.index;
      console.log("Linker Joy-Con gevonden op kanaal", gp.index);
    }

    // Rechter Joy-Con
    if (gp.id.includes("Joy-Con (R)")) {
      rightJoycon = gp.index;
      console.log("Rechter Joy-Con gevonden op kanaal", gp.index);
    }
  }
});

// ===============================
// GORILLA LOCOMOTION VARIABELEN
// ===============================
const rig = document.querySelector('#cameraRig');

let velocityY = 0;
let grounded = true;
const gravity = -0.01;

const armSwingForce = 0.06;   // snelheid vooruit
const jumpForce = 0.18;       // springkracht
const climbForce = 0.10;      // klimkracht

// Vorige Y-positie van sticks (arm swing detectie)
let prevLeftY = 0;
let prevRightY = 0;

// ===============================
// GORILLA TAG BEWEGING
// ===============================
function gorillaMove() {
  const pads = navigator.getGamepads();

  // -------------------------------
  // 1. ARM SWING LOCOMOTION
  // -------------------------------
  if (leftJoycon !== null) {
    const gp = pads[leftJoycon];
    if (gp) {
      const ly = gp.axes[1];
      const swing = prevLeftY - ly;

      if (swing > 0.25) moveForward();
      prevLeftY = ly;
    }
  }

  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp) {
      const ry = gp.axes[1];
      const swing = prevRightY - ry;

      if (swing > 0.25) moveForward();
      prevRightY = ry;
    }
  }

  // -------------------------------
  // 2. JUMP (A-knop)
  // -------------------------------
  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp && gp.buttons[0].pressed && grounded) {
      velocityY = jumpForce;
      grounded = false;
    }
  }

  // -------------------------------
  // 3. CLIMB (X-knop)
  // -------------------------------
  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp && gp.buttons[2].pressed) {
      rig.object3D.position.y += climbForce;
    }
  }

  // -------------------------------
  // 4. TAG EFFECT (B-knop)
  // -------------------------------
  if (rightJoycon !== null) {
    const gp = pads[rightJoycon];
    if (gp && gp.buttons[1].pressed) {
      rig.object3D.position.y += 0.1;
      setTimeout(() => rig.object3D.position.y -= 0.1, 150);
    }
  }

  // -------------------------------
  // 5. GRAVITY
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
// BEWEGING FUNCTIE
// ===============================
function moveForward() {
  const dir = new THREE.Vector3(0, 0, -1);
  rig.object3D.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  dir.multiplyScalar(armSwingForce);
  rig.object3D.position.add(dir);
}
