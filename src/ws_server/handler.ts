import Player from '../clientMgmt/player';
import parseRawData from '../utils/parseRawData';
import DataValidator from '../clientMgmt/dataValidator';
import {
  ICalcAttackRet,
  ICreateGameRet,
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
import ErrorMgmt from 'src/clientMgmt/errorMgmt';

class Handler {
  playerDB: UserDB;
  roomDB: RoomDB;
  gameDB: GameDB;
  constructor() {
    this.playerDB = new UserDB();
    this.roomDB = new RoomDB();
    this.gameDB = new GameDB();
  }

  async handleMessage(data: string | Buffer[] | Buffer | ArrayBuffer, player: Player) {
    if (typeof data !== 'string') return ErrorMgmt.createGenErrResp();
    const parsedData = parseRawData(data);
    if (parsedData) {
      if (DataValidator.validateRawData(parsedData)) {
        const response = await this.delegateRequest(parsedData as WSCommand.IGenReq, player);
        if (response) return response;
        else return ErrorMgmt.createGenErrResp();
      } else return ErrorMgmt.createGenErrResp();
    } else return ErrorMgmt.createGenErrResp();
  }

  async delegateRequest(data: WSCommand.IGenReq, player: Player): Promise<IUpdateData> {
    let updData = innerUpdTemplate;
    switch (data.type) {
      case 'reg': {
        const clientData = await this.handleReqistration(player, data.data);
        updData.current = { data: clientData };
        return updData;
      }
      case 'create_room': {
        this.handleCreateRoom();
        updData.all = { data: [this.handleUpdateRoom(), this.handleUpdateWinners()] };
        return updData;
      }
      case 'add_user_to_room': {
        const clientData = this.handleAddUserToRoom(data.data, player);
        if (clientData.room) {
          updData.all = { data: [this.handleUpdateRoom()] };
          updData.game = clientData.room;
        } else if (clientData.all) {
          updData.all = clientData.all;
        } else updData = clientData;
        return updData;
      }
      case 'add_ships': {
        const clientData = this.handleAddShips(data.data);
        if (clientData) {
          updData.game = clientData.game;
        }
        return updData;
      }
      case 'attack': {
        return this.delegateAttack(data.data);
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
        return ErrorMgmt.createGenErrResp();
    }
  }

  async handleReqistration(player: Player, data: string): Promise<string[]> {
    const regRes = resTemplates.reg;
    const playerIdx = player.id;
    const dataResp = await player.authorisePlayer(playerIdx, data);
    regRes.data = JSON.stringify(dataResp);

    return [JSON.stringify(regRes), this.handleUpdateRoom(), this.handleUpdateWinners()];
  }

  handleCreateRoom(): void {
    this.roomDB.createEmptyReckord();
  }

  handleAddUserToRoom(data: string, player: Player) {
    const parsedData = parseRawData(data);
    if (parsedData) {
      const valData = parsedData as WSCommand.IAddPlayerToRoomResData;
      const targetRoom = this.roomDB.getReckordByID(valData.indexRoom);
      if (targetRoom) {
        if (targetRoom.roomUsers.length < 2) {
          this.roomDB.addUserToRoom(valData.indexRoom, player.name, player.id);
        }

        if (targetRoom.roomUsers.length === 2) {
          return {
            room: {
              data: this.handleCreateGame(targetRoom),
            },
          };
        }
      }
      return {
        all: {
          data: [this.handleUpdateRoom()],
        },
      };
    } else return ErrorMgmt.createGenErrResp();
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
    if (parsedData) {
      const valData = parsedData as WSCommand.IAddShipsToGameResData;
      const game = this.gameDB.getReckordByID(valData.gameId);
      if (game) {
        // check if one of the players is bot
        this.fillBotShips(game);

        game.initShipsData(valData.indexPlayer, valData.ships);
        if (game.checkShipsFill()) {
          // start game
          const startGameRes = resTemplates.start_game;
          const startGameData: {
            game: {
              data: ICreateGameRet[];
            };
          } = {
            game: {
              data: [],
            },
          };

          game.players.forEach((player) => {
            if (player.type !== 'bot' && player.id) {
              startGameData.game.data.push({
                id: player.id,
                data: [
                  JSON.stringify({
                    ...startGameRes,
                    data: {
                      ships: player.shipsState.ships,
                      currentPlayerIndex: valData.indexPlayer,
                    },
                  }),
                ],
              });
            }
          });
          return startGameData;
        }
      }
    } else return ErrorMgmt.createGenErrResp();
  }

  // handle game logic

  delegateAttack(data: string) {
    const parsedData = parseRawData(data);
    if (parsedData instanceof Object) {
      const valData = parsedData as WSCommand.IRandAttackResData;
      const game = this.gameDB.getReckordByID(valData.gameId);
      const attackerIdx = valData.indexPlayer;
      const defenderIdx = attackerIdx === 0 ? 1 : 0;
      let attackResult: ICalcAttackRet;
      if (game) {
        if ('x' in parsedData && 'y' in parsedData) {
          attackResult = this.handleSpecAttack(
            game,
            attackerIdx,
            defenderIdx,
            parsedData as WSCommand.IAttackResData
          );
        } else attackResult = this.handleRandAttack(game, attackerIdx, defenderIdx);

        const updData = innerUpdTemplate;
        const res = this.attackResponse(game, attackResult, updData);
        if (attackResult.finished) {
          return this.handleFinishGame(game, attackerIdx, res);
        } else
          return this.handleNextMove(res, attackResult.data.status, defenderIdx, attackerIdx, game);
      }
    }
    return ErrorMgmt.createGenErrResp();
  }

  handleFinishGame(game: Game, attackerIdx: number, res: IUpdateData) {
    const attacker = game.getPlayerByIdx(attackerIdx);
    if (attacker && attacker.id) {
      const player = this.playerDB.getReckordByID(attacker.id);
      if (player) player.wins++;
    }
    this.roomDB.deleteReckordById(game.gameId);
    this.gameDB.deleteReckordById(game.gameId);
    res = {
      ...res,
      all: {
        data: [this.handleUpdateRoom()],
      },
    };

    const finishRes = resTemplates.finish;
    if (res.game instanceof Object) {
      const finishGameResData = res.game;
      finishGameResData.data.forEach((item) =>
        item.data.push(
          JSON.stringify({
            ...finishRes,
            data: JSON.stringify({
              winPlayer: attackerIdx,
            }),
          })
        )
      );
      res = {
        ...res,
        game: finishGameResData,
      };
    }

    return res;
  }

  attackResponse(game: Game, attackResult: ICalcAttackRet, updData: IUpdateData) {
    const resAttack = resTemplates.attack;
    resAttack.data = JSON.stringify(attackResult);
    const gameReturnDataArray: ICreateGameRet[] = [];
    game.players.forEach((player) => {
      if (player.type === 'bot' && player.id)
        gameReturnDataArray.push({
          id: player.id,
          data: [JSON.stringify(resAttack)],
        });
    });

    updData.game = {
      data: gameReturnDataArray,
    };
    return updData;
  }

  handleNextMove(
    updData: IUpdateData,
    status: string,
    defenderIdx: number,
    attackerIdx: number,
    game: Game
  ) {
    if (updData.game instanceof Object) {
      const finishGameResData = updData.game;
      finishGameResData.data.forEach((item) =>
        item.data.push(this.handleTurn(status, defenderIdx, attackerIdx))
      );
      updData = {
        ...updData,
        game: finishGameResData,
      };

      const currentPlayer = status === 'miss' ? defenderIdx : attackerIdx;
      this.handleBotTurn(currentPlayer, game, updData);
    }
    return updData;
  }

  handleBotTurn(currentPlayer: number, game: Game, updData: IUpdateData) {
    const player = game.getPlayerByIdx(currentPlayer);
    if (player && player.type === 'bot') {
      updData.botPlay.isPlay = true;
      const attackData = JSON.stringify({
        type: 'randomAttack',
        data: JSON.stringify({
          gameId: game.gameId,
          indexPlayer: player.index,
        }),
        id: 0,
      });
      updData.botPlay.data = attackData;
    }
    return updData;
  }

  handleSpecAttack(
    game: Game,
    attackerIdx: number,
    defenderIdx: number,
    data: WSCommand.IAttackResData
  ): ICalcAttackRet {
    return game.calculateAttack(attackerIdx, defenderIdx, data.x, data.y);
  }

  handleRandAttack(game: Game, attackerIdx: number, defenderIdx: number): ICalcAttackRet {
    const moveCoord = game.generateRandomMove(attackerIdx);
    return game.calculateAttack(attackerIdx, defenderIdx, moveCoord.x, moveCoord.y);
  }

  handleTurn(status: string, defenderIdx: number, attackerIdx: number) {
    const turnRes = resTemplates.turn;
    const currentPlayer = status === 'miss' ? defenderIdx : attackerIdx;
    return JSON.stringify({
      ...turnRes,
      data: JSON.stringify({
        currentPlayer,
      }),
    });
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

  fillBotShips(game: Game) {
    const botPlayer = game.hasBotPlayer();
    if (botPlayer) game.createRandomShips(botPlayer);
  }

  addPlayerToDB(player: Player) {
    this.playerDB.addReckord(player);
  }
}

export default Handler;
