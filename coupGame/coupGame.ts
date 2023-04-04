import { Player } from "./coupPlayer";
import { Server } from "socket.io";
import { updateWinner } from "../utils/matchDb";
import pfs from "fs/promises";

export function createIoFunction() {
  return {
    answerAction: function (game: Game) {
      return (arg: gameArgument) => {
        game.transition(arg);
      };
    },
    answerCounteraction: function (game: Game) {
      return (arg: gameArgument) => {
        game.transition(arg);
      };
    },
    answerChallenge: function (game: Game) {
      return (arg: gameArgument) => {
        game.transition(arg);
      };
    },
    answerCard: function (game: Game) {
      return (arg: gameArgument) => {
        game.transition(arg);
      };
    },
    answerTarget: function (game: Game) {
      return (arg: gameArgument) => {
        game.transition(arg);
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
  targetId: string;
  chosenCard: number;
  chosenAction: string;
};

type GameSave = {
  id: string;
  name: String;
  state: string;
  activePlayerIndex: number;
  playerList: {
    id: string;
    hand: number[];
    faceUp: number[];
    balance: number;
  }[];
  action: { id: number; save: ActionSave } | undefined;
};
type ActionSave = {
  state: string;
  askingPlayerIndex: number | undefined;
  counteraction: undefined | CounteractionSave;
  challenge: undefined | ChallengeSave;
  targetIndex: undefined | number;
};
type CounteractionSave = {
  state: string;
  askingPlayerIndex: number;
  challenge: undefined | ChallengeSave;
};
type ChallengeSave = {
  state: string;
};

/* ---------------------------------- Game ---------------------------------- */
export class Game {
  private readonly startingBalance = 2;
  private readonly startingHandSize = 2;
  //create randomize deck
  private deck: number[] = this.shuffle([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ]);
  private state = "askForAction";
  private action: Action | null = null;
  public readonly playerList: Player[];
  public inGamePlayerList: Player[];
  private activePlayerIndex: number = 0;
  public readonly io: any; //TODO any to specific type

  constructor(
    public readonly name: string,
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
    this.inGamePlayerList = this.shuffle(this.playerList);
  }

  getPlayerIndexById(id: string): number {
    for (let i = 0; i < this.inGamePlayerList.length; i++) {
      if (this.inGamePlayerList[i].userID === id) {
        return i;
      }
    }
    return -1;
  }

  getState(): string {
    return this.state;
  }

  drawCard(count: number) {
    return this.deck.splice(0, count);
  }

  addToDeck(cardNo: number) {
    this.deck.push(cardNo);
    this.deck = this.shuffle(this.deck);
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

  sendState() {
    //TODO: finish this
    this.io.emit(this.state, {
      userID: this.inGamePlayerList[this.activePlayerIndex].userID,
    });
  }

  checkVictory() {
    this.inGamePlayerList = this.inGamePlayerList.filter(
      (player) => player.getStatus() == "inGame"
    );
    return this.inGamePlayerList.length == 1;
  }
  async save() {
    const gameSave: GameSave = {
      id: this.id,
      name: this.name,
      state: this.state,
      activePlayerIndex: this.activePlayerIndex,
      playerList: this.playerList.map(function (player) {
        return {
          id: player.userID,
          hand: player.getHand(),
          faceUp: player.getFaceUp(),
          balance: player.getBalance(),
        };
      }),
      action: this.action
        ? {
            id: this.action.id,
            save: {
              state: this.action.getState(),
              askingPlayerIndex: this.action.getAskingPlayerIndex
                ? this.action.getAskingPlayerIndex()
                : undefined,
              counteraction: this.action.counteraction
                ? {
                    state: this.action.counteraction.getState(),
                    askingPlayerIndex:
                      this.action.counteraction.getAskingPlayerIndex(),
                    challenge: this.action.counteraction.challenge
                      ? {
                          state: this.action.counteraction.challenge.getState(),
                        }
                      : undefined,
                  }
                : undefined,
              challenge: this.action.challenge
                ? {
                    state: this.action.challenge.getState(),
                  }
                : undefined,
              targetIndex: this.action.targetIndex
                ? this.action.targetIndex
                : undefined,
            },
          }
        : undefined,
    };
    try {
      await pfs.access("save");
    } catch (e) {
      pfs.mkdir("save");
    }
    pfs.writeFile(`/save/${this.id}.json`, JSON.stringify(gameSave));
  }

  transition(arg?: gameArgument) {
    switch (this.state) {
      case "askForAction": {
        if (arg && arg.chosenAction) {
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
              if (
                this.inGamePlayerList[this.activePlayerIndex].getBalance() < 7
              ) {
                this.io.emit("askForAction", {
                  userID: this.inGamePlayerList[this.activePlayerIndex].userID,
                });
                return;
              }
              this.action = new Coup(this, this.activePlayerIndex);
              break;
            }
            case "tax": {
              this.action = new Tax(this, this.activePlayerIndex);
              break;
            }
            case "assassinate": {
              if (
                this.inGamePlayerList[this.activePlayerIndex].getBalance() < 3
              ) {
                this.io.emit("askForAction", {
                  userID: this.inGamePlayerList[this.activePlayerIndex].userID,
                });
                return;
              }
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
          this.state = "resolvingAction";
          this.io.emit(
            "message",
            `User ${this.inGamePlayerList[this.activePlayerIndex].userID} use ${
              arg.chosenAction
            }!<br>`
          );
          this.action?.transition(arg);
        }
        break;
      }
      case "resolvingAction": {
        if (this.action?.getState() == "finish") {
          this.action = null;
          if (this.checkVictory()) {
            this.state = "finish";
            this.io.emit("finish", {
              userID: this.inGamePlayerList[0].userID,
              gameName: this.name,
            });
            updateWinner(this.id, this.inGamePlayerList[0].userID);
          } else {
            if (this.activePlayerIndex >= this.inGamePlayerList.length - 1) {
              this.activePlayerIndex = 0;
            } else {
              this.activePlayerIndex++;
            }
            this.state = "askForAction";
            this.io.emit("askForAction", {
              userID: this.inGamePlayerList[this.activePlayerIndex].userID,
            });
          }
        } else {
          this.action?.transition(arg);
        }
        break;
      }
    }
  }
}

/* --------------------------------- Action --------------------------------- */
interface Action {
  id: number;
  challenge?: Challenge | null;
  counteraction?: Counteraction | null;
  targetIndex?: number | null;
  transition(arg?: gameArgument): void;
  setActionValid(result: boolean): void;
  getState(): string;
  getAskingPlayerIndex?(): number;
}

/* --------------------------------- Income --------------------------------- */
class Income implements Action {
  public readonly id = 1;
  private actionValid: boolean = true;
  private state: string = "effect";
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "effect": {
        this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(1);
        this.state = "finish";
        this.callingGame.io.emit(this.id + "finish");
        this.callingGame.transition(arg);
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}

/* ------------------------------- Foreign Aid ------------------------------ */
class ForeignAid implements Action {
  public readonly id = 2;
  public counteraction: Counteraction | null = null;
  private actionValid: boolean = true;
  private state: string = "askForCounterAction";
  private askingPlayerIndex: number = -1;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskingPlayerIndex(): number {
    return this.askingPlayerIndex;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "askForCounterAction": {
        if (arg && arg.counteraction) {
          this.state = "resolveCounterAction";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } block!<br>`
          );
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.askingPlayerIndex
          );
          this.counteraction.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.activePlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
              this.callingGame.inGamePlayerList.length
            ) {
              this.state = "effect";
              this.transition();
              break;
            }
          }
          this.callingGame.io.emit("askForCounterAction", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else {
          this.state = "effect";
          this.transition();
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else if (this.actionValid) {
          this.state = "effect";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(2);
        this.state = "finish";
        this.callingGame.transition(arg);
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}

/* ---------------------------------- Coup ---------------------------------- */
class Coup implements Action {
  public readonly id = 3;
  private actionValid: boolean = true;
  private state: string = "choosingTarget";
  public targetIndex: number | null = null;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {
    this.callingGame.inGamePlayerList[this.activePlayerIndex].lowerBalance(7);
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "choosingTarget": {
        if (arg && arg.targetId) {
          this.targetIndex = this.callingGame.getPlayerIndexById(arg.targetId);
          this.callingGame.io.emit("askCard", {
            userID: this.callingGame.inGamePlayerList[this.targetIndex].userID,
            hand: this.callingGame.inGamePlayerList[this.targetIndex].getHand(),
            faceUp:
              this.callingGame.inGamePlayerList[this.targetIndex].getFaceUp(),
          });
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userID
            } target ${
              this.callingGame.inGamePlayerList[this.targetIndex].userID
            }!<br>`
          );
          this.state = "effect";
        } else {
          this.callingGame.io.emit("askTarget", {
            userID:
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userID,
          });
        }
        break;
      }
      case "effect": {
        if (arg && arg.chosenCard && this.targetIndex) {
          this.callingGame.inGamePlayerList[this.targetIndex].loseInfluence(
            arg.chosenCard
          );
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}

/* ----------------------------------- Tax ---------------------------------- */
class Tax implements Action {
  public readonly id = 4;
  public challenge: Challenge | null = null;
  private actionValid: boolean = true;
  private state: string = "askForChallenge";
  private askingPlayerIndex: number = -1;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } Challenge!<br>`
          );
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askingPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.activePlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
              this.callingGame.inGamePlayerList.length
            ) {
              this.state = "effect";
              this.transition();
              break;
            }
          }
          this.callingGame.io.emit("askForChallenge", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else {
          this.state = "effect";
          this.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.state = "effect";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(3);
        this.state = "finish";
        this.callingGame.transition(arg);
        break;
      }
    }
  }
}

/* ------------------------------ Assassinate; ------------------------------ */
class Assassinate implements Action {
  public readonly id = 5;
  public challenge: Challenge | null = null;
  public counteraction: Counteraction | null = null;
  private state: string = "choosingTarget";
  public targetIndex: number | null = null;
  private actionValid: boolean = true;
  private askingPlayerIndex: number = -1;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskingPlayerIndex(): number {
    return this.askingPlayerIndex;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "choosingTarget": {
        if (arg && arg.targetId) {
          this.targetIndex = this.callingGame.getPlayerIndexById(arg.targetId);
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userID
            } target ${
              this.callingGame.inGamePlayerList[this.targetIndex].userID
            }!<br>`
          );
          this.state = "askForChallenge";
          this.transition();
        } else {
          this.callingGame.io.emit("askTarget", {
            userID:
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userID,
          });
        }
        break;
      }
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } Challenge!<br>`
          );
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askingPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.activePlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
              this.callingGame.inGamePlayerList.length
            ) {
              this.callingGame.inGamePlayerList[
                this.activePlayerIndex
              ].lowerBalance(3);
              this.askingPlayerIndex = -1;
              this.state = "askForCounterAction";
              this.transition();
              break;
            }
          }
          this.callingGame.io.emit("askForChallenge", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else {
          this.callingGame.inGamePlayerList[
            this.activePlayerIndex
          ].lowerBalance(3);
          this.askingPlayerIndex = -1;
          this.state = "askForCounterAction";
          this.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.callingGame.inGamePlayerList[
            this.activePlayerIndex
          ].lowerBalance(3);
          this.askingPlayerIndex = -1;
          this.state = "askForCounterAction";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "askForCounterAction": {
        if (arg && arg.counteraction) {
          this.state = "resolveCounterAction";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } block!<br>`
          );
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.askingPlayerIndex
          );
          this.counteraction.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.activePlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
                this.callingGame.inGamePlayerList.length &&
              this.targetIndex
            ) {
              this.callingGame.io.emit("askCard", {
                userID:
                  this.callingGame.inGamePlayerList[this.targetIndex].userID,
                hand: this.callingGame.inGamePlayerList[
                  this.targetIndex
                ].getHand(),
                faceUp:
                  this.callingGame.inGamePlayerList[
                    this.targetIndex
                  ].getFaceUp(),
              });
              this.state = "effect";
              break;
            }
          }
          this.callingGame.io.emit("askForCounterAction", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else if (this.targetIndex) {
          this.callingGame.io.emit("askCard", {
            userID: this.callingGame.inGamePlayerList[this.targetIndex].userID,
            hand: this.callingGame.inGamePlayerList[this.targetIndex].getHand(),
            faceUp:
              this.callingGame.inGamePlayerList[this.targetIndex].getFaceUp(),
          });
          this.state = "effect";
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else if (this.actionValid && this.targetIndex) {
          this.callingGame.io.emit("askCard", {
            userID: this.callingGame.inGamePlayerList[this.targetIndex].userID,
            hand: this.callingGame.inGamePlayerList[this.targetIndex].getHand(),
            faceUp:
              this.callingGame.inGamePlayerList[this.targetIndex].getFaceUp(),
          });
          this.state = "effect";
        } else {
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        if (arg && arg.chosenCard && this.targetIndex) {
          this.callingGame.inGamePlayerList[this.targetIndex].loseInfluence(
            arg.chosenCard
          );
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}

/* -------------------------------- Exchange -------------------------------- */
class Exchange implements Action {
  public readonly id = 6;
  public challenge: Challenge | null = null;
  private actionValid: boolean = true;
  private state: string = "askForChallenge";
  private askingPlayerIndex: number = -1;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskingPlayerIndex(): number {
    return this.askingPlayerIndex;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } Challenge!<br>`
          );
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askingPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.activePlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
              this.callingGame.inGamePlayerList.length
            ) {
              this.state = "effect";
              this.transition();
              break;
            }
          }
          this.callingGame.io.emit("askForChallenge", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else {
          this.state = "effect";
          this.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.state = "effect";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        this.callingGame.inGamePlayerList[this.activePlayerIndex].addHand(
          this.callingGame.drawCard(2)
        );
        this.state = "choosingDiscard";
        this.callingGame.io.emit("askCard", {
          userID:
            this.callingGame.inGamePlayerList[this.activePlayerIndex].userID,
          hand: this.callingGame.inGamePlayerList[
            this.activePlayerIndex
          ].getHand(),
          faceUp:
            this.callingGame.inGamePlayerList[
              this.activePlayerIndex
            ].getFaceUp(),
        });
        break;
      }
      case "choosingDiscard": {
        if (arg && arg.chosenCard) {
          this.callingGame.addToDeck(arg.chosenCard);
          this.callingGame.inGamePlayerList[this.activePlayerIndex].discardHand(
            arg.chosenCard
          );
          if (
            this.callingGame.inGamePlayerList[this.activePlayerIndex].getHand()
              .length > 2
          ) {
            this.callingGame.io.emit("askCard", {
              userID:
                this.callingGame.inGamePlayerList[this.activePlayerIndex]
                  .userID,
              hand: this.callingGame.inGamePlayerList[
                this.activePlayerIndex
              ].getHand(),
              faceUp:
                this.callingGame.inGamePlayerList[
                  this.activePlayerIndex
                ].getFaceUp(),
            });
          } else {
            this.state = "finish";
            this.callingGame.transition(arg);
          }
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}

/* ---------------------------------- Steal --------------------------------- */
class Steal implements Action {
  public readonly id = 7;
  public challenge: Challenge | null = null;
  public counteraction: Counteraction | null = null;
  private state: string = "choosingTarget";
  public targetIndex: number | null = null;
  private actionValid: boolean = true;
  private askingPlayerIndex: number = -1;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number
  ) {}

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskingPlayerIndex(): number {
    return this.askingPlayerIndex;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "choosingTarget": {
        if (arg && arg.targetId) {
          this.targetIndex = this.callingGame.getPlayerIndexById(arg.targetId);
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userID
            } target ${
              this.callingGame.inGamePlayerList[this.targetIndex].userID
            }!<br>`
          );
          this.state = "askForChallenge";
          this.transition();
        } else {
          this.callingGame.io.emit("askTarget", {
            userID:
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userID,
          });
        }
        break;
      }
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } Challenge!<br>`
          );
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askingPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.activePlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
              this.callingGame.inGamePlayerList.length
            ) {
              this.askingPlayerIndex = -1;
              this.state = "askForCounterAction";
              this.transition();
              break;
            }
          }
          this.callingGame.io.emit("askForChallenge", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else {
          this.askingPlayerIndex = -1;
          this.state = "askForCounterAction";
          this.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.askingPlayerIndex = -1;
          this.state = "askForCounterAction";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "askForCounterAction": {
        if (arg && arg.counteraction) {
          this.state = "resolveCounterAction";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } block!<br>`
          );
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.askingPlayerIndex
          );
          this.counteraction.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.activePlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
              this.callingGame.inGamePlayerList.length
            ) {
              this.state = "effect";
              this.transition();
              break;
            }
          }
          this.callingGame.io.emit("askForCounterAction", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else {
          this.state = "effect";
          this.transition();
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else if (this.actionValid) {
          this.state = "effect";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      case "effect": {
        if (this.targetIndex) {
          const targetBalance =
            this.callingGame.inGamePlayerList[this.targetIndex].getBalance();
          if (targetBalance < 2) {
            this.callingGame.inGamePlayerList[
              this.activePlayerIndex
            ].addBalance(targetBalance);
            this.callingGame.inGamePlayerList[this.targetIndex].lowerBalance(
              targetBalance
            );
          } else {
            this.callingGame.inGamePlayerList[
              this.activePlayerIndex
            ].addBalance(2);
            this.callingGame.inGamePlayerList[this.targetIndex].lowerBalance(2);
          }
          this.state = "finish";
          this.callingGame.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}

/* ------------------------------ Counteraction ----------------------------- */
class Counteraction implements Action {
  public id: number;
  public challenge: Challenge | null = null;
  public counteraction: Counteraction | null = null;
  private state: string = "askForChallenge";
  private askingPlayerIndex: number = -1;
  private actionValid = true;

  constructor(
    private callingGame: Game,
    private callingAction: Action,
    public readonly counteractionPlayerIndex: number
  ) {
    this.id = counteractionMap.get(this.callingAction.id);
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskingPlayerIndex(): number {
    return this.askingPlayerIndex;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "askForChallenge": {
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.callingGame.io.emit(
            "message",
            `User ${
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID
            } Challenge!<br>`
          );
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askingPlayerIndex,
            this.counteractionPlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askingPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askingPlayerIndex++;
          if (this.askingPlayerIndex === this.counteractionPlayerIndex) {
            this.askingPlayerIndex++;
            if (
              this.askingPlayerIndex ===
              this.callingGame.inGamePlayerList.length
            ) {
              this.callingAction.setActionValid(false);
              this.state = "finish";
              this.callingAction.transition(arg);
              break;
            }
          }
          this.callingGame.io.emit("askForChallenge", {
            userID:
              this.callingGame.inGamePlayerList[this.askingPlayerIndex].userID,
          });
        } else {
          this.callingAction.setActionValid(false);
          this.state = "finish";
          this.callingAction.transition(arg);
        }
        break;
      }

      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.callingAction.setActionValid(false);
          this.state = "finish";
          this.callingAction.transition(arg);
        } else {
          this.state = "finish";
          this.callingAction.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}

/* -------------------------------- Challenge ------------------------------- */
class Challenge {
  private state: string;
  constructor(
    private callingGame: Game,
    private callingAction: Action,
    public readonly challengerIndex: number,
    public readonly targetIndex: number
  ) {
    const matchCardId = this.callingGame.inGamePlayerList[this.targetIndex]
      .getHand()
      .find((handCardId) =>
        actionIdMap.get(this.callingAction.id).includes(handCardId)
      );
    const targetBluff = matchCardId === undefined;
    this.state = targetBluff
      ? "targetLoseInfluence"
      : "challengerLoseInfluence";
    this.callingGame.io.emit(
      "message",
      `User ${this.callingGame.inGamePlayerList[this.targetIndex].userID} ${
        targetBluff ? "bluff" : "saying truth"
      }!<br>`
    );
    if (!targetBluff) {
      this.callingGame.addToDeck(matchCardId);
      this.callingGame.inGamePlayerList[this.targetIndex].discardHand(
        matchCardId
      );
      this.callingGame.inGamePlayerList[this.targetIndex].addHand(
        this.callingGame.drawCard(1)
      );
    }
  }

  getState(): string {
    return this.state;
  }

  transition(arg?: gameArgument): void {
    switch (this.state) {
      case "targetLoseInfluence": {
        if (arg && arg.chosenCard) {
          this.callingGame.inGamePlayerList[this.targetIndex].loseInfluence(
            arg.chosenCard
          );
          this.callingAction.setActionValid(false);
          this.state = "finish";
          this.callingAction.transition(arg);
        } else {
          this.callingGame.io.emit("askCard", {
            userID: this.callingGame.inGamePlayerList[this.targetIndex].userID,
            hand: this.callingGame.inGamePlayerList[this.targetIndex].getHand(),
            faceUp:
              this.callingGame.inGamePlayerList[this.targetIndex].getFaceUp(),
          });
        }
        break;
      }
      case "challengerLoseInfluence": {
        if (arg && arg.chosenCard) {
          this.callingGame.inGamePlayerList[this.challengerIndex].loseInfluence(
            arg.chosenCard
          );
          this.state = "finish";
          this.callingAction.transition(arg);
        } else {
          this.callingGame.io.emit("askCard", {
            userID:
              this.callingGame.inGamePlayerList[this.challengerIndex].userID,
            hand: this.callingGame.inGamePlayerList[
              this.challengerIndex
            ].getHand(),
            faceUp:
              this.callingGame.inGamePlayerList[
                this.challengerIndex
              ].getFaceUp(),
          });
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
  }
}
