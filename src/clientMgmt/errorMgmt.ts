import { innerUpdTemplate } from '../clientMgmt/resTemplates';

class ErrorMgmt {
  static createAuthErrorMsg(index: number, id: number, msg: string, name?: string) {
    return JSON.stringify({
      type: 'reg',
      data: JSON.stringify({
        name: name && '',
        index,
        error: true,
        errorText: msg,
      }),
      id,
    });
  }

  static createGenErrResp() {
    const updData = innerUpdTemplate;
    const data = [
      JSON.stringify({
        type: 'error',
        data: '',
        id: 0,
      }),
    ];
    updData.current = { data };
    return updData;
  }
}

export default ErrorMgmt;
