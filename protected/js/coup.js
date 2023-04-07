/* --------------------------------- Logger --------------------------------- */
const logger = log4javascript.getDefaultLogger();
// const logger = log4javascript.getNullLogger();
/* -------------------------------- DOM -------------------------------- */
const income = document.querySelector("#income");
const foreignAid = document.querySelector("#foreign-aid");
const coup = document.querySelector("#coup");
const tax = document.querySelector("#tax");
const assassinate = document.querySelector("#assassinate");
const exchange = document.querySelector("#exchange");
const steal = document.querySelector("#steal");
const playersInfoBoard = document.querySelector("#players-info-board");
const playerNode = document.querySelector("#players-1");
const msgBox = document.querySelector("#message-box");
const myCardBoard = document.querySelector("#my #card-board");
const myBalance = document.querySelector(`#my #balance`);
const CardNode = document.querySelector(`#my .card`);
const myInfo = document.querySelector("#my");
const actionButton = document.querySelectorAll("#turn-button-board .btn");
const counteractionButton = document.querySelectorAll(
  "#counteraction-button-board .btn"
);
const challengeButton = document.querySelectorAll(
  "#challenge-button-board .btn"
);
/* --------------------------------- Utils; --------------------------------- */
const socket = io();
const url = new URL(location.href);
const searchParams = new URLSearchParams(url.search);
/* ---------------------------------- Game ---------------------------------- */
const gameId = searchParams.get("game");
const cardPathMap = [
  "/img/ambassador.jpg",
  "/img/assassin.jpg",
  "/img/captain.jpg",
  "/img/contessa.jpg",
  "/img/duke.jpg",
];
const counteractionButtonResponse = { counter: true, "no-counter": false };
const challengeButtonResponse = {
  challenge: true,
  "no-challenge": false,
};
let chooseCards = false;
let chooseTargets = false;

init();

function init() {
  socket.emit("askCoupInit", { game: { id: gameId } });
  socket.on("ansCoupInit", function (game) {
    console.log("init");
    /* --------------------------------- My Info -------------------------------- */
    const myId = game.my.id;
    logger.info(`My ID: ${myId}, Game ID: ${gameId}`);
    myInfo.id = `player-${myId}`;
    loadCards(game.my.hand, game.my.faceUp);
    myBalance.textContent = game.my.balance;

    /* ---------------------------- Other Player Info --------------------------- */

    loadPlayers(game.otherPlayerList);

    /* ------------------------------- Button Init ------------------------------ */
    actionButton.forEach((button) => {
      button.disabled = true;
      button.addEventListener("click", function () {
        socket.emit("answerAction", { chosenAction: button.id });
        actionButton.forEach((button) => {
          button.disabled = true;
        });
      });
    });

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
    socketEventInit(socket, myId);
    /* ------------------------------- finish init ------------------------------ */
    logger.debug(`Finish init`);
    socket.emit("CoupInitFinished");
  });
}

function socketEventInit(socket, myId) {
  socket.on("updateBalance", function (arg) {
    logger.debug(`updateBalance called with ${JSON.stringify(arg)}`);
    document.querySelector(`#player-${arg.userId} #balance`).textContent =
      arg.balance;
  });

  socket.on("askAction", function (arg) {
    logger.debug(`askAction called with ${JSON.stringify(arg)}`);
    actionButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });

  socket.on("askCounterAction", function (arg) {
    logger.debug(`askCounterAction called with ${JSON.stringify(arg)}`);
    counteractionButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });
  socket.on("askChallenge", function (arg) {
    logger.debug(`askChallenge called with ${JSON.stringify(arg)}`);
    challengeButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });

  socket.on("askCard", function (arg) {
    logger.debug(`askCard called with ${JSON.stringify(arg)}`);
    if (arg.userId == myId) {
      chooseCards = true;
      loadCards(arg.hand, arg.faceUp);
    }
  });

  socket.on("askTarget", function (arg) {
    logger.debug(`askTarget called with ${JSON.stringify(arg)}`);
    chooseTargets = arg.userId == myId;
    document.querySelectorAll(`.other`).forEach((player) => {
      changePlayerStyle(player);
    });
  });

  socket.on("updateCard", function (arg) {
    logger.debug(`updateCard called with ${JSON.stringify(arg)}`);
    if (arg.userId == myId) {
      loadCards(arg.hand, arg.faceUp);
    }
  });

  socket.on("outGame", function (arg) {
    logger.debug(`outGame called with ${JSON.stringify(arg)}`);
    let node = document.querySelector(`#player-${arg.userId}`);
    node.setAttribute("state", "outGame");
    changePlayerStyle(node);
  });

  socket.on("loseInfluence", function (arg) {
    logger.debug(`loseInfluence called with ${JSON.stringify(arg)}`);
    if (arg.userId == myId) {
      document
        .querySelector(`[cardNo = "${arg.chosenCard}"]`)
        .setAttribute("location", "face-up");
      document.querySelectorAll(`#player-${myId} .card`).forEach((card) => {
        changeCardStyle(card);
      });
    } else {
      const remainHand = document.querySelector(
        `#player-${arg.userId} [location="hand"]`
      );
      if (remainHand) {
        remainHand.setAttribute("location", "face-up");
        remainHand.src = cardPathMap[Math.floor(parseInt(arg.chosenCard) / 3)];
      }
    }
  });

  socket.on("message", function (arg) {
    logger.debug(`message called with ${JSON.stringify(arg)}`);
    msgBox.innerHTML += arg;
  });
  socket.on("finish", function (arg) {
    logger.debug(`finish called with ${JSON.stringify(arg)}`);
    msgBox.innerHTML += `User ${arg.userId} Win<br>`;
    location.href = `/user/room?room=${arg.gameName}`;
  });
}
/* ------------------------------- Load Cards ------------------------------- */
function loadCards(cardList, faceUpList) {
  let nodeClass =
    cardList.length + faceUpList.length > 2
      ? "card img-fluid col-2"
      : "card img-fluid col-5";
  while (myCardBoard.firstChild) {
    myCardBoard.removeChild(myCardBoard.lastChild);
  }
  //myCardBoard.textContent = ''
  for (let card of cardList) {
    const newCardNode = CardNode.cloneNode(true);
    myCardBoard.appendChild(newCardNode);
    newCardNode.src = cardPathMap[Math.floor((parseInt(card) - 1) / 3)];
    newCardNode.className = nodeClass;
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
    const newCardNode = CardNode.cloneNode(true);
    myCardBoard.appendChild(newCardNode);
    newCardNode.src = cardPathMap[Math.floor((parseInt(card) - 1) / 3)];
    newCardNode.className = nodeClass;
    newCardNode.setAttribute("cardNo", `${card}`);
    newCardNode.setAttribute("location", `face-up`);
    changeCardStyle(newCardNode);
  }
}
/* ---------------------------- Change Card Style --------------------------- */
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
/* ------------------------------ Load Players ------------------------------ */
function loadPlayers(playerList) {
  while (playersInfoBoard.firstChild) {
    playersInfoBoard.removeChild(playersInfoBoard.lastChild);
  }
  for (let player of playerList) {
    const newPlayerNode = playerNode.cloneNode(true);
    playersInfoBoard.appendChild(newPlayerNode);
    newPlayerNode.id = `player-${player.id}`;
    newPlayerNode.setAttribute("user-id", `${player.id}`);
    newPlayerNode.setAttribute("state", `${player.state}`);
    document.querySelector(`#player-${player.id} #balance`).textContent =
      player.balance;
    document.querySelector(`#player-${player.id} #name`).textContent =
      player.id;
    if (player.state == "inGame") {
      newPlayerNode.addEventListener("click", (event) => {
        if (
          chooseTargets &&
          event.currentTarget.getAttribute("state") == "inGame"
        ) {
          socket.emit("answerTarget", {
            targetId: event.currentTarget.getAttribute("user-id"),
          });
          chooseTargets = false;
          document.querySelectorAll(`.other`).forEach((player) => {
            changePlayerStyle(player);
          });
        }
      });
    }
    changePlayerStyle(newPlayerNode);
  }
}
/* --------------------------- Change Player Style -------------------------- */
function changePlayerStyle(playerNode) {
  if (playerNode.getAttribute("state") != "outGame") {
    if (chooseTargets) {
      playerNode.style.border = "4px solid DodgerBlue";
    } else {
      playerNode.style.border = "1px solid black";
    }
  } else {
    playerNode.style.border = "4px solid red";
  }
}
