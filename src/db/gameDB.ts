import { IGameDBReckord, IGameDBReckordPlayer } from 'src/types';

class GameDB {
  reckords: IGameDBReckord[];
  constructor() {
    this.reckords = [];
  }

  createNewGame(gameId: number) {
    this.reckords.push({
      gameId,
      players: [],
    });
  }

  addPlayersToGame(gameId: number, players: IGameDBReckordPlayer[]) {
    const game = this.getReckordByID(gameId);
    if (game) {
      game.players = players;
    }
  }

  addReckord(gameId: number, players: IGameDBReckordPlayer[]) {
    this.reckords.push({
      gameId,
      players,
    });
  }

  getReckordByID(id: number) {
    return this.reckords.find((item) => item.gameId === id);
  }

  getReckordByIdx(gameId: number, index: number) {
    const game = this.getReckordByID(gameId);
    return game?.players.find((item) => item.index === index);
  }

  getOppRecordByIdx(gameId: number, index: number) {
    const game = this.getReckordByID(gameId);
    return game?.players.find((item) => item.index !== index);
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
