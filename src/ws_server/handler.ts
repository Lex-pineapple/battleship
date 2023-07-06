import Player from '../clientMgmt/player';
import parseRawData from '../utils/parseRawData';
import DataValidator from '../clientMgmt/dataValidator';
import { ICreateGameRet, IGameDBReckordPlayer, IRoomDBReckord, WSCommand } from 'src/types';
import { resTemplates, innerUpdTemplate } from '../clientMgmt/resTemplates';
import UserDB from 'src/db/userDB';
import RoomDB from 'src/db/roomDB';
import GameDB from 'src/db/gameDB';

class Handler {
  playerDB: UserDB;
  roomDB: RoomDB;
  gameDB: GameDB;
  constructor() {
    this.playerDB = new UserDB();
    this.roomDB = new RoomDB();
    this.gameDB = new GameDB();
  }

  addPlayerToDB(player: Player) {
    this.playerDB.addReckord(player);
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
        if (clientData.type === 'all') {
          updData.all = {
            data: clientData.data as string[],
          };
        } else {
          updData.all = { data: [this.handleUpdateRoom()] };
          updData.game = { data: clientData.data as ICreateGameRet[] };
        }
        return updData;
      }
      case 'add_ships': {
        const clientData = this.handleAddShips(data.data, player);
        if (clientData) {
          updData.game = { data: clientData };
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
    this.roomDB.createEmptyReckord();
    resUpdate.data = JSON.stringify(this.roomDB.reckords);
    return [this.handleUpdateRoom()];
  }

  handleAddUserToRoom(data: string, player: Player) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const targetRoom = this.roomDB.getReckordByID(parsedData.indexRoom);
    if (targetRoom) {
      if (targetRoom.roomUsers.length < 2) {
        this.roomDB.addUserToRoom(parsedData.indexRoom, player.name, player.id);
      }

      if (targetRoom.roomUsers.length === 2) {
        return {
          type: 'room',
          data: this.handleCreateGame(targetRoom),
        };
      }
    }
    //   if (targetRoom && targetRoom.roomUsers && targetRoom.roomUsers.length === 2) {
    //     const createGameData: string[] = [];
    //     targetRoom.roomUsers.forEach((user) =>
    //       createGameData.push(this.handleCreateGame(targetRoom.roomId, user.id))
    //     );
    //     return { data: createGameData, gameId: targetRoom.roomId };
    //   }
    // }
    return {
      type: 'all',
      data: [this.handleUpdateRoom()],
    };
  }

  handleCreateGame(room: IRoomDBReckord): ICreateGameRet[] {
    this.gameDB.createNewGame(room.roomId);
    const players: IGameDBReckordPlayer[] = [];
    room.roomUsers.forEach((user) => {
      if (user.id) {
        const player = this.playerDB.getReckordByID(user.id);
        players.push({
          index: user.index,
          player,
        });
      }
    });
    this.gameDB.addPlayersToGame(room.roomId, players);

    const resCreate = resTemplates.create_game;
    const resCreateArray = new Array(2).fill({
      id: 0,
      data: resCreate,
    });

    for (let i = 0; i < room.roomUsers.length; i++) {
      resCreateArray[i].id = room.roomUsers[i].id;
      resCreateArray[i].data = {
        ...resCreate,
        data: JSON.stringify({
          idGame: room.roomId,
          idPlayer: room.roomUsers[i].id,
        }),
      };
    }

    return resCreateArray;
  }

  handleUpdateRoom() {
    const resUpdate = resTemplates.update_room;
    resUpdate.data = JSON.stringify(this.roomDB.reckords);
    return JSON.stringify(resUpdate);
  }

  handleAddShips(data: string, player: Player) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const game = this.gameDB.getReckordByID(parsedData.gameId);
    player.initShipsData(parsedData.ships);

    // to start game check if ships exist
    let startGame = true;
    game?.players.forEach((player) => {
      if (player.player.shipsState.totalAlive === 0) startGame = false;
    });
    if (startGame) {
      const startGameRes = resTemplates.start_game;

      const startGameData: {
        id: number;
        data: string;
      }[] = [];

      game?.players.forEach((player) => {
        startGameData.push({
          id: player.player.id,
          data: JSON.stringify({
            ...startGameRes,
            data: {
              ships: player.player.shipsState.ships,
              currentPlayerIndex: 0,
            },
          }),
        });
      });
      return startGameData;
    }
  }
}

export default Handler;
