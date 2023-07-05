import parseRawData from '../utils/parseRawData';
import DataValidator from './dataValidator';
import { WSCommand } from 'src/types';
// import resTemplates from './resTemplates';

class Player {
  id: number;
  name: string;
  password: string;
  wins: number;
  ships: any;
  constructor(id: number) {
    this.id = id;
    this.name = '';
    this.password = '';
    this.wins = 0;
    this.ships = [];
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
}

export default Player;
