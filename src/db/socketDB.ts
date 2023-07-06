import ws from 'ws';

interface ISocketReckords {
  id: number;
  socket: ws;
}

class SocketDB {
  reckords: ISocketReckords[];
  constructor() {
    this.reckords = [];
  }

  addReckord(id: number, socket: ws) {
    this.reckords.push({
      id,
      socket,
    });
  }

  getReckordByID(id: number) {
    return this.reckords.find((item) => item.id === id);
  }
}

export default SocketDB;
