const socket = io();
const playerList = document.querySelector("#player-list");
const btn = document.querySelector("button");
socket.emit("askPlayerIn");

socket.on("playerIn", function (arg) {
  let playerHtml = "";
  for (let player of arg.roomPlayerList) {
    playerHtml += `${player}<br>`;
  }
  playerList.innerHTML = playerHtml;
});

btn.addEventListener("click", function () {
  socket.emit("gameStart");
});

socket.on("gameCreated", (arg) => {
  location.href = `/coup?game=${arg.game.id}`;
});
