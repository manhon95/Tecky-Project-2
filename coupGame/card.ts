import { Player } from "./player";

export class Card {
  constructor(
    readonly cardId: number,
    readonly name: string,
    activeAbility: ActiveAbility | null
  ) {}
}

export const cardType = [
  "Ambassador",
  "Assassin",
  "Captain",
  "Contessa",
  "Duke",
];

export function createCard(cardId: number, cardType: string): Card {
  let card: Card;
  switch (cardType) {
    case "Ambassador": {
      card = new Card(cardId, "Ambassador", new Exchange());
      break;
    }
    case "Assassin": {
      card = new Card(cardId, "Assassin", new Assassinate());
      break;
    }
    case "Captain": {
      card = new Card(cardId, "Captain", new Steal());
      break;
    }
    case "Contessa": {
      card = new Card(cardId, "Contessa", null);
      break;
    }
    case "Duke": {
      card = new Card(cardId, "Duke", new Tax());
      break;
    }
    default: {
      card = new Card(cardId, "Error", null);
      break;
    }
  }
  return card;
}

type ActiveAbility = {
  readonly name: string;
  effect(user: Player): void;
};

class Income implements ActiveAbility {
  name = "Income";
  effect(user: Player) {
    user.addBalance(1);
  }
}

class ForeignAid implements ActiveAbility {
  name = "Foreign Aid";
  effect(user: Player) {
    user.addBalance(2);
  }
}

class Coup implements ActiveAbility {
  name = "Coup";
  effect(user: Player) {
    user.lowerBalance(7);
  }
}

class Tax implements ActiveAbility {
  name = "Tax";
  effect(user: Player) {
    user.addBalance(3);
  }
}

class Assassinate implements ActiveAbility {
  name = "Assassinate";
  effect(user: Player) {
    user.lowerBalance(3);
  }
}

class Exchange implements ActiveAbility {
  name = "Exchange";
  effect(user: Player) {
    user.addBalance(1);
  }
}

class Steal implements ActiveAbility {
  name = "Steal";
  effect(user: Player) {
    user.addBalance(1);
  }
}
