import { Player, PlayerSave } from "./coupPlayer";
import { Server, Socket } from "socket.io";
import { updateWinner } from "./utils/matchDb";
import fs from "fs";
import { logger } from "./logger";
import path from "path";

const filename = path.basename(__filename);

// card mapping
// ambassador 1,2,3
// assassin 4,5,6
// captain 7,8,9
// contessa 10,11,12
// duke 13,14,15

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

type transitionArgument = {
  from: string;
  counteraction: boolean;
  challenge: boolean;
  targetId: string;
  chosenCard: number;
  chosenAction: string;
};

export type GameSave = {
  name: string;
  state: string;
  deck: number[];
  activePlayerIndex: number;
  playerList: PlayerSave[];
  action?: ActionSave;
};

type ActionSave = {
  id: number;
  state: string;
  askPlayerIndex?: number;
  counteraction?: CounteractionSave;
  challenge?: ChallengeSave;
  targetIndex?: number;
};
type CounteractionSave = {
  state: string;
  askPlayerIndex: number;
  challenge?: ChallengeSave;
};
type ChallengeSave = {
  state: string;
  loserIndex: number;
};

export type GameSave2 = {
  name: string;
  playerIdList: string[];
  startingDeck: number[];
  transitionRecords: TransitionSave[];
  shuffleRecords: number[][];
};

export type TransitionSave = {
  id: number;
  arg: transitionArgument;
  msg: string;
};

/* ---------------------------------- Game ---------------------------------- */
export class Game {
  private snapshotMode: boolean;
  private save1Enable = false;
  public readonly name: string;
  private state = "askAction";
  private deck: number[];
  private activePlayerIndex: number = 0;
  public readonly playerList: Player[];
  public inGamePlayerList: Player[];
  private action: Action | null = null;
  public socketList: string[] = [];
  private readonly save2Buffer: GameSave2;
  private deckShuffleCount = 0;
  private recordCount = 0;
  constructor(
    public readonly id: string,
    private readonly io: Server,
    loadData: {
      save2?: boolean;
      snapshotMode: boolean;
      recordId?: number;
      name?: string;
      playerIdList?: string[];
    }
  ) {
    //create gameRoom Io socket
    this.snapshotMode = loadData.snapshotMode;
    if (loadData.save2) {
      const contents = fs.readFileSync(`coupSave/${this.id}.json`);
      this.save2Buffer = JSON.parse(contents.toString());
      this.name = this.save2Buffer.name;
      this.deck = [...this.save2Buffer.startingDeck];
      //create player list from user id list
      this.playerList = this.save2Buffer.playerIdList.map(
        (playerId) => new Player(playerId, this)
      );
      this.inGamePlayerList = this.playerList.filter(
        (player) => player.getState() === "inGame"
      );
      if (loadData.recordId !== undefined) {
        const recordId = loadData.recordId;
        this.save2Buffer.transitionRecords =
          this.save2Buffer.transitionRecords.filter(
            (transition) => transition.id <= recordId
          );
      }
      this.save2Buffer.transitionRecords.forEach((transition) => {
        logger.debug(
          `${filename} - Loading transition record ${
            transition.id
          }: arg:${JSON.stringify(transition.arg)}`
        );
        this.transition(transition.arg);
      });
      this.snapshotMode = false;
    } else if (loadData.playerIdList && loadData.name) {
      this.name = loadData.name;
      this.save2Buffer = {
        name: this.name,
        playerIdList: this.shuffle(loadData.playerIdList),
        startingDeck: this.shuffle([
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        ]),
        transitionRecords: [],
        shuffleRecords: [],
      };
      this.deck = [...this.save2Buffer.startingDeck];
      //create player list from user id list
      this.playerList = this.save2Buffer.playerIdList.map(
        (playerId) => new Player(playerId, this)
      );
      this.inGamePlayerList = this.playerList;
      //this.save;
      this.save2();
    } else {
      throw new Error("no load data for new coup");
    }
  }

  getPlayerIndexById(id: string): number {
    for (let i = 0; i < this.inGamePlayerList.length; i++) {
      if (this.inGamePlayerList[i].userId === id) {
        return i;
      }
    }
    return -1;
  }

  getState(): string {
    return this.state;
  }

  getTransitionRecords(): TransitionSave[] | undefined {
    return this.save2Buffer?.transitionRecords;
  }

  drawCard(count: number) {
    return this.deck.splice(0, count);
  }

  ioEmit(event: string, arg: any) {
    if (!this.snapshotMode) {
      logger.debug(
        `${filename} - io emit: event:${event} arg:${JSON.stringify(arg)}`
      );
      this.io.to(this.id).emit(event, arg);
    }
  }

  addToDeck(cardNo: number) {
    this.deck.push(cardNo);
    this.deck = this.shuffle(this.deck);
  }

  addTransitionRecord(record: Omit<TransitionSave, "id">) {
    if (!this.snapshotMode) {
      this.save2Buffer?.transitionRecords.push({
        id: this.recordCount,
        arg: record.arg,
        msg: record.msg,
      });
      logger.debug(
        `${filename} - saving transition record ${
          this.recordCount
        }: arg:${JSON.stringify(record.arg)}`
      );
      this.ioEmit("addRecord", {
        id: this.recordCount,
        msg: record.msg,
      });
      this.save2();
    }
    this.recordCount++;
  }

  shuffleDeck() {
    let shuffledDeck = this.shuffle(this.deck);
    if (this.save2Buffer) {
      if (this.deckShuffleCount > this.save2Buffer.shuffleRecords.length - 1) {
        this.save2Buffer.shuffleRecords.push(shuffledDeck);
        logger.debug(`${filename} - new shuffled deck record pushed`);
        this.save2();
      } else {
        shuffledDeck = this.save2Buffer.shuffleRecords[this.deckShuffleCount];
        logger.debug(
          `${filename} - shuffled deck record load: ${shuffledDeck}`
        );
        this.deckShuffleCount++;
      }
    }
    return shuffledDeck;
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

  sendState(socket: Socket) {
    let msg: string;
    let arg;
    if (this.action) {
      if (this.action.challenge) {
        const challengeState = this.action.challenge.getState();
        const currentPlayer =
          challengeState == "targetLoseInfluence"
            ? this.inGamePlayerList[this.action.challenge.targetIndex]
            : this.inGamePlayerList[this.action.challenge.challengerIndex];
        msg = "askCard";
        arg = {
          userId: currentPlayer.userId,
          hand: currentPlayer.getHand(),
          faceUp: currentPlayer.getFaceUp(),
        };
      } else if (this.action.counteraction) {
        if (this.action.counteraction.challenge) {
          const challengeState = this.action.counteraction.challenge.getState();
          const currentPlayer =
            challengeState == "targetLoseInfluence"
              ? this.inGamePlayerList[
                  this.action.counteraction.challenge.targetIndex
                ]
              : this.inGamePlayerList[
                  this.action.counteraction.challenge.challengerIndex
                ];
          msg = "askCard";
          arg = {
            userId: currentPlayer.userId,
            hand: currentPlayer.getHand(),
            faceUp: currentPlayer.getFaceUp(),
          };
        } else {
          msg = this.action.counteraction.getState();
          arg = {
            userId: this.action.counteraction.getAskPlayerIndex(),
          };
        }
      } else {
        msg = this.action.getState();
        arg = {
          userId: this.action.getAskPlayerIndex
            ? this.action.getAskPlayerIndex()
            : undefined,
        };
      }
    } else {
      msg = this.state;
      arg = { userId: this.inGamePlayerList[this.activePlayerIndex].userId };
    }
    logger.info(
      `${filename} - Sending game ${
        this.id
      } state msg: ${msg} arg: ${JSON.stringify(arg)}`
    );
    socket.emit(msg, arg);
  }

  checkVictory(): boolean {
    this.inGamePlayerList = this.inGamePlayerList.filter(
      (player) => player.getState() == "inGame"
    );
    return this.inGamePlayerList.length == 1;
  }

  save(): void {
    if (this.save1Enable) {
      const gameSave: GameSave = {
        name: this.name,
        state: this.state,
        deck: this.deck,
        activePlayerIndex: this.activePlayerIndex,
        playerList: this.playerList.map(function (player) {
          return {
            userId: player.userId,
            state: player.getState(),
            hand: player.getHand(),
            faceUp: player.getFaceUp(),
            balance: player.getBalance(),
          };
        }),
        action: this.action
          ? {
              id: this.action.id,
              state: this.action.getState(),
              askPlayerIndex: this.action.getAskPlayerIndex
                ? this.action.getAskPlayerIndex()
                : undefined,
              counteraction: this.action.counteraction
                ? {
                    state: this.action.counteraction.getState(),
                    askPlayerIndex:
                      this.action.counteraction.getAskPlayerIndex(),
                    challenge: this.action.counteraction.challenge
                      ? {
                          state: this.action.counteraction.challenge.getState(),
                          loserIndex:
                            this.action.counteraction.challenge.getLoserIndex(),
                        }
                      : undefined,
                  }
                : undefined,
              challenge: this.action.challenge
                ? {
                    state: this.action.challenge.getState(),
                    loserIndex: this.action.challenge.getLoserIndex(),
                  }
                : undefined,
              targetIndex: this.action.targetIndex
                ? this.action.targetIndex
                : undefined,
            }
          : undefined,
      };
      try {
        fs.accessSync("coupSave");
      } catch (e) {
        fs.mkdirSync("coupSave");
      }
      fs.writeFileSync(`coupSave/${this.id}.json`, JSON.stringify(gameSave));
    }
  }

  save2() {
    try {
      fs.accessSync("coupSave");
    } catch (e) {
      fs.mkdirSync("coupSave");
    }
    fs.writeFileSync(
      `coupSave/${this.id}.json`,
      JSON.stringify(this.save2Buffer)
    );
  }

  createSnapshot(recordId: number): Game {
    logger.info(
      `${filename} - Creating snapshot at Game#${this.id} record:${recordId}`
    );
    return new Game(this.id, this.io, {
      snapshotMode: true,
      save2: true,
      recordId: recordId,
    });
  }

  transition(arg?: transitionArgument) {
    switch (this.state) {
      case "askAction": {
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
                this.ioEmit("askAction", {
                  userId: this.inGamePlayerList[this.activePlayerIndex].userId,
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
                this.ioEmit("askAction", {
                  userId: this.inGamePlayerList[this.activePlayerIndex].userId,
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
          this.addTransitionRecord({
            arg: arg,
            msg: `[p${
              this.inGamePlayerList[this.activePlayerIndex].userId
            }] use [a${arg.chosenAction}]`,
          });
          this.state = "resolvingAction";
          this.action?.transition();
        }
        break;
      }
      case "resolvingAction": {
        if (this.action?.getState() == "finish") {
          this.action = null;
          if (this.checkVictory()) {
            this.state = "finish";
            this.ioEmit("finish", {
              userId: this.inGamePlayerList[0].userId,
              gameName: this.name,
            });
            updateWinner(this.id, this.inGamePlayerList[0].userId);
          } else {
            if (this.activePlayerIndex >= this.inGamePlayerList.length - 1) {
              this.activePlayerIndex = 0;
            } else {
              this.activePlayerIndex++;
            }
            this.state = "askAction";
            this.ioEmit("askAction", {
              userId: this.inGamePlayerList[this.activePlayerIndex].userId,
            });
          }
        } else {
          this.action?.transition(arg);
        }
        break;
      }
    }
    this.save();
  }
}

/* --------------------------------- Action --------------------------------- */
interface Action {
  id: number;
  challenge?: Challenge | null;
  counteraction?: Counteraction | null;
  targetIndex?: number | null;
  transition(arg?: transitionArgument): void;
  setActionValid(result: boolean): void;
  getState(): string;
  getAskPlayerIndex?(): number;
}

/* --------------------------------- Income --------------------------------- */
class Income implements Action {
  public readonly id = 1;
  private state: string;
  private actionValid: boolean = true;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number,
    saveData?: Omit<ActionSave, "id">
  ) {
    this.state = saveData ? saveData.state : "effect";
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  transition(arg?: transitionArgument): void {
    this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(1);
    this.state = "finish";
    this.callingGame.transition();
    this.callingGame.save();
  }
}

/* ------------------------------- Foreign Aid ------------------------------ */
class ForeignAid implements Action {
  public readonly id = 2;
  private state: string;
  private askPlayerIndex: number = -1;
  public counteraction: Counteraction | null = null;
  private actionValid: boolean = true;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number,
    saveData?: Omit<ActionSave, "id">
  ) {
    this.state = saveData ? saveData.state : "askCounterAction";
    this.askPlayerIndex =
      saveData && saveData.askPlayerIndex ? saveData.askPlayerIndex : -1;
    this.counteraction =
      saveData && saveData.counteraction
        ? new Counteraction(
            this.callingGame,
            this,
            this.askPlayerIndex,
            saveData.counteraction
          )
        : null;
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskPlayerIndex(): number {
    return this.askPlayerIndex;
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askCounterAction": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.counteraction
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] block!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.counteraction) {
          this.state = "resolveCounterAction";
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.askPlayerIndex
          );
          this.counteraction.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.activePlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex === this.callingGame.inGamePlayerList.length
            ) {
              this.state = "effect";
              this.transition();
              return;
            }
          }
          this.callingGame.ioEmit("askCounterAction", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
          });
        } else {
          this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(
            2
          );
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else {
          this.counteraction = null;
          if (this.actionValid) {
            this.callingGame.inGamePlayerList[
              this.activePlayerIndex
            ].addBalance(2);
          }
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
    this.callingGame.save();
  }
}

/* ---------------------------------- Coup ---------------------------------- */
class Coup implements Action {
  public readonly id = 3;
  private state: string;
  public targetIndex: number | null;
  private actionValid: boolean = true;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number,
    saveData?: Omit<ActionSave, "id">
  ) {
    this.state = saveData ? saveData.state : "askTarget";
    this.targetIndex =
      saveData && saveData.targetIndex ? saveData.targetIndex : null;
    if (!saveData) {
      this.callingGame.inGamePlayerList[this.activePlayerIndex].lowerBalance(7);
    }
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askTarget": {
        if (arg && arg.targetId) {
          this.targetIndex = this.callingGame.getPlayerIndexById(arg.targetId);
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: `[p${
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userId
            }] target [p${
              this.callingGame.inGamePlayerList[this.targetIndex].userId
            }]`,
          });
          this.state = "askCard";
          this.transition();
        } else {
          this.callingGame.ioEmit("askTarget", {
            userId:
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userId,
          });
        }
        break;
      }
      case "askCard": {
        if (arg && arg.chosenCard && this.targetIndex !== null) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: `[p${
              this.callingGame.inGamePlayerList[this.targetIndex].userId
            }] reveal [c${arg.chosenCard}]`,
          });
          this.callingGame.inGamePlayerList[this.targetIndex].loseInfluence(
            arg.chosenCard
          );
          this.state = "finish";
          this.callingGame.transition();
        } else if (this.targetIndex !== null) {
          this.callingGame.ioEmit("askCard", {
            userId: this.callingGame.inGamePlayerList[this.targetIndex].userId,
            hand: this.callingGame.inGamePlayerList[this.targetIndex].getHand(),
            faceUp:
              this.callingGame.inGamePlayerList[this.targetIndex].getFaceUp(),
          });
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
    this.callingGame.save();
  }
}

/* ----------------------------------- Tax ---------------------------------- */
class Tax implements Action {
  public readonly id = 4;
  private state: string;
  private askPlayerIndex: number;
  public challenge: Challenge | null;
  private actionValid: boolean = true;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number,
    saveData?: Omit<ActionSave, "id">
  ) {
    this.state = saveData ? saveData.state : "askChallenge";
    this.askPlayerIndex =
      saveData && saveData.askPlayerIndex ? saveData.askPlayerIndex : -1;
    this.challenge =
      saveData && saveData.challenge
        ? new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex,
            saveData.challenge
          )
        : null;
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askChallenge": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.challenge
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] challenge!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.activePlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex === this.callingGame.inGamePlayerList.length
            ) {
              this.state = "effect";
              this.transition();
              return;
            }
          }
          this.callingGame.ioEmit("askChallenge", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
          });
        } else {
          this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(
            3
          );
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else {
          this.challenge = null;
          if (this.actionValid) {
            this.callingGame.inGamePlayerList[
              this.activePlayerIndex
            ].addBalance(3);
          }
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
    }
    this.callingGame.save();
  }
}

/* ------------------------------ Assassinate; ------------------------------ */
class Assassinate implements Action {
  public readonly id = 5;
  private state: string;
  private askPlayerIndex: number = -1;
  public counteraction: Counteraction | null;
  public challenge: Challenge | null;
  public targetIndex: number | null = null;
  private actionValid: boolean = true;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number,
    saveData?: Omit<ActionSave, "id">
  ) {
    this.state = saveData ? saveData.state : "askTarget";
    this.askPlayerIndex =
      saveData && saveData.askPlayerIndex ? saveData.askPlayerIndex : -1;
    this.counteraction =
      saveData && saveData.counteraction
        ? new Counteraction(
            this.callingGame,
            this,
            this.askPlayerIndex,
            saveData.counteraction
          )
        : null;
    this.challenge =
      saveData && saveData.challenge
        ? new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex,
            saveData.challenge
          )
        : null;
    this.targetIndex =
      saveData && saveData.targetIndex ? saveData.targetIndex : null;
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskPlayerIndex(): number {
    return this.askPlayerIndex;
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askTarget": {
        if (arg && arg.targetId) {
          this.targetIndex = this.callingGame.getPlayerIndexById(arg.targetId);
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: `[p${
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userId
            }] target [p${
              this.callingGame.inGamePlayerList[this.targetIndex].userId
            }]`,
          });
          this.state = "askChallenge";
          this.transition();
        } else {
          this.callingGame.ioEmit("askTarget", {
            userId:
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userId,
          });
        }
        break;
      }
      case "askChallenge": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.challenge
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] challenge!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.activePlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex === this.callingGame.inGamePlayerList.length
            ) {
              this.callingGame.inGamePlayerList[
                this.activePlayerIndex
              ].lowerBalance(3);
              this.askPlayerIndex = -1;
              this.state = "askCounterAction";
              this.transition();
              return;
            }
          }
          this.callingGame.ioEmit("askChallenge", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
          });
        } else {
          this.callingGame.inGamePlayerList[
            this.activePlayerIndex
          ].lowerBalance(3);
          this.askPlayerIndex = -1;
          this.state = "askCounterAction";
          this.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.challenge = null;
          this.callingGame.inGamePlayerList[
            this.activePlayerIndex
          ].lowerBalance(3);
          this.askPlayerIndex = -1;
          this.state = "askCounterAction";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      case "askCounterAction": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.counteraction
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] block!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.counteraction) {
          this.state = "resolveCounterAction";
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.askPlayerIndex
          );
          this.counteraction.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.activePlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex ===
                this.callingGame.inGamePlayerList.length &&
              this.targetIndex !== null
            ) {
              this.state = "askCard";
              this.transition();
              return;
            }
          }
          this.callingGame.ioEmit("askCounterAction", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
          });
        } else if (this.targetIndex !== null) {
          this.state = "askCard";
          this.transition();
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else if (this.actionValid && this.targetIndex !== null) {
          this.counteraction = null;
          this.state = "askCard";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      case "askCard": {
        if (this.targetIndex !== null) {
          if (arg && arg.chosenCard) {
            this.callingGame.addTransitionRecord({
              arg: arg,
              msg: `[p${
                this.callingGame.inGamePlayerList[this.targetIndex].userId
              }] reveal [c${arg.chosenCard}]`,
            });
            this.callingGame.inGamePlayerList[this.targetIndex].loseInfluence(
              arg.chosenCard
            );
            this.state = "finish";
            this.callingGame.transition();
          } else {
            this.callingGame.ioEmit("askCard", {
              userId:
                this.callingGame.inGamePlayerList[this.targetIndex].userId,
              hand: this.callingGame.inGamePlayerList[
                this.targetIndex
              ].getHand(),
              faceUp:
                this.callingGame.inGamePlayerList[this.targetIndex].getFaceUp(),
            });
          }
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
    this.callingGame.save();
  }
}

/* -------------------------------- Exchange -------------------------------- */
class Exchange implements Action {
  public readonly id = 6;
  private state: string;
  private askPlayerIndex: number;
  public challenge: Challenge | null;
  private actionValid: boolean = true;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number,
    saveData?: Omit<ActionSave, "id">
  ) {
    this.state = saveData ? saveData.state : "askChallenge";
    this.askPlayerIndex =
      saveData && saveData.askPlayerIndex ? saveData.askPlayerIndex : -1;
    this.challenge =
      saveData && saveData.challenge
        ? new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex,
            saveData.challenge
          )
        : null;
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskPlayerIndex(): number {
    return this.askPlayerIndex;
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askChallenge": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.challenge
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] challenge!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.activePlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex === this.callingGame.inGamePlayerList.length
            ) {
              this.callingGame.inGamePlayerList[this.activePlayerIndex].addHand(
                this.callingGame.drawCard(2)
              );
              this.state = "askCard";
              this.transition();
              return;
            }
          }
          this.callingGame.ioEmit("askChallenge", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
          });
        } else {
          this.callingGame.inGamePlayerList[this.activePlayerIndex].addHand(
            this.callingGame.drawCard(2)
          );
          this.state = "askCard";
          this.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.challenge = null;
          this.callingGame.inGamePlayerList[this.activePlayerIndex].addHand(
            this.callingGame.drawCard(2)
          );
          this.state = "askCard";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      case "askCard": {
        if (arg && arg.chosenCard) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: `[p${
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userId
            }] return a card to the deck`,
          });
          this.callingGame.addToDeck(arg.chosenCard);
          this.callingGame.inGamePlayerList[this.activePlayerIndex].discardHand(
            arg.chosenCard
          );
          if (
            (this.callingGame.inGamePlayerList[
              this.activePlayerIndex
            ].getHand().length = 2)
          ) {
            this.state = "finish";
            this.callingGame.transition();
          }
        }
        this.callingGame.ioEmit("askCard", {
          userId:
            this.callingGame.inGamePlayerList[this.activePlayerIndex].userId,
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
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
    this.callingGame.save();
  }
}

/* ---------------------------------- Steal --------------------------------- */
class Steal implements Action {
  public readonly id = 7;
  private state: string;
  private askPlayerIndex: number;
  public counteraction: Counteraction | null;
  public challenge: Challenge | null;
  public targetIndex: number | null;
  private actionValid: boolean = true;
  constructor(
    public readonly callingGame: Game,
    public readonly activePlayerIndex: number,
    saveData?: Omit<ActionSave, "id">
  ) {
    this.state = saveData ? saveData.state : "askTarget";
    this.askPlayerIndex =
      saveData && saveData.askPlayerIndex ? saveData.askPlayerIndex : -1;
    this.counteraction =
      saveData && saveData.counteraction
        ? new Counteraction(
            this.callingGame,
            this,
            this.askPlayerIndex,
            saveData.counteraction
          )
        : null;
    this.challenge =
      saveData && saveData.challenge
        ? new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex,
            saveData.challenge
          )
        : null;
    this.targetIndex =
      saveData && saveData.targetIndex ? saveData.targetIndex : null;
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskPlayerIndex(): number {
    return this.askPlayerIndex;
  }

  actionEffect(): void {
    if (this.targetIndex !== null) {
      const targetBalance =
        this.callingGame.inGamePlayerList[this.targetIndex].getBalance();
      if (targetBalance < 2) {
        this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(
          targetBalance
        );
        this.callingGame.inGamePlayerList[this.targetIndex].lowerBalance(
          targetBalance
        );
      } else {
        this.callingGame.inGamePlayerList[this.activePlayerIndex].addBalance(2);
        this.callingGame.inGamePlayerList[this.targetIndex].lowerBalance(2);
      }
    }
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askTarget": {
        if (arg && arg.targetId) {
          this.targetIndex = this.callingGame.getPlayerIndexById(arg.targetId);
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: `[p${
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userId
            }] target [p${
              this.callingGame.inGamePlayerList[this.targetIndex].userId
            }]`,
          });
          this.state = "askChallenge";
          this.transition();
        } else {
          this.callingGame.ioEmit("askTarget", {
            userId:
              this.callingGame.inGamePlayerList[this.activePlayerIndex].userId,
          });
        }
        break;
      }
      case "askChallenge": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.challenge
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] challenge!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.activePlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.activePlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex === this.callingGame.inGamePlayerList.length
            ) {
              this.askPlayerIndex = -1;
              this.state = "askCounterAction";
              this.transition();
              return;
            }
          }
          this.callingGame.ioEmit("askChallenge", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
          });
        } else {
          this.askPlayerIndex = -1;
          this.state = "askCounterAction";
          this.transition();
        }
        break;
      }
      case "resolveChallenge": {
        if (this.challenge?.getState() !== "finish") {
          this.challenge?.transition(arg);
        } else if (this.actionValid) {
          this.challenge = null;
          this.askPlayerIndex = -1;
          this.state = "askCounterAction";
          this.transition();
        } else {
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      case "askCounterAction": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.counteraction
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] block!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.counteraction) {
          this.state = "resolveCounterAction";
          this.counteraction = new Counteraction(
            this.callingGame,
            this,
            this.askPlayerIndex
          );
          this.counteraction.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.activePlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex === this.callingGame.inGamePlayerList.length
            ) {
              this.actionEffect();
              this.state = "finish";
              this.callingGame.transition();
              return;
            }
          }
          this.callingGame.ioEmit("askCounterAction", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
          });
        } else {
          this.actionEffect();
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      case "resolveCounterAction": {
        if (this.counteraction?.getState() !== "finish") {
          this.counteraction?.transition(arg);
        } else {
          this.counteraction = null;
          if (this.actionValid) {
            this.actionEffect();
          }
          this.state = "finish";
          this.callingGame.transition();
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
    this.callingGame.save();
  }
}

/* ------------------------------ Counteraction ----------------------------- */
class Counteraction implements Action {
  public id: number;
  private state: string;
  private askPlayerIndex: number;
  public challenge: Challenge | null;
  private actionValid = true;

  constructor(
    private callingGame: Game,
    private callingAction: Action,
    public readonly counteractionPlayerIndex: number,
    saveData?: CounteractionSave
  ) {
    logger.debug(`${filename} - counteraction created`);
    this.id = counteractionMap.get(this.callingAction.id);
    this.state = saveData ? saveData.state : "askChallenge";
    this.askPlayerIndex =
      saveData && saveData.askPlayerIndex ? saveData.askPlayerIndex : -1;
    this.challenge =
      saveData && saveData.challenge
        ? new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.counteractionPlayerIndex
          )
        : null;
  }

  setActionValid(result: boolean): void {
    this.actionValid = result;
  }

  getState(): string {
    return this.state;
  }

  getAskPlayerIndex(): number {
    return this.askPlayerIndex;
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askChallenge": {
        if (arg) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: arg.challenge
              ? `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] challenge!`
              : `[p${
                  this.callingGame.inGamePlayerList[this.askPlayerIndex].userId
                }] pass`,
          });
        }
        if (arg && arg.challenge) {
          this.state = "resolveChallenge";
          this.challenge = new Challenge(
            this.callingGame,
            this,
            this.askPlayerIndex,
            this.counteractionPlayerIndex
          );
          this.challenge.transition();
        } else if (
          this.askPlayerIndex !==
          this.callingGame.inGamePlayerList.length - 1
        ) {
          this.askPlayerIndex++;
          if (this.askPlayerIndex === this.counteractionPlayerIndex) {
            this.askPlayerIndex++;
            if (
              this.askPlayerIndex === this.callingGame.inGamePlayerList.length
            ) {
              this.callingAction.setActionValid(false);
              this.state = "finish";
              this.callingAction.transition(arg);
              break;
            }
          }
          this.callingGame.ioEmit("askChallenge", {
            userId:
              this.callingGame.inGamePlayerList[this.askPlayerIndex].userId,
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
        } else {
          if (this.actionValid) {
            this.callingAction.setActionValid(false);
          }
          this.state = "finish";
          logger.debug(`${filename} - counteraction finish`);
          this.callingAction.transition(arg);
        }
        break;
      }
      default: {
        throw new Error("State: " + this.state + " not supported");
      }
    }
    this.callingGame.save();
  }
}

/* -------------------------------- Challenge ------------------------------- */
class Challenge {
  private state: string = "askCard";
  private loserIndex: number;
  constructor(
    private callingGame: Game,
    private callingAction: Action,
    public readonly challengerIndex: number,
    public readonly targetIndex: number,
    saveData?: ChallengeSave
  ) {
    logger.debug(`${filename} - challenge created`);
    if (saveData) {
      this.state = saveData.state;
      this.loserIndex = saveData.loserIndex;
    } else {
      const matchCardId = this.callingGame.inGamePlayerList[this.targetIndex]
        .getHand()
        .find((handCardId) =>
          actionIdMap.get(this.callingAction.id).includes(handCardId)
        );
      const targetBluff = matchCardId === undefined;
      this.loserIndex = targetBluff ? this.targetIndex : this.challengerIndex;
      this.callingGame.ioEmit(
        "message",
        `User ${this.callingGame.inGamePlayerList[this.targetIndex].userId} ${
          targetBluff ? "bluff" : "saying truth"
        }!<br>`
      );
      this.callingAction.setActionValid(!targetBluff);
      if (!targetBluff) {
        this.callingGame.addToDeck(matchCardId);
        this.callingGame.inGamePlayerList[this.targetIndex].discardHand(
          matchCardId
        );
        this.callingGame.shuffleDeck();
        this.callingGame.inGamePlayerList[this.targetIndex].addHand(
          this.callingGame.drawCard(1)
        );
      }
    }
  }

  getState(): string {
    return this.state;
  }

  getLoserIndex(): number {
    return this.loserIndex;
  }

  transition(arg?: transitionArgument): void {
    switch (this.state) {
      case "askCard": {
        if (arg && arg.chosenCard) {
          this.callingGame.addTransitionRecord({
            arg: arg,
            msg: `[p${
              this.callingGame.inGamePlayerList[this.loserIndex].userId
            }] reveal [c${arg.chosenCard}]`,
          });
          this.callingGame.inGamePlayerList[this.loserIndex].loseInfluence(
            arg.chosenCard
          );
          this.state = "finish";
          logger.debug(`${filename} - challenge finish`);
          this.callingAction.transition();
        } else {
          this.callingGame.ioEmit("askCard", {
            userId: this.callingGame.inGamePlayerList[this.loserIndex].userId,
            hand: this.callingGame.inGamePlayerList[this.loserIndex].getHand(),
            faceUp:
              this.callingGame.inGamePlayerList[this.loserIndex].getFaceUp(),
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
