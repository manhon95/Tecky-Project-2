import { Socket } from "socket.io";
import { Game } from "./coupGame";

export type PlayerSave = {
  userId: string;
  state: string;
  hand: number[];
  faceUp: number[];
  balance: number;
};

export class Player {
  private state: string;
  private hand: number[];
  private faceUp: number[];
  private balance: number;
  private sockets: Socket | undefined = undefined;
  constructor(
    public readonly userId: string,
    private game: Game,
    saveData?: PlayerSave
  ) {
    this.state = saveData ? saveData.state : "inGame";
    this.hand = saveData ? saveData.hand : this.game.drawCard(2);
    this.faceUp = saveData ? saveData.faceUp : [];
    this.balance = saveData ? saveData.balance : 2;
  }

  setSocket(inputSocket: Socket) {
    this.sockets = inputSocket;
  }

  getState(): string {
    return this.state;
  }
  getHand(): number[] {
    return this.hand;
  }
  getFaceUp(): number[] {
    return this.faceUp;
  }
  getBalance(): number {
    return this.balance;
  }

  addBalance(amount: number) {
    this.balance += amount;
    this.game.ioEmit("updateBalance", {
      userId: this.userId,
      balance: this.balance,
    });
    this.game.ioEmit(
      "message",
      `User ${this.userId} balance add ${amount}<br>`
    );
  }

  lowerBalance(amount: number) {
    this.balance -= amount;
    this.game.ioEmit("updateBalance", {
      userId: this.userId,
      balance: this.balance,
    });
    this.game.ioEmit(
      "message",
      `User ${this.userId} balance lower ${amount}<br>`
    );
  }

  addHand(newCards: number[]): void {
    this.hand = this.hand.concat(newCards);
    this.game.ioEmit("updateCard", {
      userId: this.userId,
      hand: this.getHand(),
      faceUp: this.getFaceUp(),
    });
  }

  discardHand(chosenCards: number): void {
    this.hand = this.hand.filter((card) => card != chosenCards);
    this.game.ioEmit("updateCard", {
      userId: this.userId,
      hand: this.getHand(),
      faceUp: this.getFaceUp(),
    });
  }

  loseInfluence(chosenCard: number): void {
    if (!this.hand.includes(chosenCard)) {
      throw new Error(`Invalid cards: given ${chosenCard}, hand ${this.hand}`);
    }
    this.faceUp = this.faceUp.concat(
      this.hand.splice(this.hand.indexOf(chosenCard), 1)
    );
    this.game.ioEmit("loseInfluence", {
      userId: this.userId,
      chosenCard: chosenCard.toString(),
    });
    if (this.getHand().length == 0) {
      this.state = "outGame";
      this.game.ioEmit("outGame", {
        userId: this.userId,
      });
      this.game.ioEmit("message", `User ${this.userId} Out Game!<br>`);
    }
  }
}
