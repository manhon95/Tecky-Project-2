const socket = io();

const income = document.querySelector("#income");
const foreignAid = document.querySelector("#foreign-aid");
const coup = document.querySelector("#coup");
const tax = document.querySelector("#tax");
const assassinate = document.querySelector("#assassinate");
const exchange = document.querySelector("#exchange");
const steal = document.querySelector("#steal");

const msgBox = document.querySelector("#message-box");
const url = new URL(location.href);
const searchParams = new URLSearchParams(url.search);
const gameId = searchParams.get("game");

const cardPathMap = [
  "/img/ambassador.jpg",
  "/img/assassin.jpg",
  "/img/captain.jpg",
  "/img/contessa.jpg",
  "/img/duke.jpg",
];
socket.emit("askGameInit", { game: { id: gameId } });
socket.on("ansGameInit", function (game) {
  init(game);
});

function init(game) {
  /* --------------------------------- My Info -------------------------------- */
  const myInfo = document.querySelector("#my-info");
  let myId = game.my.id;
  let chooseCards = false;
  myInfo.id = `player-${game.my.id}-info`;
  // const myCards = document.querySelectorAll(`#player-${game.my.id}-info .card`);
  const myHand = document.querySelectorAll(
    `#player-${game.my.id}-info [location="hand"]`
  );
  for (let i = 0; i < myHand.length; i++) {
    myHand[i].src = cardPathMap[Math.floor(parseInt(game.my.hand[i]) / 3)];
    myHand[i].setAttribute("cardNo", `${game.my.hand[i]}`);
  }

  // const myCard1 = document.querySelector(`#player-${game.my.id}-info #card-1`);
  // const myCard2 = document.querySelector(`#player-${game.my.id}-info #card-2`);
  const myBalance = document.querySelector(
    `#player-${game.my.id}-info #balance`
  );

  function changeCardsStyle(card) {
    if (card.getAttribute("location") == "hand") {
      if (chooseCards) {
        card.style.border = "4px solid DodgerBlue";
      } else {
        card.style.border = "4px solid black";
      }
    } else {
      card.style.border = "4px solid red";
    }
  }
  myHand.forEach((card) => {
    changeCardsStyle(card);
    card.addEventListener("click", (event) => {
      if (chooseCards) {
        socket.emit("answerCard", {
          loseCard: parseInt(event.target.getAttribute("cardNo")),
        });
        chooseCards = false;
        myHand.forEach((card) => {
          changeCardsStyle(card);
        });
      }
    });
  });
  // myCard1.src = cardPathMap[Math.floor(parseInt(game.my.hand[0]) / 3)];
  // myCard1.id = game.my.hand[0];
  // myCard2.src = cardPathMap[Math.floor(parseInt(game.my.hand[1]) / 3)];
  // myCard2.id = game.my.hand[1];
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
    button.addEventListener("click", function () {
      socket.emit("answerAction", { chosenAction: button.id });
      actionButton.forEach((button) => {
        button.disabled = true;
      });
    });
  });
  const counteractionButton = document.querySelectorAll(
    "#counteraction-button-board .btn"
  );
  let counteractionButtonResponse = { counter: true, "no-counter": false };
  counteractionButton.forEach((button) => {
    button.disabled = true;
    button.addEventListener("click", function () {
      socket.emit("answerCounteraction", {
        counteraction: counteractionButtonResponse[button.id],
      });
      counteractionButton.forEach((button) => {
        button.disabled = true;
      });
    });
  });

  const challengeButton = document.querySelectorAll(
    "#challenge-button-board .btn"
  );
  let challengeButtonResponse = { challenge: true, "no-challenge": false };
  challengeButton.forEach((button) => {
    button.disabled = true;
    button.addEventListener("click", function () {
      socket.emit("answerChallenge", {
        challenge: challengeButtonResponse[button.id],
      });
      challengeButton.forEach((button) => {
        button.disabled = true;
      });
    });
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
    counteractionButton.forEach((button) => {
      button.disabled = !(arg.userID == myId);
    });
  });
  socket.on("askForChallenge", function (arg) {
    challengeButton.forEach((button) => {
      button.disabled = !(arg.userID == myId);
    });
  });

  socket.on("askLoseInfluence", function (arg) {
    chooseCards = arg.userID == myId;
    myHand.forEach((card) => {
      changeCardsStyle(card);
    });
  });

  socket.on("loseInfluence", function (arg) {
    console.log(arg);
    if (arg.userID == myId) {
      document
        .querySelector(`[cardNo = "${arg.chosenCard}"]`)
        .setAttribute("location", "face-up");
      myHand.forEach((card) => {
        changeCardsStyle(card);
      });
    } else {
      const remainHand = document.querySelector(
        `#player-${arg.userID}-info [location="hand"]`
      );
      if (remainHand) {
        remainHand.setAttribute("location", "face-up");
        remainHand.src = cardPathMap[Math.floor(parseInt(arg.chosenCard) / 3)];
      }
    }
  });

  /* ------------------------------- finish init ------------------------------ */
  socket.emit("gameInitFinished");
}
