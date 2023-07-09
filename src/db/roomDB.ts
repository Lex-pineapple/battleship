import { IRoomDBReckord } from 'src/types';

class RoomDB {
  reckords: IRoomDBReckord[];
  constructor() {
    this.reckords = [];
  }

  createEmptyReckord() {
    this.reckords.push({
      roomId: this.reckords.length,
      roomUsers: [],
      inGame: false,
    });
  }

  addReckord(data: IRoomDBReckord) {
    this.reckords.push(data);
  }

  addUserToRoom(roomId: number, name: string, id: number) {
    const room = this.getReckordByID(roomId);
    if (room) {
      if (room.roomUsers.length === 0)
        room.roomUsers.push({
          name,
          index: 0,
          id,
        });
      else if (room.roomUsers.length === 1)
        room.roomUsers.push({
          name,
          index: 1,
          id,
        });
    }
  }

  getReckordByID(id: number) {
    return this.reckords.find((item) => item.roomId === id);
  }

  getUserById(roomId: number, id: number) {
    const room = this.getReckordByID(roomId);
    return room?.roomUsers.find((item) => {
      if (typeof item !== 'boolean') return item.id === id;
    });
  }

  deleteReckordById(id: number) {
    const reckord = this.getReckordByID(id);
    if (reckord) {
      const reckordIdx = this.reckords.indexOf(reckord);
      if (reckordIdx > -1) this.reckords.splice(reckordIdx, 1);
    }
  }
}

export default RoomDB;
