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
      | 'add_user_to_room'
      | 'add_ships'
      | 'randomAttack'
      | 'single_player';
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
    data: IAuthResData;
    id: number;
  }

  interface IAuthResData {
    name: string;
    index: number;
    error: boolean;
    errorText: string;
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
    data: IAddPlayerToRoomResData;
    id: number;
  }

  interface IAddPlayerToRoomResData {
    indexRoom: number;
  }

  interface IUpdateRoomReq {
    type: 'update_room';
    data: IRoomDBData[];
    id: number;
  }

  interface IAddShipsToGameRes {
    type: 'add_ships';
    data: IAddShipsToGameResData;
    id: number;
  }

  interface IAddShipsToGameResData {
    gameId: number;
    ships: IncShipData[];
    indexPlayer: number;
  }

  interface IncShipData {
    position: {
      x: number;
      y: number;
    };
    direction: boolean;
    length: number;
    type: 'small' | 'medium' | 'large' | 'huge';
  }

  interface IAttackRes {
    type: 'attack';
    data: IAttackResData;
    id: number;
  }

  interface IAttackResData {
    gameId: number;
    x: number;
    y: number;
    indexPlayer: number;
  }

  interface IAttackReq {
    type: 'attack';
    data: IAttackReqData;
    id: number;
  }

  interface IAttackReqData {
    finished?: boolean;
    position: {
      x: number;
      y: number;
    };
    currentPlayer: number;
    status: TAttackStatus;
  }

  interface IRandAttackRes {
    type: 'randomAttack';
    data: IRandAttackResData;
    id: 0;
  }

  interface IRandAttackResData {
    gameId: number;
    indexPlayer: number;
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
  ships: any;
  id: number;
  name: string;
  password: string;
}

export interface IUpdateData {
  botPlay: {
    isPlay: boolean;
    data: string;
  };
  current:
    | {
        data: string[];
      }
    | boolean;
  all:
    | {
        data: string[];
      }
    | boolean;
  room:
    | {
        data: ICreateGameRet[];
      }
    | boolean;
  game:
    | {
        data: ICreateGameRet[];
      }
    | boolean;
}

export interface ICreateGameRet {
  id: number;
  data: string[];
}

export interface IRoomDBReckord {
  roomId: number;
  roomUsers: (IRoomDBReckordUser | boolean)[];
}

export interface IRoomDBReckordUser {
  name: string;
  index: number;
  id: number;
}

export interface IGameDBReckord {
  gameId: number;
  players: IGameDBReckordPlayer[];
}

export interface IGameDBReckordPlayer {
  index: number;
  player: Player;
}

export interface IShipState {
  totalAlive: number;
  ships: IShipData[];
}

export interface IShipData {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  slots: string[];
  type: string;
  // type: 'small' | 'medium' | 'large' | 'huge';
}

export interface IShipRetData {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number;
  status: 'miss' | 'killed' | 'shot';
}

export interface IGamePlayers {
  type: string;
  index: number;
  id: number | null;
  name: string;
  shipsState: IShipState;
  moves: IMove[];
}

interface IMove {
  x: number;
  y: number;
}

export interface ICalcAttackRet {
  finished: boolean;
  data: WSCommand.IAttackReqData;
}

export type TAttackStatus = 'miss' | 'killed' | 'shot';
