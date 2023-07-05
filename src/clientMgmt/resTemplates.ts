import { IUpdateData } from 'src/types';

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
};

const innerUpdTemplate: IUpdateData = {
  current: false,
  all: false,
  room: false,
  game: false,
};

export { resTemplates, innerUpdTemplate };
