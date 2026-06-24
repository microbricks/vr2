// ====== SIMPLE EVENT BUS (naar VR-game) ======
function sendAction(action) {
  // Hier kun je WebSocket / WebRTC / HTTP aan koppelen.
  // Voor nu loggen we het alleen:
  console.log('ACTION:', action);
  const status = document.querySelector('#status');
  status.textContent = 'Laatste actie: ' + action;
}

// ====== BUTTON UI ======
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('touchstart', () => {
    const action = btn.getAttribute('data-action');
    sendAction(action);
  });
  btn.addEventListener('click', () => {
    const action = btn.getAttribute('data-action');
    sendAction(action);
  });
});

// ====== TEACHABLE MACHINE ======
let tmModel = null;
let tmWebcam = null;
let tmLoopRunning = false;

// Zet hier jouw eigen Teachable Machine model URL:
let MODEL_URL = ''; // bv: "https://teachablemachine.withgoogle.com/models/JE_MODEL_URL/"

const loadModelBtn   = document.querySelector('#loadModelBtn');
const tmStatus       = document.querySelector('#tmStatus');
const modelUrlLabel  = document.querySelector('#modelUrlLabel');

loadModelBtn.addEventListener('click', async () => {
  if (!MODEL_URL) {
    alert('Stel eerst MODEL_URL in in controller.js');
    return;
  }

  try {
    const modelURL = MODEL_URL + 'model.json';
    const metadataURL = MODEL_URL + 'metadata.json';

    tmModel = await tmImage.load(modelURL, metadataURL);
    modelUrlLabel.textContent = MODEL_URL;

    // Webcam setup
    const size = 200;
    tmWebcam = new tmImage.Webcam(size, size, true);
    await tmWebcam.setup();
    await tmWebcam.play();

    tmStatus.textContent = 'TM: actief (webcam draait)';
    tmLoopRunning = true;
    window.requestAnimationFrame(tmLoop);
  } catch (e) {
    console.error(e);
    tmStatus.textContent = 'TM: fout bij laden';
  }
});

async function tmLoop() {
  if (!tmLoopRunning || !tmModel || !tmWebcam) return;

  tmWebcam.update();
  const prediction = await tmModel.predict(tmWebcam.canvas);

  // Voorbeeld: neem hoogste class
  let best = null;
  prediction.forEach(p => {
    if (!best || p.probability > best.probability) best = p;
  });

  if (best && best.probability > 0.8) {
    // Koppel classnames aan acties
    // bv: "swing_down" → forward, "jump_pose" → jump
    mapTMClassToAction(best.className);
  }

  window.requestAnimationFrame(tmLoop);
}

function mapTMClassToAction(className) {
  // Hier bepaal jij zelf de mapping:
  // Pas aan op basis van jouw TM classes.
  switch (className) {
    case 'swing_down':
      sendAction('forward');
      break;
    case 'jump_pose':
      sendAction('jump');
      break;
    case 'climb_pose':
      sendAction('climb');
      break;
    case 'tag_pose':
      sendAction('tag');
      break;
    default:
      // onbekende class → geen actie
      break;
  }
}
