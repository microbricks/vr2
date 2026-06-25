const camVideo = document.getElementById("camVideo");
const cameraBtn = document.getElementById("cameraBtn");
const sceneEl = document.getElementById("scene");
const melding = document.getElementById("melding");

// Log helper
function log(msg) {
  console.log(msg);
  melding.textContent = msg;
  melding.style.display = "block";
}

// Renderer transparant
sceneEl.addEventListener("loaded", () => {
  const renderer = sceneEl.renderer;
  if (renderer) {
    renderer.setClearColor(0x000000, 0);
    log("Renderer transparant ✔");
  }
});

// Toestemming checken
async function vraagCameraToestemming() {
  if (!navigator.permissions) {
    log("Permissions API niet beschikbaar → doorgaan");
    return true;
  }

  try {
    const status = await navigator.permissions.query({ name: "camera" });
    log("Permissie status: " + status.state);

    if (status.state === "granted") return true;
    if (status.state === "prompt") return true;

    if (status.state === "denied") {
      log("Camera geblokkeerd in instellingen ❌");
      return false;
    }

  } catch (err) {
    log("Permissie check fout: " + err.message);
    return true;
  }
}

// Camera starten
cameraBtn.addEventListener("click", async () => {
  log("Knop ingedrukt → toestemming checken...");

  const toestemming = await vraagCameraToestemming();
  if (!toestemming) return;

  log("Toestemming OK → camera openen...");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    if (!stream) {
      log("Stream = null ❌");
      return;
    }

    log("Stream ontvangen ✔");

    camVideo.srcObject = stream;
    camVideo.style.display = "block";

    log("Camera actief 🎥");

  } catch (err) {
    log("getUserMedia fout: " + err.name + " → " + err.message);
  }
});
