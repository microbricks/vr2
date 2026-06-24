const cameraRig = document.querySelector('#cameraRig');

let velocityY = 0;
const gravity = -0.01;
let isGrounded = true;

const forwardSpeed = 0.08;

// simpele action queue
let actionQueue = [];

// wordt aangeroepen door WebSocket-server (zie hieronder)
function handleAction(action) {
  actionQueue.push(action);
}

// main loop
function update() {
  // verwerk alle acties
  while (actionQueue.length > 0) {
    const action = actionQueue.shift();
    if (action === 'forward') {
      moveForward();
    }
    if (action === 'jump') {
      jump();
    }
    if (action === 'climb') {
      climb();
    }
    if (action === 'tag') {
      tagEffect();
    }
  }

  // gravity
  if (!isGrounded) {
    velocityY += gravity;
    cameraRig.object3D.position.y += velocityY;
  }

  // ground check
  if (cameraRig.object3D.position.y <= 1.6) {
    cameraRig.object3D.position.y = 1.6;
    velocityY = 0;
    isGrounded = true;
  }

  requestAnimationFrame(update);
}

update();

function moveForward() {
  const dir = new THREE.Vector3(0, 0, -1);
  cameraRig.object3D.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  dir.multiplyScalar(forwardSpeed);
  cameraRig.object3D.position.add(dir);
}

function jump() {
  if (isGrounded) {
    velocityY = 0.18;
    isGrounded = false;
  }
}

function climb() {
  cameraRig.object3D.position.y += 0.08;
}

function tagEffect() {
  // simpele feedback: camera even omhoog en omlaag
  cameraRig.object3D.position.y += 0.1;
  setTimeout(() => {
    cameraRig.object3D.position.y -= 0.1;
  }, 150);
}
