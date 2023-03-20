import { Card } from "./card";

export class Player {
  private hand: Card[] = [];
  constructor(public readonly ip: string, private balance: number) {}

  addBalance(amount: number) {
    this.balance += amount;
  }

  lowerBalance(amount: number) {
    this.balance -= amount;
  }

  getBalance() {
    return this.balance;
  }

  getHand() {
    return this.hand;
  }

  drawCard(newCard: Card) {
    this.hand.push(newCard);
  }
}
