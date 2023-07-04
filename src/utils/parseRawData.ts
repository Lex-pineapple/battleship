function parseRawData(data: unknown) {
  try {
    if (typeof data === 'string') {
      const parsedData = JSON.parse(data);
      return parsedData;
    } else return false;
  } catch (error) {
    return false;
  }
}

export default parseRawData;
