const video = document.getElementById('cam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const debug = document.getElementById('debug');

// ---------------------------
// CAMERA
// ---------------------------
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },
    audio: false
  });
  video.srcObject = stream;
}
startCamera();

// ---------------------------
// MEDIAPIPE HANDS
// ---------------------------
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults(onResults);

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});
camera.start();

// ---------------------------
// WEBRTC
// ---------------------------
let pc;
let dataChannel;

function createPeer() {
  pc = new RTCPeerConnection();

  dataChannel = pc.createDataChannel("tracking");
  dataChannel.onopen = () => console.log("DataChannel open");
  dataChannel.onclose = () => console.log("DataChannel closed");

  pc.onicecandidate = (e) => {
    if (e.candidate) return;
    document.getElementById("offer").value = JSON.stringify(pc.localDescription);
  };
}

async function startOffer() {
  createPeer();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
}

async function applyAnswer() {
  const answerText = document.getElementById("answer").value;
  const answer = JSON.parse(answerText);
  await pc.setRemoteDescription(answer);
}

// ---------------------------
// HANDTRACKING CALLBACK
// ---------------------------
function onResults(results) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label;

      const color = handedness === 'Left' ? '#00ff88' : '#ff0088';

      // 21 gewrichten
      for (let j = 0; j < landmarks.length; j++) {
        const lm = landmarks[j];
        drawDot(
          lm.x * canvas.width,
          lm.y * canvas.height,
          lm.z,
          8,
          color
        );
      }

      // vingertoppen
      const tips = [4, 8, 12, 16, 20];
      tips.forEach(idx => {
        const lm = landmarks[idx];
        drawDot(
          lm.x * canvas.width,
          lm.y * canvas.height,
          lm.z,
          14,
          '#ffffff'
        );
      });

      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color,
        lineWidth: 3
      });
    }
  }

  ctx.restore();

  const payload = buildPayload(results);
  debug.textContent = JSON.stringify(payload, null, 2);

  // SEND VIA WEBRTC
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify(payload));
  }
}

// ---------------------------
// PAYLOAD
// ---------------------------
function buildPayload(results) {
  const handsOut = [];

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label;

      const points = landmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z
      }));

      // pinch gesture
      const thumb = landmarks[4];
      const index = landmarks[8];
      const dx = thumb.x - index.x;
      const dy = thumb.y - index.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let gesture = "open";
      if (dist < 0.05) gesture = "pinch";

      handsOut.push({
        hand: handedness.toLowerCase(),
        landmarks: points,
        gesture
      });
    }
  }

  return {
    type: "hands",
    hands: handsOut,
    timestamp: Date.now()
  };
}

// ---------------------------
// DOT TEKENEN MET Z‑GROOTTE
// ---------------------------
function drawDot(x, y, z, baseSize, color) {
  const scale = 1 - (z * 5);
  const size = baseSize * scale;

  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
