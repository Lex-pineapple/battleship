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

  deleteReckordById(id: number) {
    const reckord = this.getReckordByID(id);
    if (reckord) {
      const reckordIdx = this.reckords.indexOf(reckord);
      if (reckordIdx > -1) this.reckords.splice(reckordIdx, 1);
    }
  }
}

export default SocketDB;
