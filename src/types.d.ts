export namespace WSCommand {
  interface IGenReq {
    type:
      | 'reg'
      | 'update_winners'
      | 'create_room'
      | 'create_game'
      | 'update_room'
      | 'attack'
      | 'turn'
      | 'finish'
      | 'add_user_to_room';
    data: string;
    id: number;
  }

  interface IAuthAReq {
    type: 'reg';
    data: IAuthReqData;
    id: number;
  }

  interface IAuthReqData {
    name: string;
    password: string;
  }

  interface IAuthARes {
    type: 'reg';
    data: {
      name: string;
      index: number;
      error: boolean;
      errorText: string;
    };
    id: number;
  }

  interface IUpdateWinReq {
    type: 'update_winners';
    data: IUpdateWinReqData[];
    id: number;
  }

  interface IUpdateWinReqData {
    name: string;
    wins: number;
  }

  interface ICreateRoomRes {
    type: 'create_room';
    data: string;
    id: number;
  }

  interface IAddPlayerToRoomReq {
    type: 'create_game';
    data: IAddPlayerToRoomReqData;
    id: number;
  }

  interface IAddPlayerToRoomReqData {
    idGame: number;
    idPlayer: number;
  }

  interface IAddPlayerToRoomRes {
    type: 'add_player_to_room';
    data: {
      indexRoom: number;
    };
    id: number;
  }

  interface IUpdateRoomReq {
    type: 'update_room';
    data: IUpdateRoomReqData[];
    id: number;
  }

  interface IUpdateRoomReqData {
    roomId: number;
    roomUsers: {
      name: string;
      index: number;
    };
  }

  interface IAddShipsToGameRes {
    type: 'add_ships';
    data: {
      gameId: number;
      ships: [
        {
          position: {
            x: number;
            y: number;
          };
          direction: boolean;
          length: number;
          type: 'small' | 'medium' | 'large' | 'huge';
        }
      ];
      indexPlayer: number;
    };
    id: number;
  }

  interface IAttackRes {
    type: 'attack';
    data: {
      gameID: number;
      x: number;
      y: number;
      indexPlayer: number;
    };
    id: number;
  }

  interface IAttackReq {
    type: 'attack';
    data: IAttackReqData;
    id: number;
  }

  interface IAttackReqData {
    position: {
      x: number;
      y: number;
    };
    currentPlayer: number;
    status: 'miss' | 'killed' | 'shot';
  }

  interface IRandAttackRes {
    type: 'randomAttack';
    data: {
      gameID: number;
      indexPlayer: number;
    };
    id: 0;
  }

  interface IChangeTurnReq {
    type: 'turn';
    data: IChangeTurnReqData;
    id: number;
  }

  interface IChangeTurnReqData {
    data: {
      currentPlayer: number;
    };
  }

  interface IFinishGameReq {
    type: 'finish';
    data: IFinishGameReqData;
    id: number;
  }

  interface IFinishGameReqData {
    data: {
      winPlayer: number;
    };
  }
}

export interface IPlayer {
  id: number;
  name: string;
  password: string;
}
