import parseRawData from '../utils/parseRawData';
import DataValidator from './dataValidator';
import { IShipData, IShipState, WSCommand } from 'src/types';
// import resTemplates from './resTemplates';

class Player {
  id: number;
  name: string;
  password: string;
  wins: number;
  shipsState: IShipState;
  inGame: boolean;
  _randomMoves: {
    x: number;
    y: number;
  }[] = [];
  constructor(id: number) {
    this.id = id;
    this.name = '';
    this.password = '';
    this.inGame = false;
    this.wins = 0;
    this.shipsState = {
      totalAlive: 0,
      ships: [],
    };
  }

  // async delegate(idx: number, data: WSCommand.IGenReq, roomDB: any) {

  // }

  async authorisePlayer(idx: number, userData: string) {
    return new Promise((res) => {
      const parsedData = parseRawData(userData);
      if (!parsedData)
        res({
          name: '',
          index: idx,
          error: true,
          errorText: 'The authorisation data could not be parsed',
        });
      if (DataValidator.validateAuthData(parsedData)) {
        const authData = parsedData as WSCommand.IAuthReqData;
        this.name = authData.name;
        this.password = authData.password;
        res({
          name: this.name,
          index: '',
          error: false,
          errorText: '',
        });
      } else
        res({
          name: '',
          index: idx,
          error: true,
          errorText: 'The login data is incorrect',
        });
    });
  }

  initShipsData(ships: IShipData[]) {
    this.shipsState.totalAlive = ships.length;
    for (let i = 0; i < ships.length; i++) {
      this.shipsState.ships.push({
        ...ships[i],
        slots: new Array(ships[i].length).fill(''),
      });
    }
  }

  calculateAttack(x: number, y: number) {
    let res = 'miss';
    this.shipsState.ships.forEach((shipData) => {
      if (shipData.direction) {
        if (
          x === shipData.position.x &&
          y >= shipData.position.y &&
          y <= shipData.position.y + shipData.length - 1
        ) {
          const slotIdx = y - shipData.position.y;
          if (!shipData.slots[slotIdx]) {
            shipData.slots[slotIdx] = 'x';
            if (shipData.slots.find((i) => i === '')) return 'hit';
            else {
              this.shipsState.totalAlive--;
              return 'kill';
            }
          } else res = 'miss';
        }
      } else {
        if (
          y === shipData.position.y &&
          x >= shipData.position.x &&
          x <= shipData.position.x + shipData.length - 1
        ) {
          const slotIdx = x - shipData.position.x;
          if (!shipData.slots[slotIdx]) {
            shipData.slots[slotIdx] = 'x';
            if (shipData.slots.find((i) => i === '')) return 'hit';
            else {
              this.shipsState.totalAlive--;
              return 'kill';
            }
          } else res = 'miss';
        }
      }
    });
    if (this.shipsState.totalAlive === 0) {
      return {
        finished: true,
        data: {
          position: {
            x,
            y,
          },
          currentPlayer: 0,
          status: res,
        },
      };
    } else {
      return {
        finished: false,
        data: {
          position: {
            x,
            y,
          },
          currentPlayer: 0,
          status: res,
        },
      };
    }
  }

  generateRandomMove() {
    const move = {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
    if (this._randomMoves.some((e) => e.x === move.x && e.y === move.y)) this.generateRandomMove();
    return move;
  }
}

export default Player;
