const video = document.getElementById('cam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const debug = document.getElementById('debug');

// Camera starten
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' }, // 'environment' voor achtercamera
    audio: false
  });
  video.srcObject = stream;
}

startCamera();

// MediaPipe Hands setup
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

// Camera helper
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});
camera.start();

// hoofd callback
function onResults(results) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label; // 'Left' / 'Right'

      const color = handedness === 'Left' ? '#00ff88' : '#ff0088';

      // Dots op alle 21 gewrichten (Z‑gebaseerde grootte)
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

      // Extra grote dots op vingertoppen
      const fingertipIndexes = [4, 8, 12, 16, 20];
      fingertipIndexes.forEach(idx => {
        const lm = landmarks[idx];
        drawDot(
          lm.x * canvas.width,
          lm.y * canvas.height,
          lm.z,
          14,
          '#ffffff'
        );
      });

      // Verbindingen tekenen
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color,
        lineWidth: 3
      });
    }
  }

  ctx.restore();

  const payload = buildPayload(results);
  debug.textContent = JSON.stringify(payload, null, 2);

  // Hier kun je straks WebRTC / WebSocket aanroepen:
  // sendToSpaceOS(payload);
}

// JSON payload voor SpaceOS
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

      // simpele gesture: pinch (duim + wijsvinger dicht bij elkaar)
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const dx = thumbTip.x - indexTip.x;
      const dy = thumbTip.y - indexTip.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let gesture = 'open';
      if (dist < 0.05) gesture = 'pinch';

      handsOut.push({
        hand: handedness.toLowerCase(),
        landmarks: points,
        gesture
      });
    }
  }

  return {
    type: 'hands',
    hands: handsOut,
    timestamp: Date.now()
  };
}

// Dot tekenen met Z‑gebaseerde grootte
function drawDot(x, y, z, baseSize, color) {
  // MediaPipe Z is meestal tussen -0.1 en 0.1
  const scale = 1 - (z * 5); 
  const size = baseSize * scale;

  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
