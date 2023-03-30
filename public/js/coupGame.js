const socket = io();

const income = document.querySelector("#income");
const foreignAid = document.querySelector("#foreign-aid");
const coup = document.querySelector("#coup");
const tax = document.querySelector("#tax");
const assassinate = document.querySelector("#assassinate");
const exchange = document.querySelector("#exchange");
const steal = document.querySelector("#steal");

const msgBox = document.querySelector("#message-box");

const cardPathMap = [
  "/img/ambassador.jpg",
  "/img/assassin.jpg",
  "/img/captain.jpg",
  "/img/contessa.jpg",
  "/img/duke.jpg",
];
socket.emit("askGameInit");
socket.on("ansGameInit", function (game) {
  init(game);
});

let myId;
function init(game) {
  /* --------------------------------- My Info -------------------------------- */
  const myInfo = document.querySelector("#my-info");
  myId = game.my.id;
  myInfo.id = `player-${game.my.id}-info`;
  const myCard1 = document.querySelector(`#player-${game.my.id}-info #card-1`);
  const myCard2 = document.querySelector(`#player-${game.my.id}-info #card-2`);
  const myBalance = document.querySelector(
    `#player-${game.my.id}-info #balance`
  );

  myCard1.src = cardPathMap[Math.floor(parseInt(game.my.hand[0]) / 3)];
  myCard2.src = cardPathMap[Math.floor(parseInt(game.my.hand[1]) / 3)];
  myBalance.textContent = game.my.balance;
  /* ------------------------------ Player 2 Info ----------------------------- */
  let playersInfo = document.querySelector("#players-1-info");
  playersInfo.id = `player-${game.otherPlayerList[0].id}-info`;
  document.querySelector(
    `#player-${game.otherPlayerList[0].id}-info #balance`
  ).textContent = game.otherPlayerList[0].balance;
  /* ---------------------------- Other Player Info --------------------------- */
  for (let i = 1; i < game.otherPlayerList.length; i++) {
    playersInfo = playersInfo.cloneNode(true);
    playersInfo.id = `player-${game.otherPlayerList[i].id}-info`;
    document.getElementById("players-info-board").appendChild(playersInfo);
    document.querySelector(
      `#player-${game.otherPlayerList[i].id}-info #balance`
    ).textContent = game.otherPlayerList[i].balance;
  }
  /* ------------------------------- Button Init ------------------------------ */
  const actionButton = document.querySelectorAll("#turn-button-board .btn");
  actionButton.forEach((button) => {
    button.disabled = true;
  });
  const counteractionButton = document.querySelectorAll(
    "#counteraction-button-board .btn"
  );
  counteractionButton.forEach((button) => {
    button.disabled = true;
  });
  const challengeButton = document.querySelectorAll(
    "#challenge-button-board .btn"
  );
  challengeButton.forEach((button) => {
    button.disabled = true;
  });

  income.addEventListener("click", function (event) {
    socket.emit("answerAction", { chosenAction: "income" });
  });

  foreignAid.addEventListener("click", function (event) {
    socket.emit("answerAction", { chosenAction: "foreignAid" });
  });

  coup.addEventListener("click", function (event) {
    socket.emit("answerAction", { chosenAction: "coup" });
  });

  tax.addEventListener("click", function (event) {
    socket.emit("answerAction", { chosenAction: "tax" });
  });

  assassinate.addEventListener("click", function (event) {
    socket.emit("answerAction", { chosenAction: "assassinate" });
  });

  exchange.addEventListener("click", function (event) {
    socket.emit("answerAction", { chosenAction: "exchange" });
  });

  steal.addEventListener("click", function (event) {
    socket.emit("answerAction", { chosenAction: "steal" });
  });

  socket.on("addBalance", function (arg) {
    const myBalance = document.querySelector(
      `#player-${arg.userID}-info #balance`
    );
    msgBox.innerHTML += `User ${arg.userID} balance add ${arg.amount}<br>`;
    myBalance.textContent = arg.balance;
  });

  socket.on("askForAction", function (arg) {
    actionButton.forEach((button) => {
      button.disabled = !(arg.userID == myId);
    });
  });

  socket.on("askForCounterAction", function (arg) {
    if (arg.userID == myId) {
      counteractionButton.forEach((button) => {
        button.disabled = !(arg.userID == myId);
      });
    }
  });
  socket.on("askForChallenge", function (arg) {
    if (arg.userID == myId) {
      challengeButton.forEach((button) => {
        button.disabled = !(arg.userID == myId);
      });
    }
  });

  /* ------------------------------- finish init ------------------------------ */
  socket.emit("gameInitFinished");
}
