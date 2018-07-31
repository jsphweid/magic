// const video: HTMLVideoElement = document.getElementById(
//   "video"
// ) as HTMLVideoElement;

// const videoSettings: MediaStreamConstraints = {
//   video: true,
//   audio: true
// };

// navigator.mediaDevices.getUserMedia(videoSettings).then(
//   (stream: MediaStream): void => {
//     video.setAttribute("src", window.URL.createObjectURL(stream));
//     video.play();
//   }
// );

// const canvas: HTMLCanvasElement = document.getElementById(
//   "canvas"
// ) as HTMLCanvasElement;
// const context: CanvasRenderingContext2D = canvas.getContext("2d");

// Automatic screenshots
// setInterval(() => {
//   context.drawImage(video, 0, 0, 640, 480);
// }, 1000);

// Manual screenshots via button
// document.getElementById("snap").addEventListener("click", (): void => {
//   context.drawImage(video, 0, 0, 640, 480);
// });
