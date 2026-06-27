const video = document.getElementById('cam');

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' }, // of 'environment'
    audio: false
  });
  video.srcObject = stream;
}

startCamera();
