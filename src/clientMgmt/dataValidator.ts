class DataValidator {
  static validateRawData(data: unknown) {
    if (data instanceof Object) {
      if (!('type' in data && typeof data.type === 'string')) return false;
      if (!('data' in data && typeof data.data === 'string')) return false;
      if (!('id' in data && typeof data.id === 'number')) return false;
      return true;
    } else return false;
  }

  static validateAuthData(data: unknown) {
    if (data instanceof Object) {
      if (!('name' in data && typeof data.name === 'string')) return false;
      if (!('password' in data && typeof data.password === 'string')) return false;
    }
    return true;
  }
}

export default DataValidator;
