import { Socket } from "socket.io";
import { Game } from "./coupGame";

export class Player {
  private faceUp: number[] = [];
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
  }

  lowerBalance(amount: number) {
    this.balance -= amount;
    this.game.io.emit("lowerBalance", {
      userID: this.userID,
      balance: this.balance,
      amount: amount,
    });
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
  }
}
