import { IShipRetData, IUpdateData } from 'src/types';

const resTemplates = {
  reg: {
    type: 'reg',
    data: '',
    id: 0,
  },
  regData: {
    name: '',
    index: 0,
    error: false,
    errorText: '',
  },
  create_room: {
    type: 'create_room',
    data: '',
    id: 0,
  },
  add_player_to_room: {
    type: 'add_user_to_room',
    data: '',
    id: 0,
  },
  update_room: {
    type: 'update_room',
    data: '',
    id: 0,
  },
  create_game: {
    type: 'create_game',
    data: '',
    id: 0,
  },
  start_game: {
    type: 'start_game',
    data: '',
    id: 0,
  },
  attack: {
    type: 'attack',
    data: '',
    id: 0,
  },
  turn: {
    type: 'turn',
    data: '',
    id: 0,
  },
  finish: {
    type: 'finish',
    data: '',
    id: 0,
  },
  update_winners: {
    type: 'update_winners',
    data: '',
    id: 0,
  },
};

const innerUpdTemplate: IUpdateData = {
  botPlay: {
    isPlay: false,
    data: '',
  },
  current: false,
  all: false,
  room: false,
  game: false,
};

const shipRetData: IShipRetData = {
  position: {
    x: 0,
    y: 0,
  },
  currentPlayer: 0,
  status: 'miss',
};

export { resTemplates, innerUpdTemplate, shipRetData };
