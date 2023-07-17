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

  getWinners() {
    const winners = this.reckords
      .filter((reckord) => reckord.wins > 0)
      .map((reckord) => {
        return {
          name: reckord.name,
          wins: reckord.wins,
        };
      });
    winners.sort((a, b) => b.wins - a.wins);
    return winners;
  }

  deleteReckordById(id: number) {
    const reckord = this.getReckordByID(id);
    if (reckord) {
      const reckordIdx = this.reckords.indexOf(reckord);
      if (reckordIdx > -1) this.reckords.splice(reckordIdx, 1);
    }
  }
}

export default UserDB;
