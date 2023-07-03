import DataValidator from './dataValidator';
import { WSCommand } from 'src/types';

class Player {
  id: number;
  name: string;
  password: string;
  constructor(id: number) {
    this.id = id;
    this.name = '';
    this.password = '';
  }

  async handleRequest(data: WSCommand.IGenReq) {
    switch (data.type) {
      case 'reg':
        return this.authorisePlayer(data.data as WSCommand.IAuthReqData);
      default:
        break;
    }
  }

  async authorisePlayer(userData: WSCommand.IAuthReqData) {
    return new Promise((res, rej) => {
      if (DataValidator.validateAuthData(userData)) {
        this.name = userData.name;
        this.password = userData.password;
        res({
          type: 'reg',
          data: {
            name: this.name,
            index: '',
            error: false,
            errorText: '',
          },
          id: this.id,
        });
      } else
        rej({
          type: 'reg',
          data: {
            name: '',
            index: '',
            error: true,
            errorText: 'Not found',
          },
          id: '',
        });
    });
  }
}

export default Player;
