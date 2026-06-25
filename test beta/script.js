const camVideo = document.getElementById("camVideo");
const cameraBtn = document.getElementById("cameraBtn");
const sceneEl = document.getElementById("scene");

// Wacht tot A-Frame klaar is
sceneEl.addEventListener("loaded", () => {
  const renderer = sceneEl.renderer;
  if (renderer) {
    renderer.setClearColor(0x000000, 0); // transparant
    console.log("Renderer transparant gezet");
  }
});

// Camera starten
cameraBtn.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    camVideo.srcObject = stream;
    camVideo.style.display = "block";

    console.log("Camera achtergrond actief");
  } catch (err) {
    console.error("Camera fout:", err);
  }
});
