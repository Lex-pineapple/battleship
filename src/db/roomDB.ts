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
      if (room.roomUsers.length === 1)
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
}

export default RoomDB;
