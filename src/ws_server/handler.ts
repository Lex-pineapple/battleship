import Player from '../clientMgmt/player';
import parseRawData from '../utils/parseRawData';
import DataValidator from '../clientMgmt/dataValidator';
import {
  ICreateGameRet,
  IGameDBReckord,
  IGameDBReckordPlayer,
  IRoomDBReckord,
  WSCommand,
} from 'src/types';
import { resTemplates, innerUpdTemplate } from '../clientMgmt/resTemplates';
import UserDB from '../db/userDB';
import RoomDB from '../db/roomDB';
import GameDB from '../db/gameDB';

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
      case 'attack': {
        const clientData = this.handleAttack(data.data, player);
        return clientData;
      }
      case 'randomAttack': {
        const clientData = this.handleRandomAttack(data.data, player);
        return clientData;
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
    const resCreateArray = [];
    // = new Array(2).fill({
    //   id: 0,
    //   data: resCreate,
    // });

    console.log('room.roomUsers', room.roomUsers);

    for (let i = 0; i < room.roomUsers.length; i++) {
      resCreateArray.push({
        id: room.roomUsers[i].id,
        data: [
          JSON.stringify({
            ...resCreate,
            data: JSON.stringify({
              idGame: room.roomId,
              idPlayer: room.roomUsers[i].id,
            }),
          }),
        ],
      });
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
        data: string[];
      }[] = [];

      game?.players.forEach((player) => {
        startGameData.push({
          id: player.player.id,
          data: [
            JSON.stringify({
              ...startGameRes,
              data: {
                ships: player.player.shipsState.ships,
                currentPlayerIndex: 0,
              },
            }),
          ],
        });
      });
      return startGameData;
    }
  }

  handleAttack(data: string, player: Player) {
    const parsedData = parseRawData(data);
    // if (!parsedData) handle error
    const game = this.gameDB.getReckordByID(parsedData.gameId);
    const currPlayerIdx = parsedData.indexPlayer;
    const attackedPlayer = this.gameDB.getOppRecordByIdx(parsedData.gameId, parsedData.indexPlayer);
    const response = this.handleNextMove(game, currPlayerIdx, attackedPlayer, parsedData, player);
    return response;
  }

  handleNextMove(
    game: IGameDBReckord | undefined,
    currPlayerIdx: number,
    attackedPlayer: IGameDBReckordPlayer | undefined,
    parsedData: any,
    player: Player
  ) {
    let response = innerUpdTemplate;
    if (attackedPlayer) {
      const attackResult = attackedPlayer.player.calculateAttack(parsedData.x, parsedData.y);
      attackResult.data.currentPlayer = parsedData.indexPlayer;
      const resAttack = resTemplates.attack;
      resAttack.data = JSON.stringify(attackResult.data);

      const gameReturnDataArray: ICreateGameRet[] = [];
      game?.players.forEach((player) =>
        gameReturnDataArray.push({
          id: player.player.id,
          data: [JSON.stringify(resAttack.data)],
        })
      );
      response = {
        ...response,
        game: {
          data: gameReturnDataArray,
        },
      };
      if (attackResult.finished) {
        player.wins++;
        game?.players.forEach((player) => {
          player.player.inGame = false;
          player.player.shipsState = {
            totalAlive: 0,
            ships: [],
          };
        });
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
                  winPlayer: currPlayerIdx,
                }),
              })
            )
          );
        }
      } else {
        const turnRes = resTemplates.turn;
        if (response.game instanceof Object) {
          response.game.data.forEach((item) =>
            item.data.push(
              JSON.stringify({
                ...turnRes,
                data: JSON.stringify({
                  currentPlayer:
                    attackResult.status === 'miss' ? attackedPlayer.index : currPlayerIdx,
                }),
              })
            )
          );
        }
      }
    }
  }

  handleRandomAttack(data: string, player: Player) {
    const parsedData = parseRawData(data);
    const moveCoord = player.generateRandomMove();
    const game = this.gameDB.getReckordByID(parsedData.gameId);
    const currPlayerIdx = parsedData.indexPlayer;
    const attackedPlayer = this.gameDB.getOppRecordByIdx(parsedData.gameId, parsedData.indexPlayer);
    const response = this.handleNextMove(
      game,
      currPlayerIdx,
      attackedPlayer,
      { ...parsedData, ...moveCoord },
      player
    );
    return response;
    // if (!parsedData) handle error
  }
}

export default Handler;
