const statusEl = document.querySelector('#status');

let pc = null;
let dataChannel = null;

const makeOfferBtn = document.querySelector('#makeOfferBtn');
const offerOut = document.querySelector('#offerOut');
const answerIn = document.querySelector('#answerIn');
const setAnswerBtn = document.querySelector('#setAnswerBtn');

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

async function createConnection() {
  pc = new RTCPeerConnection(rtcConfig);

  dataChannel = pc.createDataChannel('input');
  dataChannel.onopen = () => {
    statusEl.textContent = 'Status: WebRTC verbonden';
  };
  dataChannel.onclose = () => {
    statusEl.textContent = 'Status: WebRTC kanaal gesloten';
  };

  pc.onicecandidate = (e) => {
    if (!e.candidate && pc.localDescription) {
      offerOut.value = JSON.stringify(pc.localDescription);
    }
  };
}

makeOfferBtn.addEventListener('click', async () => {
  await createConnection();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  statusEl.textContent = 'Status: offer gemaakt, kopieer naar VR';
});

setAnswerBtn.addEventListener('click', async () => {
  const txt = answerIn.value.trim();
  if (!txt) return;
  const answer = JSON.parse(txt);
  await pc.setRemoteDescription(answer);
  statusEl.textContent = 'Status: answer gezet, wacht op datachannel open';
});

function sendAction(action) {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify({ action }));
    statusEl.textContent = 'Laatste actie: ' + action;
  } else {
    statusEl.textContent = 'Kanaal niet open (actie niet verstuurd)';
  }
}

document.querySelectorAll('.btn').forEach(btn => {
  const handler = () => {
    const action = btn.getAttribute('data-action');
    sendAction(action);
  };
  btn.addEventListener('touchstart', handler);
  btn.addEventListener('click', handler);
});
