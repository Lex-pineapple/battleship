import Player from '../clientMgmt/player';
import ws from 'ws';
import DB from '../clientMgmt/db';
import parseRawData from '../utils/parseRawData';
import DataValidator from '../clientMgmt/dataValidator';
import { IPlayer, WSCommand } from 'src/types';
import { resTemplates, innerUpdTemplate } from '../clientMgmt/resTemplates';

class Handler {
  db: DB;
  constructor() {
    this.db = new DB();
  }

  addSocketToDB(id: number, socket: ws) {
    this.db.addSocket(id, socket);
  }

  addPlayerToDB(player: Player) {
    this.db.addPlayer(player);
  }

  async handleMessage(data: string | Buffer[] | Buffer | ArrayBuffer, player: Player) {
    if (typeof data === 'string') {
      const parsedData = parseRawData(data);
      if (DataValidator.validateRawData(parsedData)) {
        const response = await this.delegateRequest(parsedData, player);
        if (response) return response;
        // else return error in []
      }
      // else resturn error in []
    }
    // else return error in []
  }

  async delegateRequest(data: WSCommand.IGenReq, player: Player) {
    const updData = innerUpdTemplate;
    switch (data.type) {
      case 'reg': {
        const clientData = await this.handleReqistration(player, data.data);
        updData.current = { data: clientData };
        return updData;
      }
      case 'create_room': {
        const clientData = this.handleCreateRoom();
        updData.all = { data: clientData };
        return updData;
      }
      case 'add_user_to_room': {
        const clientData = this.handleAddUserToRoom(data.data, player);
        if ('gameId' in clientData && clientData.gameId) {
          updData.all = { data: [this.handleUpdateRoom()] };
          updData.game = { gameId: clientData.gameId, data: clientData.data };
        } else updData.all = clientData;
        return updData;
      }
      case 'add_ships': {
        const clientData = this.handleAddShips(data.data);
        if (clientData) {
          updData.game = clientData;
        }
        return updData;
      }
      default:
        return [
          JSON.stringify({
            type: 'unknown',
            data: '',
            id: player.id,
          }),
        ];
    }
  }

  async handleReqistration(player: Player, data: string) {
    const regRes = resTemplates.reg;
    const playerIdx = player.id;
    const dataResp = await player.authorisePlayer(playerIdx, data);
    regRes.data = JSON.stringify(dataResp);

    return [JSON.stringify(regRes), this.handleUpdateRoom()];
  }

  handleCreateRoom() {
    const resUpdate = resTemplates.update_room;
    this.db.createRoom();
    resUpdate.data = JSON.stringify(this.db.roomDB);
    return [this.handleUpdateRoom()];
  }

  handleAddUserToRoom(data: string, player: Player) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const targetRoom = this.db.getRoomByIdx(parsedData.indexRoom);
    if (targetRoom && targetRoom.roomUsers && targetRoom.roomUsers.length < 2) {
      targetRoom.roomUsers.push({
        name: player.name,
        id: player.id,
      });
      if (targetRoom && targetRoom.roomUsers && targetRoom.roomUsers.length === 2) {
        const createGameData: string[] = [];
        targetRoom.roomUsers.forEach((user) =>
          createGameData.push(this.handleCreateGame(targetRoom.roomId, user.id))
        );
        return { data: createGameData, gameId: targetRoom.roomId };
      }
    }
    return { data: [this.handleUpdateRoom()] };
  }

  handleCreateGame(roomIdx: number, id: number) {
    const resCreate = resTemplates.create_game;
    resCreate.data = JSON.stringify({
      idGame: roomIdx,
      idPlayer: id,
    });

    return JSON.stringify(resCreate);
  }

  handleUpdateRoom() {
    const resUpdate = resTemplates.update_room;
    resUpdate.data = JSON.stringify(this.db.roomDB);
    return JSON.stringify(resUpdate);
  }

  handleAddShips(data: string) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const currGame = this.db.getRoomByIdx(parsedData.gameId);
    const currPlayer = this.db.getPlayerById(parsedData.indexPlayer);
    if (currPlayer) currPlayer.ships = parsedData.ships;

    // to start game check if ships exist
    let startGame = true;
    currGame?.roomUsers.forEach((user) => {
      const player = this.db.getPlayerById(user.id);
      if (player?.ships.length === 0) startGame = false;
    });
    if (startGame) {
      const startGameData: {
        gameId: number;
        data: string[];
      } = {
        gameId: parsedData.gameId,
        data: [],
      };
      currGame?.roomUsers.forEach((user) => {
        const player = this.db.getPlayerById(user.id);
        if (player) {
          const startGameRes = resTemplates.start_game;
          startGameRes.data = JSON.stringify({
            ships: player.ships,
          });
          startGameData.data.push(JSON.stringify(startGameRes));
        }
      });
      return startGameData;
    }
  }
}

export default Handler;
