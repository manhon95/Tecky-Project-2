import { Card, cardTypes, createCard } from "./card";

const cardsPerDeck = 3;

function createDeck() {
  let deck: Card[] = [];
  let cardId = 0;
  for (let type of cardTypes) {
    for (let card = 0; card < cardsPerDeck; card++) {
      deck.push(createCard(cardId++, type));
    }
  }
  return deck;
}

class Game {
  private deck: Card[] = createDeck();
  private activePlayer: string;
  constructor(
    public readonly playerIp: string[],
    public readonly gameId: number
  ) {
    this.activePlayer =
      this.playerIp[Math.floor(Math.random() * this.playerIp.length)];
  }

  handleActiveAbility() {
    let haveChallenge = false;
    resolveChallenge();
    if (haveChallenge) {
    } else {
      resolveFor;
    }
  }
}
