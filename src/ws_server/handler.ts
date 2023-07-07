import Player from '../clientMgmt/player';
import parseRawData from '../utils/parseRawData';
import DataValidator from '../clientMgmt/dataValidator';
import {
  ICreateGameRet,
  IGameDBReckord,
  IGameDBReckordPlayer,
  IRoomDBReckord,
  IRoomDBReckordUser,
  IUpdateData,
  WSCommand,
} from 'src/types';
import { resTemplates, innerUpdTemplate } from '../clientMgmt/resTemplates';
import UserDB from '../db/userDB';
import RoomDB from '../db/roomDB';
import GameDB from '../db/gameDB';
import Game from '../clientMgmt/game';

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
        const clientData = this.handleAddShips(data.data);
        if (clientData) {
          updData.game = { data: clientData };
        }
        return updData;
      }
      case 'attack': {
        const clientData = this.handleAttack(data.data);
        return clientData;
      }
      case 'randomAttack': {
        const clientData = this.handleRandomAttack(data.data, player);
        return clientData;
      }
      case 'single_player': {
        const clientData = this.handleSinglePlayer(data.data);
        updData.game = { data: clientData.data as ICreateGameRet[] };
        return updData;
      }
      default:
        // return [
        //   JSON.stringify({
        //     type: 'unknown',
        //     data: '',
        //     id: player.id,
        //   }),
        // ];
        break;
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
    return {
      type: 'all',
      data: [this.handleUpdateRoom()],
    };
  }

  handleCreateGame(room: IRoomDBReckord): ICreateGameRet[] {
    const newGame = new Game(room.roomId, room.roomUsers[0], room.roomUsers[1]);
    this.gameDB.addNewGame(newGame);

    const resCreate = resTemplates.create_game;
    const resCreateArray = [];

    for (let i = 0; i < room.roomUsers.length; i++) {
      if (typeof room.roomUsers[i] !== 'boolean' && room.roomUsers[i] instanceof Object) {
        resCreateArray.push({
          id: (room.roomUsers[i] as IRoomDBReckordUser).id,
          data: [
            JSON.stringify({
              ...resCreate,
              data: JSON.stringify({
                idGame: room.roomId,
                idPlayer: i,
              }),
            }),
            this.handleTurn('', 1, 0),
          ],
        });
      }
    }

    return resCreateArray;
  }

  handleUpdateRoom() {
    const resUpdate = resTemplates.update_room;
    resUpdate.data = JSON.stringify(this.roomDB.reckords);
    return JSON.stringify(resUpdate);
  }

  handleUpdateWinners() {
    const winnerData = this.playerDB.getWinners();
    const resWinner = resTemplates.update_winners;
    resWinner.data = JSON.stringify(winnerData);
    return JSON.stringify(resWinner);
  }

  handleAddShips(data: string) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const game = this.gameDB.getReckordByID(parsedData.gameId);
    if (game) {
      const botPlayer = game.players.find((player) => player.type === 'bot');
      if (botPlayer) game.createRandomShips(botPlayer);
      game.initShipsData(parsedData.indexPlayer, parsedData.data);
      if (game.checkShipsFill()) {
        // start game
        const startGameRes = resTemplates.start_game;
        const startGameData: {
          id: number | null;
          data: string[];
        }[] = [];

        game.players.forEach((player) => {
          startGameData.push({
            id: player.id,
            data: [
              JSON.stringify({
                ...startGameRes,
                data: {
                  ships: player.shipsState.ships,
                  currentPlayerIndex: parsedData.indexPlayer,
                },
              }),
            ],
          });
        });
        return startGameData;
      }
    }
  }

  handleAttack(data: string) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const game = this.gameDB.getReckordByID(parsedData.gameId);
    if (game) {
      const attackerIdx = parsedData.indexPlayer;
      const defenderIdx = attackerIdx === 0 ? 1 : 0;
      const attackResult = game.calculateAttack(
        attackerIdx,
        defenderIdx,
        parsedData.x,
        parsedData.y
      );
      const resAttack = resTemplates.attack;

      let response = innerUpdTemplate;

      resAttack.data = JSON.stringify(attackResult.data);
      const gameReturnDataArray: ICreateGameRet[] = [];
      game.players.forEach((player) => {
        if (player.id)
          gameReturnDataArray.push({
            id: player.id,
            data: [JSON.stringify(resAttack.data)],
          });
      });
      response = {
        ...response,
        game: {
          data: gameReturnDataArray,
        },
      };

      if (attackResult.finished) {
        const attacker = game.getPlayerByIdx(attackerIdx);
        if (attacker && attacker.id) {
          const player = this.playerDB.getReckordByID(attacker.id);
          if (player) player.wins++;
        }
        this.roomDB.deleteReckordById(parsedData.gameId);
        this.gameDB.deleteReckordById(parsedData.gameId);
        response = {
          ...response,
          all: {
            data: [this.handleUpdateRoom()],
          },
        };

        const finishRes = resTemplates.finish;
        if (response.game instanceof Object) {
          response.game.data.forEach((item) =>
            item.data.push(
              JSON.stringify({
                ...finishRes,
                data: JSON.stringify({
                  winPlayer: attackerIdx,
                }),
              })
            )
          );
        }
      } else {
        if (response.game instanceof Object) {
          response.game.data.forEach((item) => item.data.push());
        }
        if (response.game instanceof Object) {
          response.game.data.forEach((item) =>
            item.data.push(this.handleTurn(attackResult.data.status, defenderIdx, attackerIdx))
          );
        }
      }

      return response;
    }
  }

  handleTurn(status: string, defenderIdx: number, attackerIdx: number) {
    const turnRes = resTemplates.turn;
    return JSON.stringify({
      ...turnRes,
      data: JSON.stringify({
        currentPlayer: status === 'miss' ? defenderIdx : attackerIdx,
      }),
    });
  }

  handleRandomAttack(data: string) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const game = this.gameDB.getReckordByID(parsedData.gameId);
    if (game) {
      const attackerIdx = parsedData.indexPlayer;
      const defenderIdx = attackerIdx === 0 ? 1 : 0;
      const moveCoord = game.generateRandomMove(attackerIdx);

      // TODO: fix and merge with handle attack
      const response = this.handleNextMove(
        game,
        currPlayerIdx,
        attackedPlayer,
        { ...parsedData, ...moveCoord },
        player
      );
      return response;
    }
  }

  handleSinglePlayer(data: string) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const virtRoomData = {
      roomId: this.roomDB.reckords.length,
      roomUsers: [
        {
          name: parsedData.name,
          index: 0,
          id: parsedData.id,
        },
        false,
      ],
    };
    const returnData = {
      type: 'room',
      data: this.handleCreateGame(virtRoomData),
    };
    return returnData;
  }
}

export default Handler;
