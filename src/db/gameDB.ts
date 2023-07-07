import Game from '../clientMgmt/game';

class GameDB {
  reckords: Game[];
  constructor() {
    this.reckords = [];
  }

  addNewGame(game: Game) {
    this.reckords.push(game);
  }

  getReckordByID(id: number) {
    return this.reckords.find((item) => item.gameId === id);
  }

  deleteReckordById(id: number) {
    const reckord = this.getReckordByID(id);
    if (reckord) {
      const reckordIdx = this.reckords.indexOf(reckord);
      if (reckordIdx > -1) this.reckords.splice(reckordIdx, 1);
    }
  }
}

export default GameDB;
