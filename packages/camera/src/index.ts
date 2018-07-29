const videoElement: HTMLVideoElement = document.getElementById(
  "videoElement"
) as HTMLVideoElement;

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  const videoSettings = {
    video: true,
    audio: true
  };

  navigator.mediaDevices
    .getUserMedia(videoSettings)
    .then((stream: MediaStream): void => {
      videoElement.setAttribute("src", window.URL.createObjectURL(stream));
      videoElement.play();
    });
}
