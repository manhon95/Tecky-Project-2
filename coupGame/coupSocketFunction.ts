import { Session, SessionData } from "express-session";
import socket from "socket.io";
import { Game, createIoFunction } from "./coupGame";

type GameJson = {
  my: { id: string; hand: number[]; balance: number };
  otherPlayerList: { id: string; balance: number }[];
};

const { answerAction } = createIoFunction();

export function addCoupSocketFunction(
  io: socket.Server,
  socket: socket.Socket,
  gameList: object, //gameList example: {game.id:gameObj}
  session: Session & Partial<SessionData>
) {
  if (!session.user || !session.user.id) {
    throw new Error("User not found");
  }
  let myId = session.user.id;
  if (!session.socketGameMap) {
    throw new Error("SocketGameMap not found");
  }
  let game = gameList[session.socketGameMap[socket.id]];
  socket.on("askGameInit", () => {
    console.log(game.getPlayerIndexById(myId));
    socket.join(game.id);
    let gameJson: GameJson = {
      my: {
        id: game.playerList[game.getPlayerIndexById(myId)].userID,
        hand: game.playerList[game.getPlayerIndexById(myId)].getHand(),
        balance: game.playerList[game.getPlayerIndexById(myId)].getBalance(),
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
  });

  socket.on("gameInitFinished", () => {
    game.sendGameState();
  });

  socket.on("answerAction", answerAction(game));
}
