import { Player } from "./coupPlayer";
import { Server } from "socket.io";

export function createIoFunction() {
  return {
    answerAction: function (game: Game) {
      return (arg: gameArgument) => {
        console.log(game.getState());
        game.transition(arg);
        console.log(game.getState());
      };
    },
    answerCounteraction: function (game: Game) {
      return (arg: gameArgument) => {
        console.log(game.getState());
        game.transition(arg);
        console.log(game.getState());
      };
    },
    answerChallenge: function (game: Game) {
      return (arg: gameArgument) => {
        console.log(game.getState());
        game.transition(arg);
        console.log(game.getState());
      };
    },
    answerCard: function (game: Game) {
      return (arg: gameArgument) => {
        console.log(game.getState());
        game.transition(arg);
        console.log(game.getState());
      };
    },
  };
}

// card mapping
// ambassador 0,1,2
// assassin 3,4,5
// captain 6,7,8
// contessa 9,10,11
// duke 12,13,14

// action mapping
// action income id 1
// action foreign aid id 2
// action coup id 3
// action tax id 4
// action assassinate id 5
// action exchange id 6
// action steal id 7
// counteraction block foreign aid id 8
// counteraction block assassinate id 9
// counteraction block steal id 10

const actionIdMap = new Map();
actionIdMap.set(4, [13, 14, 15]);
actionIdMap.set(5, [4, 5, 6]);
actionIdMap.set(6, [1, 2, 3]);
actionIdMap.set(7, [7, 8, 9]);
actionIdMap.set(8, [13, 14, 15]);
actionIdMap.set(9, [10, 11, 12]);
actionIdMap.set(10, [1, 2, 3, 7, 8, 9]);

const counteractionMap = new Map();
counteractionMap.set(2, 8);
counteractionMap.set(5, 9);
counteractionMap.set(7, 10);

type gameArgument = {
  counteraction: boolean;
  challenge: boolean;
  loseCard: number;
  targetIndex: number;
  chosenCards: number[];
  chosenAction: string;
};
/* ---------------------------------- Game ---------------------------------- */
export class Game {
  private readonly startingBalance = 2;
  private readonly startingHandSize = 2;
  //create randomize deck
  private deck: number[] = this.shuffle([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  ]);
  private gameState = "askForAction";
  private action: Action | undefined = undefined;
  public readonly playerList: Player[];
  private activePlayerIndex: number = 0;
  public readonly io: any; //TODO any to specific type

  constructor(
    public readonly id: string,
    public readonly playerIdList: string[],
    io: Server
  ) {
    //create gameRoom Io socket
    this.io = io.to(this.id);
    //create player list from user id list
    this.playerList = playerIdList.map(
      (playerId) =>
        new Player(
          playerId,
          this.startingBalance,
          this.drawCard(this.startingHandSize),
          this
        )
    );
    //randomize player list
    this.playerList = this.shuffle(this.playerList);
    //set starting player
  }

  getPlayerIndexById(id: string): number {
    for (let i = 0; i < this.playerList.length; i++) {
      if (this.playerList[i].userID === id) {
        return i;
      }
    }
    return -1;
  }

  getState(): string {
    return this.gameState;
  }

  drawCard(count: number) {
    return this.deck.splice(0, count);
  }

  shuffle<T>(array: T[]): T[] {
    var m = array.length,
      t,
      i;

    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

  sendGameState() {
    this.io.emit(this.gameState, {
      userID: this.playerList[this.activePlayerIndex].userID,
    });
  }

  transition(arg?: gameArgument) {
    switch (this.gameState) {
      case "askForAction": {
        if (arg && arg.chosenAction) {
          this.gameState = "resolvingAction";
          this.io.emit("resolvingAction");
          switch (arg.chosenAction) {
            case "income": {
              this.action = new Income(this, this.activePlayerIndex);
              break;
            }
            case "foreign-aid": {
              this.action = new ForeignAid(this, this.activePlayerIndex);
              break;
            }
            case "coup": {
              this.action = new Coup(this, this.activePlayerIndex);
              break;
            }
            case "tax": {
              this.action = new Tax(this, this.activePlayerIndex);
              break;
            }
            case "assassinate": {
              this.action = new Assassinate(this, this.activePlayerIndex);
              break;
            }
            case "exchange": {
              this.action = new Exchange(this, this.activePlayerIndex);
              break;
            }
            case "steal": {
              this.action = new Steal(this, this.activePlayerIndex);
              break;
            }
          }
        }
        this.action?.transition(arg);
        break;
      }
      case "resolvingAction": {
        if (this.action?.getState() == "finish") {
          if (this.activePlayerIndex == this.playerList.length - 1) {
            this.activePlayerIndex = 0;
          } else {
            this.activePlayerIndex++;
          }
          this.gameState = "askForAction";
          this.io.emit("askForAction", {
            userID: this.playerList[this.activePlayerIndex].userID,
          });
        } else {
          this.action?.transition(arg);
        }
      }
    }
  }
}

/* --------------------------------- Action --------------------------------- */
interface Action {
  getActionId(): number;
  transition(arg?: gameArgument): void;
  setActionValid(result: boolean): void;
  getState(): string;
}

/* --------------------------------- Income --------------------------------- */
class Income implements Action {
  private readonly actionsId = 1;
  private actionValid: boolean = true;
  private actionState: string = "effect";
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionsId;
  }

  getState(): string {
    console.log(this.actionState);
    return this.actionState;
  }

  transition(arg?: gameArgument): void {
    switch (this.actionState) {
      case "effect": {
        this.callingGame.playerList[this.activePlayerIndex].addBalance(1);
        this.actionState = "finish";
        this.callingGame.io.emit(this.actionsId + "finish");
        this.callingGame.transition(arg);
        break;
      }
      default: {
        throw new Error("State: " + this.actionState + " not supported");
      }
    }
  }
}

/* ------------------------------- Foreign Aid ------------------------------ */
class ForeignAid implements Action {
  private readonly actionsId = 2;
  private actionValid: boolean = true;
  private actionState: string = "askForCounterAction";
  private currentPlayerIndex: number = -1;
  private counteraction: Counteraction | undefined = undefined;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionsId;
  }

  getState(): string {
    return this.actionState;
  }

  transition(arg?: gameArgument): void {
    switch (this.actionState) {
      case "askForCounterAction": {
        if (arg && arg.counteraction) {
          this.actionState = "resolveCounterAction";
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.currentPlayerIndex
          );
          this.counteraction.transition();
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.activePlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.actionState = "effect";
              this.transition();
              break;
            }
          }
          this.callingGame.io.emit("askForCounterAction", {
            userID: this.callingGame.playerList[this.currentPlayerIndex].userID,
          });
        } else {
          this.actionState = "effect";
          this.transition();
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else if (this.actionValid) {
          this.actionState = "effect";
          this.transition();
        } else {
          this.actionState = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        this.callingGame.playerList[this.activePlayerIndex].addBalance(2);
        this.actionState = "finish";
        this.callingGame.transition(arg);
        break;
      }
      default: {
        throw new Error("State: " + this.actionState + " not supported");
      }
    }
  }
}

/* ---------------------------------- Coup ---------------------------------- */
class Coup implements Action {
  private readonly actionsId = 3;
  private actionValid: boolean = true;
  private actionState: string = "choosingTarget";
  private targetIndex: number | undefined = undefined;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {
    this.callingGame.io.emit(
      "choosingTarget",
      this.callingGame.playerList[this.activePlayerIndex].userID
    );
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionsId;
  }

  getState(): string {
    return this.actionState;
  }

  transition(arg?: gameArgument): void {
    switch (this.actionState) {
      case "choosingTarget": {
        if (arg && arg.targetIndex) {
          this.targetIndex = arg.targetIndex;
          this.actionState = "effect";
        }
        break;
      }
      case "effect": {
        if (arg && arg.loseCard && this.targetIndex) {
          this.callingGame.playerList[this.targetIndex].loseInfluence(
            arg.loseCard
          );
          this.actionState = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.actionState + " not supported");
      }
    }
  }
}

/* ----------------------------------- Tax ---------------------------------- */
class Tax implements Action {
  private readonly actionsId = 4;
  private actionValid: boolean = true;
  private actionState: string = "askForChallenge";
  private currentPlayerIndex: number = 0;
  private challenge: Challenge | undefined = undefined;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {
    this.callingGame.io.emit(
      "askForChallenge",
      this.callingGame.playerList[this.currentPlayerIndex].userID
    );
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionsId;
  }

  getState(): string {
    return this.actionState;
  }

  transition(arg?: gameArgument): void {
    switch (this.actionState) {
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.actionState = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.currentPlayerIndex,
            this.activePlayerIndex
          );
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.activePlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.actionState = "effect";
              break;
            }
          }
          this.callingGame.io.emit(
            "askForChallenge",
            this.callingGame.playerList[this.currentPlayerIndex].userID
          );
        } else {
          this.actionState = "effect";
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.actionState = "effect";
        } else {
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        this.callingGame.playerList[this.activePlayerIndex].addBalance(3);
        this.actionState = "finish";
        this.callingGame.transition(arg);
        break;
      }
    }
  }
}

/* ------------------------------ Assassinate; ------------------------------ */
class Assassinate implements Action {
  private readonly actionsId = 5;
  private actionState: string = "choosingTarget";
  private targetIndex: number | undefined = undefined;
  private actionValid: boolean = true;
  private currentPlayerIndex: number = 0;
  private challenge: Challenge | undefined = undefined;
  private counteraction: Counteraction | undefined = undefined;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {
    this.callingGame.io.emit(
      "choosingTarget",
      this.callingGame.playerList[this.activePlayerIndex].userID
    );
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionsId;
  }

  getState(): string {
    return this.actionState;
  }

  transition(arg?: gameArgument): void {
    switch (this.actionState) {
      case "choosingTarget": {
        if (arg && arg.targetIndex) {
          this.targetIndex = arg.targetIndex;
          this.actionState = "askForChallenge";
        }
        break;
      }
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.actionState = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.currentPlayerIndex,
            this.activePlayerIndex
          );
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.activePlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.callingGame.playerList[this.activePlayerIndex].lowerBalance(
                3
              );
              this.actionState = "askForCounterAction";
              break;
            }
          }
          this.callingGame.io.emit(
            "askForChallenge",
            this.callingGame.playerList[this.currentPlayerIndex].userID
          );
        } else {
          this.callingGame.playerList[this.activePlayerIndex].lowerBalance(3);
          this.actionState = "askForCounterAction";
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.callingGame.playerList[this.activePlayerIndex].lowerBalance(3);
          this.actionState = "askForCounterAction";
        } else {
          this.callingGame.transition(arg);
        }
        break;
      }
      case "askForCounterAction": {
        if (arg && arg.counteraction) {
          this.actionState = "resolveCounterAction";
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.currentPlayerIndex
          );
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.activePlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.actionState = "effect";
              break;
            }
          }
          this.callingGame.io.emit(
            "askForCounterAction",
            this.callingGame.playerList[this.currentPlayerIndex].userID
          );
        } else {
          this.actionState = "effect";
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else if (this.actionValid) {
          this.actionState = "effect";
        } else {
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        if (arg && arg.loseCard && this.targetIndex) {
          this.callingGame.playerList[this.targetIndex].loseInfluence(
            arg.loseCard
          );
          this.actionState = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.actionState + " not supported");
      }
    }
  }
}

/* -------------------------------- Exchange -------------------------------- */
class Exchange implements Action {
  private readonly actionsId = 6;
  private actionValid: boolean = true;
  private actionState: string = "askForChallenge";
  private currentPlayerIndex: number = 0;
  private challenge: Challenge | undefined = undefined;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {
    this.callingGame.io.emit(
      "askForChallenge",
      this.callingGame.playerList[this.currentPlayerIndex].userID
    );
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionsId;
  }
  getState(): string {
    return this.actionState;
  }
  transition(arg?: gameArgument): void {
    switch (this.actionState) {
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.actionState = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.currentPlayerIndex,
            this.activePlayerIndex
          );
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.activePlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.actionState = "effect";
              break;
            }
          }
          this.callingGame.io.emit(
            "askForChallenge",
            this.callingGame.playerList[this.currentPlayerIndex].userID
          );
        } else {
          this.actionState = "effect";
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.actionState = "effect";
        } else {
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        this.callingGame.playerList[this.activePlayerIndex].addHand(
          this.callingGame.drawCard(2)
        );
        this.actionState = "choosingDiscard";
        break;
      }
      case "choosingDiscard": {
        if (arg && arg.chosenCards) {
          this.callingGame.playerList[this.activePlayerIndex].discardHand(
            arg.chosenCards
          );
          this.actionState = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.actionState + " not supported");
      }
    }
  }
}

/* ---------------------------------- Steal --------------------------------- */
class Steal implements Action {
  private readonly actionsId = 7;
  private actionState: string = "choosingTarget";
  private challenger: Player | undefined = undefined;
  private counteractionPlayer: Player | undefined = undefined;
  private targetIndex: number | undefined = undefined;
  private actionValid: boolean = true;
  private currentPlayerIndex: number = 0;
  private challenge: Challenge | undefined = undefined;
  private counteraction: Counteraction | undefined = undefined;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {
    this.callingGame.io.emit(
      "choosingTarget",
      this.callingGame.playerList[this.activePlayerIndex].userID
    );
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionsId;
  }
  getState(): string {
    return this.actionState;
  }

  transition(arg?: gameArgument): void {
    switch (this.actionState) {
      case "choosingTarget": {
        if (arg && arg.targetIndex) {
          this.targetIndex = arg.targetIndex;
          this.actionState = "askForChallenge";
        }
        break;
      }
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.actionState = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.currentPlayerIndex,
            this.activePlayerIndex
          );
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.activePlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.actionState = "askForCounterAction";
              break;
            }
          }
          this.callingGame.io.emit(
            "askForChallenge",
            this.callingGame.playerList[this.currentPlayerIndex].userID
          );
        } else {
          this.actionState = "askForCounterAction";
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.actionState = "askForCounterAction";
        } else {
          this.callingGame.transition(arg);
        }
        break;
      }
      case "askForCounterAction": {
        if (arg && arg.counteraction) {
          this.actionState = "resolveCounterAction";
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.currentPlayerIndex
          );
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.activePlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.actionState = "effect";
              break;
            }
          }
          this.callingGame.io.emit(
            "askForCounterAction",
            this.callingGame.playerList[this.currentPlayerIndex].userID
          );
        } else {
          this.actionState = "effect";
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else if (this.actionValid) {
          this.actionState = "effect";
        } else {
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        if (this.targetIndex) {
          this.callingGame.playerList[this.activePlayerIndex].addBalance(2);
          this.callingGame.playerList[this.targetIndex].lowerBalance(2);
          this.actionState = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.actionState + " not supported");
      }
    }
  }
}

/* ------------------------------ Counteraction ----------------------------- */
class Counteraction implements Action {
  private counteractionState: string = "askForChallenge";
  private currentPlayerIndex: number = -1;
  private challenge: Challenge | undefined = undefined;
  private actionId: number;
  private actionValid = true;

  constructor(
    private callingGame: Game,
    private callingAction: Action,
    public readonly counteractionPlayerIndex: number
  ) {
    this.actionId = counteractionMap.get(this.callingAction.getActionId());
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getActionId(): number {
    return this.actionId;
  }

  getState(): string {
    return this.counteractionState;
  }

  transition(arg?: gameArgument): void {
    switch (this.counteractionState) {
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.counteractionState = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.currentPlayerIndex,
            this.counteractionPlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.currentPlayerIndex !==
          this.callingGame.playerList.length - 1
        ) {
          this.currentPlayerIndex++;
          if (this.currentPlayerIndex === this.counteractionPlayerIndex) {
            this.currentPlayerIndex++;
            if (
              this.currentPlayerIndex ===
              this.callingGame.playerList.length - 1
            ) {
              this.callingAction.setActionValid(false);
              this.counteractionState = "finish";
              this.callingAction.transition(arg);
              break;
            }
          }
          this.callingGame.io.emit("askForChallenge", {
            userID: this.callingGame.playerList[this.currentPlayerIndex].userID,
          });
        } else {
          this.callingAction.setActionValid(false);
          this.counteractionState = "finish";
          this.callingAction.transition(arg);
        }
        break;
      }

      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.callingAction.setActionValid(false);
          this.counteractionState = "finish";
          this.callingAction.transition(arg);
        } else {
          this.counteractionState = "finish";
          this.callingAction.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.counteractionState + " not supported");
      }
    }
  }
}

/* -------------------------------- Challenge ------------------------------- */
class Challenge {
  private challengeState: string;
  constructor(
    private callingGame: Game,
    private callingAction: Action,
    public readonly challengerIndex: number,
    public readonly targetIndex: number
  ) {
    console.log(
      "hand ",
      this.callingGame.playerList[this.targetIndex].getHand()
    );
    console.log(
      "counter action card ",
      actionIdMap.get(this.callingAction.getActionId())
    );
    let targetBluff = !this.callingGame.playerList[this.targetIndex]
      .getHand()
      .some((handCardId) =>
        actionIdMap.get(this.callingAction.getActionId()).includes(handCardId)
      );
    this.challengeState = targetBluff
      ? "targetLoseInfluence"
      : "challengerLoseInfluence";
    console.log("targetBluffL: ", targetBluff);
  }

  getState(): string {
    return this.challengeState;
  }

  transition(arg?: gameArgument): void {
    if (arg) {
      console.log(arg);
    }
    switch (this.challengeState) {
      case "targetLoseInfluence": {
        if (arg && arg.loseCard) {
          this.callingGame.playerList[this.targetIndex].loseInfluence(
            arg.loseCard
          );
          this.callingAction.setActionValid(false);
          this.challengeState = "finish";
          this.callingAction.transition(arg);
        } else {
          this.callingGame.io.emit("askLoseInfluence", {
            userID: this.callingGame.playerList[this.targetIndex].userID,
          });
        }
        break;
      }
      case "challengerLoseInfluence": {
        if (arg && arg.loseCard) {
          this.callingGame.playerList[this.challengerIndex].loseInfluence(
            arg.loseCard
          );
          this.challengeState = "finish";
          this.callingAction.transition(arg);
        } else {
          this.callingGame.io.emit("askLoseInfluence", {
            userID: this.callingGame.playerList[this.challengerIndex].userID,
          });
        }
        break;
      }
      default: {
        throw new Error("State: " + this.challengeState + " not supported");
      }
    }
  }
}
