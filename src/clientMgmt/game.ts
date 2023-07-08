import { IGamePlayers, IRoomDBReckordUser, IShipData, TAttackStatus, WSCommand } from '../types';

interface ICoord {
  attPoint1: number;
  attPoint2: number;
  defPoint1: number;
  defPoint2: number;
}

class Game {
  gameId: number;
  players: IGamePlayers[];
  constructor(
    id: number,
    player1: IRoomDBReckordUser | boolean,
    player2: IRoomDBReckordUser | boolean
  ) {
    this.gameId = id;
    this.players = this.initPlayers(player1, player2);
  }

  initPlayers(player1: IRoomDBReckordUser | boolean, player2: IRoomDBReckordUser | boolean) {
    return [this.createPlayer(player1, 0), this.createPlayer(player2, 0)];
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
  initShipsData(playerIdx: number, ships: WSCommand.IncShipData[]) {
    const player = this.getPlayerByIdx(playerIdx);
    if (player) {
      player.shipsState.totalAlive = ships.length;
      for (let i = 0; i < ships.length; i++) {
        player.shipsState.ships.push({
          ...ships[i],
          slots: new Array(ships[i].length).fill(''),
        });
      }
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
      if (this.ckeckIfMoveValid(x, y, attackerIdx))
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
      else this.rememberMove(x, y, attackerIdx);
      defender.shipsState.ships.forEach((shipData) => {
        if (shipData.direction) {
          const coord = {
            attPoint1: x,
            attPoint2: y,
            defPoint1: shipData.position.x,
            defPoint2: shipData.position.y,
          };
          res = this.calculateShot(coord, shipData.length, defender, shipData);
          // if (
          //   x === shipData.position.x &&
          //   y >= shipData.position.y &&
          //   y <= shipData.position.y + shipData.length - 1
          // ) {
          //   const slotIdx = y - shipData.position.y;
          //   if (!shipData.slots[slotIdx]) {
          //     shipData.slots[slotIdx] = 'x';
          //     if (shipData.slots.find((i) => i === '')) return 'hit';
          //     else {
          //       this.shipsState.totalAlive--;
          //       return 'kill';
          //     }
          //   } else res = 'miss';
          // }
        } else {
          const coord = {
            attPoint1: y,
            attPoint2: x,
            defPoint1: shipData.position.y,
            defPoint2: shipData.position.x,
          };
          res = this.calculateShot(coord, shipData.length, defender, shipData);
          // if (
          //   y === shipData.position.y &&
          //   x >= shipData.position.x &&
          //   x <= shipData.position.x + shipData.length - 1
          // ) {
          //   const slotIdx = x - shipData.position.x;
          //   if (!shipData.slots[slotIdx]) {
          //     shipData.slots[slotIdx] = 'x';
          //     if (shipData.slots.find((i) => i === '')) return 'hit';
          //     else {
          //       this.shipsState.totalAlive--;
          //       return 'kill';
          //     }
          //   } else res = 'miss';
          // }
        }
      });
      if (defender.shipsState.totalAlive === 0) {
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

  calculateShot(coord: ICoord, length: number, defender: IGamePlayers, shipData: IShipData) {
    if (
      coord.attPoint1 === coord.defPoint1 &&
      coord.attPoint2 >= coord.defPoint2 &&
      coord.attPoint2 <= coord.defPoint2 + length - 1
    ) {
      const slotIdx = coord.attPoint2 - coord.defPoint2;
      if (!shipData.slots[slotIdx]) {
        shipData.slots[slotIdx] = 'x';
        if (shipData.slots.find((i) => i === '')) return 'hit';
        else {
          defender.shipsState.totalAlive--;
          return 'kill';
        }
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
    const genShips = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 4; j > 0; j--) {
        genShips.push(this.generateShip(bot, i));
      }
    }
    this.initShipsData(bot.index, genShips);
  }

  generateShip(bot: IGamePlayers, shipLength: number) {
    const types = ['small', 'medium', 'large', 'huge'];
    const tail = {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
    const direction = Math.random() < 0.5;
    const head = direction
      ? { ...tail, y: tail.y + shipLength }
      : { ...tail, x: tail.x + shipLength };
    if (this.checkIfOutOfBounds(head)) this.generateShip(shipLength);
    for (let i = 0; i < bot.shipsState.ships.length; i++) {
      const currLine = {
        tail,
        head,
      };
      const checkLine = {
        tail: {
          x: bot.shipsState.ships[i].position.x,
          y: bot.shipsState.ships[i].position.y,
        },
        head: bot.shipsState.ships[i].direction
          ? {
              x: bot.shipsState.ships[i].position.x,
              y: bot.shipsState.ships[i].position.y + bot.shipsState.ships[i].length - 1,
            }
          : {
              x: bot.shipsState.ships[i].position.x + bot.shipsState.ships[i].length,
              y: bot.shipsState.ships[i].position.y,
            },
      };
      if (this.checkIntercept(currLine, checkLine)) this.generateShip(shipLength);
    }
    return {
      position: {
        x: tail.x,
        y: tail.y,
      },
      direction: direction,
      slots: [],
      length: shipLength,
      type: types[shipLength],
    };
  }

  checkIfOutOfBounds(head: IPoint) {
    if (head.x > 9 || head.y > 9) return true;
    return false;
  }

  checkIntercept(
    currLine: { tail: IPoint; head: IPoint },
    checkLine: { tail: IPoint; head: IPoint }
  ) {
    return (
      this.ccw(currLine.tail, checkLine.tail, checkLine.head) !==
        this.ccw(currLine.head, checkLine.tail, checkLine.head) &&
      this.ccw(currLine.tail, currLine.head, checkLine.tail) !==
        this.ccw(currLine.tail, currLine.head, checkLine.head)
    );
  }

  ccw(A: IPoint, B: IPoint, C: IPoint) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  }
}

interface IPoint {
  x: number;
  y: number;
}

export default Game;
