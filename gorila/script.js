const statusEl = document.querySelector('#status');
const video = document.querySelector('#video');
const offerQR = document.querySelector('#offerQR');

let pc = null;
let dataChannel = null;

const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// ====== CREATE OFFER + QR ======
async function makeOffer() {
  pc = new RTCPeerConnection(rtcConfig);

  pc.ondatachannel = (e) => {
    dataChannel = e.channel;
    dataChannel.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      handleAction(data.action);
    };
    dataChannel.onopen = () => statusEl.textContent = "Verbonden!";
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  new QRious({
    element: offerQR,
    size: 250,
    value: JSON.stringify(offer)
  });
}

makeOffer();

// ====== SCAN ANSWER QR ======
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
  scanLoop();
});

function scanLoop() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(img.data, canvas.width, canvas.height);

  if (code) {
    const answer = JSON.parse(code.data);
    pc.setRemoteDescription(answer);
    statusEl.textContent = "Answer ontvangen!";
    video.srcObject.getTracks().forEach(t => t.stop());
    return;
  }

  requestAnimationFrame(scanLoop);
}

// ====== MOVEMENT ======
const rig = document.querySelector('#cameraRig');
let velY = 0, grounded = true;

function handleAction(a) {
  if (a === "forward") moveForward();
  if (a === "jump") jump();
  if (a === "climb") climb();
  if (a === "tag") tag();
}

function moveForward() {
  const dir = new THREE.Vector3(0,0,-1);
  rig.object3D.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  dir.multiplyScalar(0.08);
  rig.object3D.position.add(dir);
}

function jump() {
  if (grounded) { velY = 0.18; grounded = false; }
}

function climb() {
  rig.object3D.position.y += 0.08;
}

function tag() {
  rig.object3D.position.y += 0.1;
  setTimeout(()=>rig.object3D.position.y-=0.1,150);
}

function loop() {
  if (!grounded) {
    velY -= 0.01;
    rig.object3D.position.y += velY;
    if (rig.object3D.position.y <= 1.6) {
      rig.object3D.position.y = 1.6;
      grounded = true;
      velY = 0;
    }
  }
  requestAnimationFrame(loop);
}
loop();
