/* --------------------------------- Logger --------------------------------- */
//const logger = log4javascript.getDefaultLogger();
const logger = log4javascript.getNullLogger();
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
const actionRecordBoard = document.querySelector("#record-board");
const actionRecordNode = document.querySelector(".action-record");
const myCardBoard = document.querySelector("#my #card-board");
const myBalance = document.querySelector(`#my #balance`);
const CardNode = document.querySelector(`#my .card`);
const myInfo = document.querySelector("#my");
const actionButton = document.querySelectorAll("#turn-button-board .btn");
const actionButtonOffcanvas = new bootstrap.Offcanvas(
  document.querySelector("#turn-button-offcanvas")
);
const counteractionButton = document.querySelectorAll(
  "#counteraction-button-board .btn"
);
const counteractionButtonOffcanvas = new bootstrap.Offcanvas(
  document.querySelector("#counteraction-button-offcanvas")
);
const challengeButton = document.querySelectorAll(
  "#challenge-button-board .btn"
);
const challengeButtonOffcanvas = new bootstrap.Offcanvas(
  document.querySelector("#challenge-button-offcanvas")
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
const userIdNameMap = {};
const cardIdNameMap = {
  1: "Ambassador",
  2: "Ambassador",
  3: "Ambassador",
  4: "Assassin",
  5: "Assassin",
  6: "Assassin",
  7: "Captain",
  8: "Captain",
  9: "Captain",
  10: "Contessa",
  11: "Contessa",
  12: "Contessa",
  13: "Duke",
  14: "Duke",
};
const actionNameMap = {
  income: "Income",
  "foreign-aid": "Foreign Aid",
  coup: "Coup",
  tax: "Tax",
  assassinate: "Assassinate",
  exchange: "Exchange",
  steal: "Steal",
};
const counteractionButtonResponse = { counter: true, "no-counter": false };
const challengeButtonResponse = {
  challenge: true,
  "no-challenge": false,
};
let myId;
let chooseCards = false;
let chooseTargets = false;
let latestRecord;

init();

function init() {
  socket.emit("askCoupInit", { game: { id: gameId } });
  socket.on("ansCoupInit", function (game) {
    /* --------------------------------- My Info -------------------------------- */
    myId = game.my.id;
    userIdNameMap[game.my.id] = game.my.name;
    logger.info(`My ID: ${myId}, Game ID: ${gameId}`);
    myInfo.id = `player-${myId}`;
    /* ---------------------------- Other Player Info --------------------------- */
    while (playersInfoBoard.firstChild) {
      playersInfoBoard.removeChild(playersInfoBoard.lastChild);
    }
    for (let player of game.otherPlayerList) {
      const newPlayerNode = playerNode.cloneNode(true);
      playersInfoBoard.appendChild(newPlayerNode);
      newPlayerNode.id = `player-${player.id}`;
      userIdNameMap[player.id] = player.name;
      newPlayerNode.setAttribute("user-id", `${player.id}`);
      newPlayerNode.setAttribute("state", `${player.state}`);
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
    }
    /* ----------------------------- Load Game Board ---------------------------- */
    loadGameBoard(game);
    /* ------------------------------- Button Init ------------------------------ */
    actionButton.forEach((button) => {
      button.disabled = true;
      button.addEventListener("click", function () {
        actionButtonOffcanvas.hide();
        socket.emit("answerAction", { chosenAction: button.id });
        actionButton.forEach((button) => {
          button.disabled = true;
        });
      });
    });

    counteractionButton.forEach((button) => {
      button.disabled = true;
      button.addEventListener("click", function () {
        counteractionButtonOffcanvas.hide();
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
        challengeButtonOffcanvas.hide();
        socket.emit("answerChallenge", {
          challenge: challengeButtonResponse[button.id],
        });
        challengeButton.forEach((button) => {
          button.disabled = true;
        });
      });
    });

    /* ----------------------------- Action Records ----------------------------- */
    if (game.transitionRecords) {
      logger.info(
        `transitionRecords found: ${JSON.stringify(game.transitionRecords)}`
      );
      loadActionRecords(game.transitionRecords);
    }
    /* ------------------------------ socket event ------------------------------ */
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
    if (arg.userId == myId) {
      actionButtonOffcanvas.show();
    }
    actionButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });

  socket.on("askCounterAction", function (arg) {
    logger.debug(`askCounterAction called with ${JSON.stringify(arg)}`);
    if (arg.userId == myId) {
      counteractionButtonOffcanvas.show();
    }
    counteractionButton.forEach((button) => {
      button.disabled = !(arg.userId == myId);
    });
  });
  socket.on("askChallenge", function (arg) {
    logger.debug(`askChallenge called with ${JSON.stringify(arg)}`);
    if (arg.userId == myId) {
      challengeButtonOffcanvas.show();
    }
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
        remainHand.src =
          cardPathMap[Math.floor((parseInt(arg.chosenCard) - 1) / 3)];
      }
    }
  });

  socket.on("addRecord", function (arg) {
    logger.debug(`addRecord called with ${JSON.stringify(arg)}`);
    createActionRecord(arg);
  });

  socket.on("addSubRecord", function (arg) {
    logger.debug(`addRecord called with ${JSON.stringify(arg)}`);
    createSubRecord(arg.msg);
  });

  socket.on("answerRecordSnapshot", function (arg) {
    logger.debug(`answerRecordSnapshot called with ${JSON.stringify(arg)}`);
    loadGameBoard(arg);
  });

  socket.on("finish", function (arg) {
    logger.debug(`finish called with ${JSON.stringify(arg)}`);
    location.href = `/user/room?room=${arg.gameName}`;
  });
}

function loadGameBoard(game) {
  /* --------------------------------- My Info -------------------------------- */
  loadCards(game.my.hand, game.my.faceUp);
  myBalance.textContent = game.my.balance;

  /* ---------------------------- Other Player Info --------------------------- */
  loadPlayers(game.otherPlayerList);
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
  for (let player of playerList) {
    document.querySelector(`#player-${player.id} #balance`).textContent =
      player.balance;
    document.querySelector(`#player-${player.id} #name`).textContent =
      player.name;
    changePlayerStyle(document.querySelector(`#player-${player.id}`));
    document
      .querySelectorAll(`#player-${player.id} .card`)
      .forEach((cardNode) => {
        cardNode.setAttribute("location", "hand");
        cardNode.src = "/img/cardBack.jpg";
      });
    for (let cardId of player.faceUp) {
      const remainHand = document.querySelector(
        `#player-${player.id} [location="hand"]`
      );
      if (remainHand) {
        remainHand.setAttribute("location", "face-up");
        remainHand.src = cardPathMap[Math.floor((parseInt(cardId) - 1) / 3)];
      }
    }
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
/* --------------------------- Load Action Record --------------------------- */
function loadActionRecords(recordList) {
  while (actionRecordBoard.firstChild) {
    actionRecordBoard.removeChild(actionRecordBoard.lastChild);
  }
  for (let record of recordList) {
    createActionRecord(record);
    if (record.subMsg) {
      record.subMsg.forEach((msg) => {
        createSubRecord(msg);
      });
    }
  }
}

function createActionRecord(record) {
  logger.debug(`record: ${JSON.stringify(record)}`);
  const newActionRecordNode = actionRecordNode.cloneNode(true);
  actionRecordBoard.appendChild(newActionRecordNode);
  newActionRecordNode.id = `record-${record.id}`;
  newActionRecordNode.innerHTML = formatMessage(record.msg);
  newActionRecordNode.setAttribute("currentAction", true);
  newActionRecordNode.addEventListener("click", (event) => {
    document
      .querySelectorAll(".action-record")
      .forEach((recordNode) => recordNode.classList.remove("active"));
    newActionRecordNode.classList.add("active");
    socket.emit("askRecordSnapshot", { recordId: record.id });
  });
  latestRecord = newActionRecordNode;
}

function formatMessage(message) {
  Object.keys(userIdNameMap).forEach((key) => {
    message = message.replace(
      `[p${key}]`,
      `<i class="fa-solid fa-chess-pawn fa-bounce"></i> ${userIdNameMap[key]}`
    );
  });
  Object.keys(cardIdNameMap).forEach((key) => {
    message = message.replace(
      `[c${key}]`,
      `<i class="fa-solid fa-heart fa-flip"></i> ${cardIdNameMap[key]}`
    );
  });
  Object.keys(actionNameMap).forEach((key) => {
    message = message.replace(`[a${key}]`, actionNameMap[key]);
  });
  message = message.replace(`[b]`, `<i class="fa-solid fa-coins"></i>`);
  return message;
}

function createSubRecord(msg) {
  latestRecord.innerHTML += `<br> - ${formatMessage(msg)}`;
}
