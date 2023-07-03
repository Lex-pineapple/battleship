import { IPlayer } from 'src/types';

class DB {
  clientDB: IPlayer[] = [];

  add(player: IPlayer) {
    this.clientDB.push(player);
  }
}

export default DB;
