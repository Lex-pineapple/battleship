import { WSCommand } from 'src/types';

class DataValidator {
  static validateRawData(data: any) {
    if (data instanceof Object) {
      console.log(data);

      console.log('type' in data, typeof data.type === 'string');

      if (!('type' in data && typeof data.type === 'string')) return false;
      if (!('data' in data && data.data instanceof Object)) return false;
      if (!('id' in data && typeof data.id === 'number')) return false;
      return true;
    } else return false;
  }

  static validateAuthData(data: WSCommand.IAuthReqData) {
    if (!('name' in data && typeof data.name === 'string')) return false;
    if (!('password' in data && typeof data.password === 'string')) return false;
    return true;
  }
}

export default DataValidator;
