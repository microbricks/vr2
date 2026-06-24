const statusEl = document.querySelector('#status');
const video = document.querySelector('#video');
const qrCanvas = document.querySelector('#qrCanvas');

let pc = null;
let dataChannel = null;

// WebRTC config
const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// ====== QR SCANNER ======
document.querySelector('#startScanBtn').onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;
  scanLoop();
};

function scanLoop() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(img.data, canvas.width, canvas.height);

  if (code) {
    const offer = JSON.parse(code.data);
    startWebRTC(offer);
    video.srcObject.getTracks().forEach(t => t.stop());
    return;
  }

  requestAnimationFrame(scanLoop);
}

// ====== WEBRTC ======
async function startWebRTC(offer) {
  pc = new RTCPeerConnection(rtcConfig);

  pc.ondatachannel = (e) => {
    dataChannel = e.channel;
    dataChannel.onopen = () => statusEl.textContent = "Verbonden!";
  };

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // QR terug naar VR
  new QRious({
    element: qrCanvas,
    size: 250,
    value: JSON.stringify(answer)
  });

  statusEl.textContent = "Scan deze QR in VR";
}

// ====== ACTION SEND ======
function sendAction(action) {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify({ action }));
    statusEl.textContent = "Actie: " + action;
  }
}

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => sendAction(btn.dataset.action));
});
