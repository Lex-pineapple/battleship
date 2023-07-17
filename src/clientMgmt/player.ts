import parseRawData from '../utils/parseRawData';
import DataValidator from './dataValidator';
import { WSCommand } from 'src/types';

class Player {
  id: number;
  name: string;
  password: string;
  wins: number;
  roomStat: {
    inRoom: boolean;
    roomId: number | null;
  };
  gameStat: {
    inGame: boolean;
    gameId: number | null;
  };
  constructor(id: number) {
    this.id = id;
    this.name = '';
    this.password = '';
    this.wins = 0;
    this.roomStat = {
      inRoom: false,
      roomId: null,
    };
    this.gameStat = {
      inGame: false,
      gameId: null,
    };
  }

  async authorisePlayer(idx: number, userData: string): Promise<WSCommand.IAuthResData> {
    return new Promise((res) => {
      const parsedData = parseRawData(userData);
      if (parsedData) {
        if (DataValidator.validateAuthData(parsedData)) {
          const authData = parsedData as WSCommand.IAuthReqData;
          this.name = authData.name;
          this.password = authData.password;
          res({
            name: this.name,
            index: idx,
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
      } else
        res({
          name: '',
          index: idx,
          error: true,
          errorText: 'The authorisation data could not be parsed',
        });
    });
  }
}

export default Player;
