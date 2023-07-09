import Player from '../clientMgmt/player';
import parseRawData from '../utils/parseRawData';
import DataValidator from '../clientMgmt/dataValidator';
import {
  ICalcAttackRet,
  ICreateGameRet,
  IRoomDBReckord,
  // IRoomDBReckordUser,
  IUpdateData,
  WSCommand,
} from 'src/types';
import { resTemplates, innerUpdTemplate } from '../clientMgmt/resTemplates';
import UserDB from '../db/userDB';
import RoomDB from '../db/roomDB';
import GameDB from '../db/gameDB';
import Game from '../clientMgmt/game';
import ErrorMgmt from '../clientMgmt/errorMgmt';

class Handler {
  playerDB: UserDB;
  roomDB: RoomDB;
  gameDB: GameDB;
  constructor() {
    this.playerDB = new UserDB();
    this.roomDB = new RoomDB();
    this.gameDB = new GameDB();
  }

  clean(player: Player) {
    const playerToDel: {
      id: number;
      idxInGame: number;
    }[] = [];
    this.playerDB.deleteReckordById(player.id);
    if (player.roomStat.inRoom && player.roomStat.roomId !== null) {
      const room = this.roomDB.getReckordByID(player.roomStat.roomId);
      console.log('roomUsers', room?.roomUsers);

      room?.roomUsers.forEach((user) => {
        if (typeof user !== 'boolean') {
          const innplayer = this.playerDB.getReckordByID(user.id);
          if (innplayer) {
            innplayer.roomStat.inRoom = false;
            innplayer.roomStat.roomId = null;
            if (innplayer.id !== player.id)
              playerToDel.push({
                id: innplayer.id,
                idxInGame: user.index,
              });
          }
        }
      });
      this.gameDB.deleteReckordById(player.roomStat.roomId);
    }
    if (player.roomStat.inRoom && player.roomStat.roomId !== null) {
      this.roomDB.deleteReckordById(player.roomStat.roomId);
    }
    console.log(playerToDel);
    return playerToDel;
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

  async delegateRequest(data: WSCommand.IGenReq, player: Player): Promise<IUpdateData | undefined> {
    const updData = innerUpdTemplate;

    switch (data.type) {
      case 'reg': {
        const clientData = await this.handleReqistration(player, data.data);
        return {
          ...updData,
          current: {
            data: clientData,
          },
        };
      }
      case 'create_room': {
        this.handleCreateRoom();
        return {
          ...updData,
          all: {
            data: [this.handleUpdateRoom(), this.handleUpdateWinners()],
          },
        };
      }
      case 'add_user_to_room': {
        const clientData = this.handleAddUserToRoom(data.data, player);
        if (clientData) {
          if (clientData.room) {
            return {
              ...updData,
              all: {
                data: [this.handleUpdateRoom()],
              },
              game: clientData.room,
            };
          } else if (clientData.all) {
            return {
              ...updData,
              all: clientData.all,
            };
          }
        }
        return undefined;
      }
      case 'add_ships': {
        const clientData = this.handleAddShips(data.data);
        if (clientData) {
          return {
            ...updData,
            game: clientData.game,
          };
        }
        return updData;
      }
      case 'attack': {
        const attackRes = this.delegateAttack(data.data);
        if (attackRes) return attackRes;
        return undefined;
      }
      case 'randomAttack': {
        const attackRes = this.delegateAttack(data.data);
        if (attackRes) return attackRes;
        return undefined;
      }
      case 'single_play': {
        // this.handleSinglePlayer(player);
        const clientData = this.handleSinglePlayer(player);
        return {
          ...updData,
          game: clientData.game,
        };
      }
      default:
        return ErrorMgmt.createGenErrResp();
    }
  }

  async handleReqistration(player: Player, data: string): Promise<string[]> {
    const regRes = resTemplates.reg;
    console.log(regRes.type);

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
        const userToAdd = this.roomDB.getUserById(valData.indexRoom, player.id);

        if (targetRoom.roomUsers.length < 2 && !userToAdd) {
          player.roomStat.inRoom = true;
          player.roomStat.roomId = targetRoom.roomId;
          this.roomDB.addUserToRoom(valData.indexRoom, player.name, player.id);
        }

        if (!targetRoom.inGame && targetRoom.roomUsers.length === 2) {
          targetRoom.inGame = true;
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
    }
    const updData = innerUpdTemplate;
    return updData;
  }

  handleCreateGame(room: IRoomDBReckord): ICreateGameRet[] {
    const newGame = new Game(room.roomId, room.roomUsers[0], room.roomUsers[1]);
    this.gameDB.addNewGame(newGame);

    const resCreate = resTemplates.create_game;
    console.log(resCreate.type);

    const resCreateArray: ICreateGameRet[] = [];

    for (let i = 0; i < newGame.players.length; i++) {
      const playerId = newGame.players[i].id;
      if (playerId !== null && playerId !== undefined) {
        resCreateArray.push({
          id: playerId,
          data: [
            JSON.stringify({
              ...resCreate,
              data: JSON.stringify({
                idGame: newGame.gameId,
                idPlayer: newGame.players[i].index,
              }),
            }),
          ],
        });
      }
    }
    // for (let i = 0; i < room.roomUsers.length; i++) {
    //   if (typeof room.roomUsers[i] !== 'boolean' && room.roomUsers[i] instanceof Object) {
    //     resCreateArray.push({
    //       id: (room.roomUsers[i] as IRoomDBReckordUser).id,
    //       data: [
    //         JSON.stringify({
    //           ...resCreate,
    //           data: JSON.stringify({
    //             idGame: room.roomId,
    //             idPlayer: i,
    //           }),
    //         }),
    //         this.handleTurn(0, newGame),
    //       ],
    //     });
    //   }
    // }

    return resCreateArray;
  }

  handleUpdateRoom() {
    const resUpdate = resTemplates.update_room;
    console.log(resUpdate.type);

    resUpdate.data = JSON.stringify(this.roomDB.reckords);
    return JSON.stringify(resUpdate);
  }

  handleUpdateWinners() {
    const winnerData = this.playerDB.getWinners();

    const resWinner = resTemplates.update_winners;
    console.log(resWinner.type);

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
          console.log(startGameRes.type);

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
            if (player.type !== 'bot' && player.id !== undefined && player.id !== null) {
              startGameData.game.data.push({
                id: player.id,
                data: [
                  JSON.stringify({
                    ...startGameRes,
                    data: JSON.stringify({
                      ships: player.shipsState.ships,
                      currentPlayerIndex: valData.indexPlayer,
                    }),
                  }),
                  this.handleTurn(0, game),
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
        if (attackerIdx === game.playerTurnIdx) {
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
            return this.handleFinishGame(attackerIdx, res, game);
          } else
            return this.handleNextMove(
              res,
              attackResult.data.status,
              defenderIdx,
              attackerIdx,
              game
            );
        }
      }
    }

    const updData = innerUpdTemplate;
    return updData;
  }

  handleFinishGame(attackerIdx: number, res: IUpdateData, game?: Game) {
    if (game) {
      const attacker = game.getPlayerByIdx(attackerIdx);

      if (attacker && attacker.id !== undefined && attacker.id !== null) {
        const player = this.playerDB.getReckordByID(attacker.id);
        if (player) player.wins++;
      }
      this.roomDB.deleteReckordById(game.gameId);
      this.gameDB.deleteReckordById(game.gameId);
    }

    const finishRes = resTemplates.finish;
    console.log(finishRes.type);

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
      return {
        ...res,
        all: {
          data: [this.handleUpdateRoom(), this.handleUpdateWinners()],
        },
        game: finishGameResData,
      };
    }

    return res;
  }

  attackResponse(game: Game, attackResult: ICalcAttackRet, updData: IUpdateData) {
    const resAttack = resTemplates.attack;
    console.log(resAttack.type);

    resAttack.data = JSON.stringify(attackResult.data);
    const gameReturnDataArray: ICreateGameRet[] = [];
    game.players.forEach((player) => {
      if (player.type !== 'bot' && player.id !== undefined && player.id !== null)
        gameReturnDataArray.push({
          id: player.id,
          data: [JSON.stringify(resAttack)],
        });
    });

    return {
      ...updData,
      game: {
        data: gameReturnDataArray,
      },
    };
  }

  handleNextMove(
    updData: IUpdateData,
    status: string,
    defenderIdx: number,
    attackerIdx: number,
    game: Game
  ) {
    if (updData.game instanceof Object) {
      const currentPlayer = status === 'miss' ? defenderIdx : attackerIdx;
      game.playerTurnIdx = currentPlayer;
      const finishGameResData = updData.game;
      finishGameResData.data.forEach((item) =>
        item.data.push(this.handleTurn(currentPlayer, game))
      );

      return {
        ...updData,
        ...this.handleBotTurn(currentPlayer, game, updData),
        game: finishGameResData,
      };
    }
    return updData;
  }

  handleBotTurn(currentPlayer: number, game: Game, updData: IUpdateData) {
    const player = game.getPlayerByIdx(currentPlayer);
    if (player && player.type === 'bot') {
      const attackData = JSON.stringify({
        type: 'randomAttack',
        data: JSON.stringify({
          gameId: game.gameId,
          indexPlayer: player.index,
        }),
        id: 0,
      });
      return {
        ...updData,
        botPlay: {
          isPlay: true,
          data: attackData,
        },
      };
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

  handleTurn(currentPlayer: number, game: Game) {
    const turnRes = resTemplates.turn;
    console.log(turnRes.type);

    game.playerTurnIdx = currentPlayer;
    return JSON.stringify({
      ...turnRes,
      data: JSON.stringify({
        currentPlayer,
      }),
    });
  }

  handleSinglePlayer(player: Player) {
    const virtRoomData = {
      roomId: this.roomDB.reckords.length,
      inGame: true,
      roomUsers: [
        {
          name: player.name,
          index: 0,
          id: player.id,
        },
        false,
      ],
    };
    return {
      game: {
        data: this.handleCreateGame(virtRoomData),
      },
    };
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
