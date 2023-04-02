const socket = io();

const income = document.querySelector("#income");
const foreignAid = document.querySelector("#foreign-aid");
const coup = document.querySelector("#coup");
const tax = document.querySelector("#tax");
const assassinate = document.querySelector("#assassinate");
const exchange = document.querySelector("#exchange");
const steal = document.querySelector("#steal");

const msgBox = document.querySelector("#message-box");
const myCardBoard = document.querySelector("#my #card-board");
const CardNode = document.querySelector(`#my .card`);
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
  const myInfo = document.querySelector("#my");
  const myId = game.my.id;
  let chooseCards = false;
  let chooseTargets = false;
  myInfo.id = `player-${myId}`;
  loadCards(game.my.hand, game.my.faceUp);

  const myBalance = document.querySelector(`#player-${myId} #balance`);
  function changeCardStyle(cardNode) {
    if (cardNode.getAttribute("location") == "hand") {
      if (chooseCards) {
        cardNode.style.border = "4px solid DodgerBlue";
      } else {
        cardNode.style.border = "4px solid black";
      }
    } else {
      cardNode.style.border = "4px solid red";
    }
  }

  myBalance.textContent = game.my.balance;

  function loadCards(cardList, faceUpList) {
    while (myCardBoard.firstChild) {
      myCardBoard.removeChild(myCardBoard.lastChild);
    }
    //myCardBoard.textContent = ''
    for (let card of cardList) {
      let newCardNode = CardNode.cloneNode(true);
      myCardBoard.appendChild(newCardNode);
      newCardNode.src = cardPathMap[Math.floor(parseInt(card) / 3)];
      newCardNode.setAttribute("cardNo", `${card}`);
      newCardNode.setAttribute("location", `hand`);
      changeCardStyle(newCardNode);
      newCardNode.addEventListener("click", (event) => {
        if (chooseCards) {
          socket.emit("answerCard", {
            chosenCard: parseInt(event.target.getAttribute("cardNo")),
          });
          chooseCards = false;
          document.querySelectorAll(`#player-${myId} .card`).forEach((card) => {
            changeCardStyle(card);
          });
        }
      });
    }
    for (let card of faceUpList) {
      let newCardNode = CardNode.cloneNode(true);
      myCardBoard.appendChild(newCardNode);
      newCardNode.src = cardPathMap[Math.floor(parseInt(card) / 3)];
      newCardNode.setAttribute("cardNo", `${card}`);
      newCardNode.setAttribute("location", `face-up`);
      changeCardStyle(newCardNode);
    }
  }
  /* ------------------------------ Player 2 Info ----------------------------- */
  let playersInfo = document.querySelector("#players-1");
  playersInfo.id = `player-${game.otherPlayerList[0].id}`;
  playersInfo.setAttribute("user-id", `${game.otherPlayerList[0].id}`);
  document.querySelector(
    `#player-${game.otherPlayerList[0].id} #balance`
  ).textContent = game.otherPlayerList[0].balance;
  /* ---------------------------- Other Player Info --------------------------- */
  for (let i = 1; i < game.otherPlayerList.length; i++) {
    playersInfo = playersInfo.cloneNode(true);
    playersInfo.id = `player-${game.otherPlayerList[i].id}`;
    playersInfo.setAttribute("user-id", `${game.otherPlayerList[i].id}`);
    document.getElementById("players-info-board").appendChild(playersInfo);
    document.querySelector(
      `#player-${game.otherPlayerList[i].id} #balance`
    ).textContent = game.otherPlayerList[i].balance;
  }

  function changePlayerStyle(playerNode) {
    if (playerNode.getAttribute("location") != "outOfGame") {
      if (chooseTargets) {
        playerNode.style.border = "4px solid DodgerBlue";
      } else {
        playerNode.style.border = "1px solid black";
      }
    } else {
      playerNode.style.border = "4px solid red";
    }
  }

  const otherPlayer = document.querySelectorAll(".other");
  otherPlayer.forEach((player) => {
    player.addEventListener("click", (event) => {
      if (chooseTargets) {
        socket.emit("answerTarget", {
          targetId: event.currentTarget.getAttribute("user-id"),
        });
        chooseTargets = false;
        otherPlayer.forEach((player) => {
          changePlayerStyle(player);
        });
      }
    });
    player.setAttribute("location", `in-game`);
    changePlayerStyle(player);
  });
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
    const myBalance = document.querySelector(`#player-${arg.userID} #balance`);
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

  socket.on("askCard", function (arg) {
    if (arg.userID == myId) {
      chooseCards = true;
      loadCards(arg.hand, arg.faceUp);
    }
  });

  socket.on("askTarget", function (arg) {
    chooseTargets = arg.userID == myId;
    otherPlayer.forEach((player) => {
      changePlayerStyle(player);
    });
  });

  socket.on("loseInfluence", function (arg) {
    if (arg.userID == myId) {
      document
        .querySelector(`[cardNo = "${arg.chosenCard}"]`)
        .setAttribute("location", "face-up");
      document.querySelectorAll(`#player-${myId} .card`).forEach((card) => {
        changeCardStyle(card);
      });
    } else {
      const remainHand = document.querySelector(
        `#player-${arg.userID} [location="hand"]`
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
