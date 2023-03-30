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
    this.hand.concat(newCards);
  }

  discardHand(chosenCards: number[]): void {
    this.hand.filter((card) => !chosenCards.includes(card));
  }

  loseInfluence(chosenCards: number[]) {
    if (!chosenCards.every((card) => this.hand.includes(card))) {
      throw new Error("Invalid cards");
    }
    for (let card of chosenCards) {
      this.faceUp.concat(this.hand.splice(this.hand.indexOf(card), 1));
    }
    return;
  }
}
