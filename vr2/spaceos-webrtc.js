let pc;
let dataChannel;

// PEER CONNECTION
function createPeer() {
  pc = new RTCPeerConnection();

  pc.ondatachannel = (event) => {
    dataChannel = event.channel;
    console.log("DataChannel ontvangen:", dataChannel.label);

    dataChannel.onopen = () => console.log("DataChannel open");
    dataChannel.onclose = () => console.log("DataChannel dicht");

    dataChannel.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        handleTrackingPayload(payload);
      } catch (err) {
        console.error("Kon payload niet parsen:", err);
      }
    };
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) return;
    document.getElementById("answer").value = JSON.stringify(pc.localDescription);
  };
}

// OFFER VAN iPad
async function applyOffer() {
  const offerText = document.getElementById("offer").value;
  const offer = JSON.parse(offerText);

  createPeer();
  await pc.setRemoteDescription(offer);
}

// ANSWER TERUG NAAR iPad
async function createAnswer() {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
}

// HANDTRACKING PAYLOAD
function handleTrackingPayload(payload) {
  if (!payload || payload.type !== "hands") return;

  console.log("Hands payload:", payload);

  if (payload.hands && payload.hands.length > 0) {
    const hand = payload.hands[0];
    const gesture = hand.gesture;
    const landmarks = hand.landmarks;

    const indexTip = landmarks[8];

    const x = indexTip.x;
    const y = indexTip.y;
    const z = indexTip.z;

    if (window.spaceOSInput) {
      window.spaceOSInput.updateRaycast({
        x,
        y,
        z,
        gesture
      });

      window.spaceOSInput.updateHands(payload.hands);
    }
  }
}
