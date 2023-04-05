const socket = io();

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

  /* ---------------------------- Other Player Info --------------------------- */

  loadPlayers(game.otherPlayerList);

  function loadPlayers(playerList) {
    while (playersInfoBoard.firstChild) {
      playersInfoBoard.removeChild(playersInfoBoard.lastChild);
    }
    for (let player of playerList) {
      const newPlayerNode = playerNode.cloneNode(true);
      playersInfoBoard.appendChild(newPlayerNode);
      newPlayerNode.id = `player-${player.id}`;
      newPlayerNode.setAttribute("user-id", `${player.id}`);
      newPlayerNode.setAttribute("status", `${player.status}`);
      document.querySelector(`#player-${player.id} #balance`).textContent =
        player.balance;
      document.querySelector(`#player-${player.id} #name`).textContent =
        player.id;
      if (player.status == "inGame") {
        newPlayerNode.addEventListener("click", (event) => {
          if (
            chooseTargets &&
            event.currentTarget.getAttribute("status") == "inGame"
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

  function changePlayerStyle(playerNode) {
    if (playerNode.getAttribute("status") != "outGame") {
      if (chooseTargets) {
        playerNode.style.border = "4px solid DodgerBlue";
      } else {
        playerNode.style.border = "1px solid black";
      }
    } else {
      playerNode.style.border = "4px solid red";
    }
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
    document.querySelector(`#player-${arg.userId} #balance`).textContent =
      arg.balance;
  });

  socket.on("lowerBalance", function (arg) {
    document.querySelector(`#player-${arg.userId} #balance`).textContent =
      arg.balance;
  });

  socket.on("askForAction", function (arg) {
    actionButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });

  socket.on("outGame", function (arg) {
    let node = document.querySelector(`#player-${arg.userId}`);
    node.setAttribute("status", "outGame");
    changePlayerStyle(node);
  });

  socket.on("askForCounterAction", function (arg) {
    counteractionButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });
  socket.on("askForChallenge", function (arg) {
    challengeButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });

  socket.on("askCard", function (arg) {
    if (arg.userId == myId) {
      chooseCards = true;
      loadCards(arg.hand, arg.faceUp);
    }
  });

  socket.on("updateCard", function (arg) {
    if (arg.userId == myId) {
      loadCards(arg.hand, arg.faceUp);
    }
  });

  socket.on("askTarget", function (arg) {
    chooseTargets = arg.userId == myId;
    document.querySelectorAll(`.other`).forEach((player) => {
      changePlayerStyle(player);
    });
  });

  socket.on("loseInfluence", function (arg) {
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
    msgBox.innerHTML += arg;
  });
  socket.on("finish", function (arg) {
    msgBox.innerHTML += `User ${arg.userId} Win<br>`;
    location.href = `/user/room?room=${arg.gameName}`;
  });

  /* ------------------------------- finish init ------------------------------ */
  socket.emit("gameInitFinished");
}
