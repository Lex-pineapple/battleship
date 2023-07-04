import Player from './player';
import { IPlayer, IRoomDBData } from 'src/types';

class DB {
  clientDB: IPlayer[] = [];
  roomDB: IRoomDBData[] = [];

  addPlayer(player: IPlayer) {
    this.clientDB.push(player);
  }

  getPlayerById(id: number) {
    return this.clientDB.find((item) => item.id === id);
  }

  getPlayerIdx(player: Player) {
    return this.clientDB.indexOf(player);
  }

  createRoom() {
    const newRoom = {
      roomId: this.roomDB.length,
      roomUsers: [],
    };
    this.roomDB.push(newRoom);
    return newRoom;
  }

  getRoomByIdx(roomIdx: number) {
    return this.roomDB.find((item: { roomId: number }) => item.roomId === roomIdx);
  }
}

export default DB;
