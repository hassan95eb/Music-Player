const image = document.getElementById("cover");
const title = document.getElementById("music-title");
const artist = document.getElementById("music-artist");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
// const progress = document.getElementById("progress");
const progress = document.querySelector(".progress");
const playerProgress = document.getElementById("player-progress");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const playBtn = document.getElementById("play");
const background = document.getElementById("bg-img");

const music = new Audio();
console.log(music);
const songs = [
  {
    path: "./assest/source/kabk.mp3",
    displayName: "Kabk",
    cover: "./assest/source/Kabk.jpg",
    artist: "Ho3ein & Hamid Sefat",
  },
  {
    path: "./assest/source/Sob-Zohr-Shab.mp3",
    displayName: "Sob Zohr Shab",
    cover: "./assest/source/Sob-Zohr-Shab.jpg",
    artist: "Ho3ein",
  },
  {
    path: "./assest/source/tollani.mp3",
    displayName: "Tollani",
    cover: "./assest/source/Tollani.jpg",
    artist: "Sina Saee",
  },
];
let musicIndex = 0;
let isPlaying = false;

function togglePlay() {
  if (isPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}
function playMusic() {
  isPlaying = true;
  playBtn.classList.replace("fa-play", "fa-pause");
  playBtn.setAttribute("title", "Pause");
  music.play();
}
function pauseMusic() {
  isPlaying = false;
  playBtn.classList.replace("fa-pause", "fa-play");
  playBtn.setAttribute("title", "Play");
  music.pause();
}
function loadMusic(songs) {
  music.src = songs.path;
  title.textContent = songs.displayName;
  artist.textContent = songs.artist;
  image.src = songs.cover;
  background.src = songs.cover;
}
function changeMusic(direction) {
  musicIndex = (musicIndex + direction + songs.length) % songs.length;
  loadMusic(songs[musicIndex]);
  playMusic();
}
function updateProgressBar() {
  const { duration, currentTime } = music;
  const progressPercent = (currentTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;
  const formatTime = (time) => {
    String(Math.floor(time)).padStart(2, "0");
  };
  durationEl.textContent = `${formatTime(duration / 60)} : ${formatTime(
    duration % 60
  )}`;
  currentTimeEl.textContent = `${formatTime(currentTime / 60)} : ${formatTime(
    currentTime % 60
  )}`;
}
function setProgressBar(e) {
  const width = playerProgress.clientWidth;
  const clickX = e.offsetX;
  music.currentTime = (clickX / width) * music.duration;
}
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", () => changeMusic(+1));
prevBtn.addEventListener("click", () => changeMusic(-1));
music.addEventListener("ended", () => changeMusic(+1));
music.addEventListener("timeupdate", updateProgressBar);
playerProgress.addEventListener("click", setProgressBar);
loadMusic(songs[musicIndex]);
