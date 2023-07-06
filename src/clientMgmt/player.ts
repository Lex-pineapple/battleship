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
}

export default Player;
