import { Session, SessionData } from "express-session";
import socket from "socket.io";
import { Game, createIoFunction } from "./coupGame";
import { getGameById } from "./coupGameList";
import "../session-middleWare";

type GameJson = {
  my: { id: string; hand: number[]; faceUp: number[]; balance: number };
  otherPlayerList: { id: string; balance: number }[];
};

const {
  answerAction,
  answerCounteraction,
  answerChallenge,
  answerCard,
  answerTarget,
} = createIoFunction();

export function addCoupSocketFunction(
  io: socket.Server,
  socket: socket.Socket,
  session: Session & Partial<SessionData>
) {
  socket.on("askGameInit", (arg) => {
    if (!session.user || !session.user.id) {
      throw new Error("User not found");
    }
    let myId = session.user.id;
    let game: Game = getGameById(arg.game.id);
    let my = game.playerList[game.getPlayerIndexById(myId)];
    socket.join(game.id);
    let gameJson: GameJson = {
      my: {
        id: my.userID,
        hand: my.getHand(),
        faceUp: my.getFaceUp(),
        balance: my.getBalance(),
      },
      otherPlayerList: [],
    };
    let i = 0;
    for (let player of game.playerList) {
      if (player.userID !== myId) {
        gameJson.otherPlayerList[i] = {
          id: player.userID,
          balance: player.getBalance(),
        };
        i++;
      }
    }
    socket.emit("ansGameInit", gameJson);
    socket.on("gameInitFinished", () => {
      game.sendGameState();
    });

    socket.on("answerAction", answerAction(game));
    socket.on("answerCounteraction", answerCounteraction(game));
    socket.on("answerChallenge", answerChallenge(game));
    socket.on("answerCard", answerCard(game));
    socket.on("answerTarget", answerTarget(game));
  });
}
