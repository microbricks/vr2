const cameraRig = document.querySelector('#cameraRig');

let velocityY = 0;
const gravity = -0.01;
let isGrounded = true;
const forwardSpeed = 0.08;

let actionQueue = [];

function handleAction(action) {
  actionQueue.push(action);
}

const offerIn = document.querySelector('#offerIn');
const setOfferBtn = document.querySelector('#setOfferBtn');
const answerOut = document.querySelector('#answerOut');
const vrStatus = document.querySelector('#vrStatus');

let pc = null;
let dataChannel = null;

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

async function createConnection() {
  pc = new RTCPeerConnection(rtcConfig);

  pc.ondatachannel = (e) => {
    dataChannel = e.channel;
    dataChannel.onopen = () => {
      vrStatus.textContent = 'Status: WebRTC verbonden';
    };
    dataChannel.onclose = () => {
      vrStatus.textContent = 'Status: kanaal gesloten';
    };
    dataChannel.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.action) handleAction(data.action);
      } catch (e) {
        console.error('Bad message', e);
      }
    };
  };

  pc.onicecandidate = (e) => {
    if (!e.candidate && pc.localDescription) {
      answerOut.value = JSON.stringify(pc.localDescription);
    }
  };
}

setOfferBtn.addEventListener('click', async () => {
  const txt = offerIn.value.trim();
  if (!txt) return;
  await createConnection();
  const offer = JSON.parse(txt);
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  vrStatus.textContent = 'Status: answer gemaakt, kopieer naar iPad';
});

function update() {
  while (actionQueue.length > 0) {
    const action = actionQueue.shift();
    if (action === 'forward') moveForward();
    if (action === 'jump') jump();
    if (action === 'climb') climb();
    if (action === 'tag') tagEffect();
  }

  if (!isGrounded) {
    velocityY += gravity;
    cameraRig.object3D.position.y += velocityY;
  }

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
  cameraRig.object3D.position.y += 0.1;
  setTimeout(() => {
    cameraRig.object3D.position.y -= 0.1;
  }, 150);
}
