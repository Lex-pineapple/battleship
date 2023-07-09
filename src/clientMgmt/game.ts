import { IGamePlayers, IRoomDBReckordUser, IShipData, TAttackStatus, WSCommand } from '../types';

class Game {
  gameId: number;
  playerTurnIdx: number;
  players: IGamePlayers[];
  constructor(
    id: number,
    player1: IRoomDBReckordUser | boolean,
    player2: IRoomDBReckordUser | boolean
  ) {
    this.gameId = id;
    this.playerTurnIdx = 0;
    this.players = this.initPlayers(player1, player2);
  }

  initPlayers(player1: IRoomDBReckordUser | boolean, player2: IRoomDBReckordUser | boolean) {
    return [this.createPlayer(player1, 0), this.createPlayer(player2, 1)];
  }

  createPlayer(player: IRoomDBReckordUser | boolean, idx: number) {
    if (player && player instanceof Object)
      return {
        type: 'user',
        index: idx,
        id: player.id,
        name: player.name,
        shipsState: {
          totalAlive: 0,
          ships: [],
        },
        moves: [],
      };
    else
      return {
        type: 'bot',
        index: idx,
        id: null,
        name: 'Happy Bot',
        shipsState: {
          totalAlive: 0,
          ships: [],
        },
        moves: [],
      };
  }

  getPlayerByIdx(index: number) {
    return this.players.find((item) => item.index === index);
  }

  getPlayerById(id: number) {
    return this.players.find((item) => item.id === id);
  }

  hasBotPlayer() {
    const botPlayer = this.players.find((player) => player.type === 'bot');
    return botPlayer;
  }

  // Player section
  initShipsData(playerIdx: number, ships: WSCommand.IGenShipData[]) {
    const player = this.getPlayerByIdx(playerIdx);

    if (player) {
      player.shipsState.totalAlive = ships.length;
      for (let i = 0; i < ships.length; i++) {
        player.shipsState.ships.push({
          ...ships[i],
          slots: new Array(ships[i].length).fill(''),
        });
      }
      // if (player.type === 'bot') console.log(player.shipsState.ships);
    }
  }

  checkShipsFill() {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].shipsState.totalAlive === 0) return false;
    }
    return true;
  }

  calculateAttack(attackerIdx: number, defenderIdx: number, x: number, y: number) {
    const defender = this.getPlayerByIdx(defenderIdx);

    let res: TAttackStatus = 'miss';
    if (defender) {
      if (this.ckeckIfMoveValid(x, y, attackerIdx)) {
        res = 'shot';
        return {
          finished: false,
          data: {
            position: {
              x,
              y,
            },
            currentPlayer: attackerIdx,
            status: res,
          },
        };
      }
      for (let i = 0; i < defender.shipsState.ships.length; i++) {
        const shipData = defender.shipsState.ships[i];
        if (x === shipData.position.x && y === shipData.position.y) {
          const slotIdx = 0;
          res = this.shoot(shipData, slotIdx, defender);
          break;
        }
        if (shipData.direction) {
          if (
            x === shipData.position.x &&
            y >= shipData.position.y &&
            y <= shipData.position.y + shipData.length - 1
          ) {
            const slotIdx = y - shipData.position.y;
            res = this.shoot(shipData, slotIdx, defender);
            if (res === 'shot' || res === 'killed') break;
          }
        } else {
          if (
            y === shipData.position.y &&
            x >= shipData.position.x &&
            x <= shipData.position.x + shipData.length - 1
          ) {
            const slotIdx = x - shipData.position.x;
            res = this.shoot(shipData, slotIdx, defender);
            if (res === 'shot' || res === 'killed') break;
          }
        }
      }
      if (defender.shipsState.totalAlive <= 0) {
        return {
          finished: true,
          data: {
            position: {
              x,
              y,
            },
            currentPlayer: attackerIdx,
            status: res,
          },
        };
      }
    }

    // console.log('defender total ships', defender?.shipsState.totalAlive);

    return {
      finished: false,
      data: {
        position: {
          x,
          y,
        },
        currentPlayer: attackerIdx,
        status: res,
      },
    };
  }

  shoot(shipData: IShipData, slotIdx: number, defender: IGamePlayers) {
    if (!shipData.slots[slotIdx]) {
      shipData.slots[slotIdx] = 'x';

      if (shipData.slots.find((i) => i === '') !== undefined) return 'shot';
      else {
        defender.shipsState.totalAlive--;
        return 'killed';
      }
    }
    return 'miss';
  }

  generateRandomMove(attackerIdx: number) {
    const attacker = this.getPlayerByIdx(attackerIdx);

    const move = {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
    if (attacker && attacker.moves.some((e) => e.x === move.x && e.y === move.y))
      this.generateRandomMove(attackerIdx);
    return move;
  }

  ckeckIfMoveValid(x: number, y: number, attackerIdx: number) {
    const attacker = this.getPlayerByIdx(attackerIdx);
    if (attacker) return attacker.moves.find((move) => move.x === x && move.y === y);
  }

  rememberMove(x: number, y: number, attackerIdx: number) {
    const attacker = this.getPlayerByIdx(attackerIdx);
    if (attacker)
      attacker.moves.push({
        x,
        y,
      });
  }

  createRandomShips(bot: IGamePlayers) {
    const types: ['small', 'medium', 'large', 'huge'] = ['small', 'medium', 'large', 'huge'];
    // const genShips: WSCommand.IGenShipData[] = [];
    const board = Array(10)
      .fill(0)
      .map(() => Array(10).fill(0));
    const coords: WSCommand.IGenShipData[] = [];
    const shipLengths = [4, 3, 2, 1];
    for (const shipLength of shipLengths) {
      for (let i = 0; i < shipLengths[shipLength - 1]; i++) {
        let shipPlaced = false;
        while (!shipPlaced) {
          const head = {
            x: Math.floor(Math.random() * 10),
            y: Math.floor(Math.random() * 10),
          };
          const direction = Math.random() < 0.5;
          let tail;
          if (direction) {
            tail = {
              x: head.x,
              y: head.y + shipLength - 1,
            };
          } else {
            tail = {
              x: head.x + shipLength - 1,
              y: head.y,
            };
          }

          if (tail.x >= 0 && tail.x <= 9 && tail.y >= 0 && tail.y <= 9) {
            const NSmin = Math.min(head.x, tail.x);
            // const NSmax = Math.max(head.x, tail.x);
            const EWmin = Math.min(head.y, tail.y);
            // const EWmax = Math.max(head.y, tail.y);

            let sum = 0;
            const EWT = EWmin - 1;
            const NST = NSmin - 1;
            if (direction) {
              sum = board.reduce((acc, curr, i) => {
                if (i >= EWT && i < EWT + shipLength + 2) {
                  return (
                    acc +
                    curr.reduce((acc2, curr2, i) => {
                      if (i >= NST && i < NST + 3) {
                        return acc2 + curr2;
                      }
                      return acc2;
                    }, 0)
                  );
                }
                return acc;
              }, 0);
              // let EWminT = EWmin;
              // for (let i = 0; i < shipLength; i++) {
              //   // console.log(board[EWmin++][NSmin]);

              //   sum = sum + board[EWminT++][NSmin];
              //   // console.log(EWminT, NSmin);
            } else {
              sum = board.reduce((acc, curr, i) => {
                if (i >= EWT && i < EWT + 3) {
                  return (
                    acc +
                    curr.reduce((acc2, curr2, i) => {
                      if (i >= NST && i < NST + shipLength + 2) {
                        return acc2 + curr2;
                      }
                      return acc2;
                    }, 0)
                  );
                }
                return acc;
              }, 0);
              // let NSminT = NSmin;

              // for (let i = 0; i < shipLength; i++) {
              //   sum = sum + board[EWmin][NSminT++];
            }
            if (sum === 0) {
              if (direction) {
                let EWminT = EWmin;
                coords.push({
                  position: {
                    y: EWminT,
                    x: NSmin,
                  },
                  direction,
                  length: shipLength,
                  type: types[shipLength - 1],
                  slots: [],
                });

                for (let i = 0; i < shipLength; i++) {
                  // console.log(board[EWmin++][NSmin]);
                  board[EWminT++][NSmin] = 1;
                }
              } else {
                let NSminT = NSmin;
                coords.push({
                  position: {
                    y: EWmin,
                    x: NSminT,
                  },
                  direction,
                  length: shipLength,
                  type: types[shipLength - 1],
                  slots: [],
                });

                for (let i = 0; i < shipLength; i++) {
                  board[EWmin][NSminT++] = 1;
                }
              }
              shipPlaced = true;
            }
          }
        }
      }
    }

    this.initShipsData(bot.index, coords);
  }
}

// interface IPoint {
//   x: number;
//   y: number;
// }

export default Game;
