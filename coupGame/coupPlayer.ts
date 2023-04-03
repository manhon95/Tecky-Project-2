import { Socket } from "socket.io";
import { Game } from "./coupGame";

export class Player {
  private faceUp: number[] = [];
  private status: string = "inGame";
  private sockets: Socket | undefined = undefined;
  constructor(
    public readonly userID: string,
    private balance: number,
    private hand: number[],
    private game: Game
  ) {}

  setSocket(inputSocket: Socket) {
    this.sockets = inputSocket;
  }

  addBalance(amount: number) {
    this.balance += amount;
    this.game.io.emit("addBalance", {
      userID: this.userID,
      balance: this.balance,
      amount: amount,
    });
    this.game.io.emit(
      "message",
      `User ${this.userID} balance add ${amount}<br>`
    );
  }

  lowerBalance(amount: number) {
    this.balance -= amount;
    this.game.io.emit("lowerBalance", {
      userID: this.userID,
      balance: this.balance,
      amount: amount,
    });
    this.game.io.emit(
      "message",
      `User ${this.userID} balance lower ${amount}<br>`
    );
  }

  getStatus(): string {
    return this.status;
  }

  getBalance(): number {
    return this.balance;
  }

  getHand(): number[] {
    return this.hand;
  }

  addHand(newCards: number[]): void {
    this.hand = this.hand.concat(newCards);
    this.game.io.emit("updateCard", {
      userID: this.userID,
      hand: this.getHand(),
      faceUp: this.getFaceUp(),
    });
  }

  getFaceUp(): number[] {
    return this.faceUp;
  }

  discardHand(chosenCards: number): void {
    this.hand = this.hand.filter((card) => card != chosenCards);
    this.game.io.emit("updateCard", {
      userID: this.userID,
      hand: this.getHand(),
      faceUp: this.getFaceUp(),
    });
  }

  loseInfluence(chosenCard: number) {
    if (!this.hand.includes(chosenCard)) {
      throw new Error("Invalid cards");
    }
    this.faceUp = this.faceUp.concat(
      this.hand.splice(this.hand.indexOf(chosenCard), 1)
    );
    this.game.io.emit("loseInfluence", {
      userID: this.userID,
      chosenCard: chosenCard.toString(),
    });
    if (this.getHand().length == 0) {
      this.status = "outGame";
      this.game.io.emit("outGame", {
        userID: this.userID,
      });
      this.game.io.emit("message", `User ${this.userID} Out Game!<br>`);
    }
  }
}
