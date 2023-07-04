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
}

export default ErrorMgmt;
