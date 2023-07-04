import Player from '../clientMgmt/player';
import DB from '../clientMgmt/db';
import parseRawData from '../utils/parseRawData';
import DataValidator from '../clientMgmt/dataValidator';
import { WSCommand } from 'src/types';
import resTemplates from '../clientMgmt/resTemplates';

class Handler {
  db: DB;
  constructor() {
    this.db = new DB();
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
    switch (data.type) {
      case 'reg': {
        return this.handleReqistration(player, data.data);
      }
      case 'create_room': {
        return this.handleCreateRoom();
      }
      case 'add_user_to_room': {
        return this.handleAddUserToRoom(data.data, player);
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
    const playerIdx = this.db.getPlayerIdx(player);
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
        index: this.db.getPlayerIdx(player),
      });
      if (targetRoom && targetRoom.roomUsers && targetRoom.roomUsers.length === 2) {
        const createGameData = this.handleCreateGame(targetRoom.roomId, player);
        return [this.handleUpdateRoom(), createGameData];
      }
    }
    return [this.handleUpdateRoom()];
  }

  handleCreateGame(roomIdx: number, player: Player) {
    const resCreate = resTemplates.create_game;
    resCreate.data = JSON.stringify({
      idGame: roomIdx,
      idPlayer: player.id,
    });

    return JSON.stringify(resCreate);
  }

  handleUpdateRoom() {
    const resUpdate = resTemplates.update_room;
    resUpdate.data = JSON.stringify(this.db.roomDB);
    return JSON.stringify(resUpdate);
  }
}

export default Handler;
