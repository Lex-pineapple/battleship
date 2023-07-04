import Player from './player';
import { IPlayer } from 'src/types';

class DB {
  clientDB: IPlayer[] = [];
  roomDB: any = [];

  addPlayer(player: IPlayer) {
    this.clientDB.push(player);
  }

  getPlayer(id: number) {
    return this.clientDB.find((item) => item.id === id);
  }

  createRoom(player: Player) {
    const newRoom = {
      roomId: this.roomDB.length,
      roomUsers: [
        {
          name: player.name,
          index: this.clientDB.indexOf(player),
        },
      ],
    };
    this.roomDB.push(newRoom);
    return newRoom;
  }

  getRoom(roomIdx: number) {
    return this.roomDB.find((item: { roomId: number }) => item.roomId === roomIdx);
  }

  addToRoom(roomId: number, player: Player) {
    if (this.roomDB[roomId].player1 && this.roomDB[roomId].player2) return false;
    else if (this.roomDB[roomId].player1 === null) {
      this.roomDB[roomId].player1 = player;
      return true;
    } else if (this.roomDB[roomId].player2 === null) {
      this.roomDB[roomId].player2 = player;
      return true;
    } else return false;
  }
}

export default DB;
