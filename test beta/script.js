const cameraBtn = document.querySelector("#cameraBgBtn");
const bgVideo = document.querySelector("#bgVideo");

cameraBtn.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    bgVideo.srcObject = stream;
    bgVideo.style.display = "block";

    // A-Frame transparant maken
    const scene = document.querySelector("a-scene");
    scene.renderer.setClearColor(0x000000, 0); // alpha = 0

    console.log("Camera achtergrond actief");
  } catch (err) {
    console.error("Camera fout:", err);
  }
});
