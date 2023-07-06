import Player from '../clientMgmt/player';

class UserDB {
  reckords: Player[];
  constructor() {
    this.reckords = [];
  }

  addReckord(player: Player) {
    this.reckords.push(player);
  }

  getReckordByID(id: number) {
    return this.reckords.find((item) => item.id === id);
  }
}

export default UserDB;
