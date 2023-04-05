import { Session, SessionData } from "express-session";
import socket from "socket.io";
import { Game, createIoFunction } from "./coupGame";
import { getGameById } from "./coupGameList";
import "../middleware";

type GameJson = {
  my: { id: string; hand: number[]; faceUp: number[]; balance: number };
  otherPlayerList: { id: string; balance: number; status: string }[];
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
    let my = game.playerList.find((player) => player.userId === myId);
    if (!my) {
      throw new Error("player not found");
    }
    socket.join(game.id);
    let gameJson: GameJson = {
      my: {
        id: my.userId,
        hand: my.getHand(),
        faceUp: my.getFaceUp(),
        balance: my.getBalance(),
      },
      otherPlayerList: [],
    };
    let i = 0;
    for (let player of game.playerList) {
      if (player.userId !== myId) {
        gameJson.otherPlayerList[i] = {
          id: player.userId,
          balance: player.getBalance(),
          status: player.getStatus(),
        };
        i++;
      }
    }
    socket.emit("ansGameInit", gameJson);
    socket.on("gameInitFinished", () => {
      game.sendState();
    });

    socket.on("answerAction", answerAction(game));
    socket.on("answerCounteraction", answerCounteraction(game));
    socket.on("answerChallenge", answerChallenge(game));
    socket.on("answerCard", answerCard(game));
    socket.on("answerTarget", answerTarget(game));
  });
}
