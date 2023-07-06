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
}

export default GameDB;
