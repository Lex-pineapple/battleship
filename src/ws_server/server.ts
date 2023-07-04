import Player from '../clientMgmt/player';
import DB from '../clientMgmt/db';
import ws from 'ws';
import DataValidator from '../clientMgmt/dataValidator';
import ErrorMgmt from '../clientMgmt/errorMgmt';
import parseRawData from '../utils/parseRawData';
import resTemplates from '../clientMgmt/resTemplates';
import { WSCommand } from 'src/types';
// import { WSCommand } from 'src/types';

const db = new DB();
let lastPlayerId = 0;

function createWebsocketServer(PORT: number) {
  const wsServer = new ws.Server({ port: PORT });
  console.log(`WebSocket server started on the ${PORT} port!`);
  wsServer.on('connection', onConnect);
}

function onConnect(wsClient: ws) {
  const newCommer = new Player(lastPlayerId);
  db.addPlayer(newCommer);
  lastPlayerId++;

  wsClient.onmessage = async function (event) {
    const parsedData = parseRawData(event.data);
    console.log(db.clientDB.indexOf(newCommer));

    if (DataValidator.validateRawData(parsedData)) {
      const response = await handleRequest(
        db.clientDB.indexOf(newCommer),
        parsedData,
        newCommer,
        db
      );
      if (response) wsClient.send(response);
      // wsClient.send(response);
    } else
      wsClient.send(
        ErrorMgmt.createAuthErrorMsg(
          db.clientDB.indexOf(newCommer),
          newCommer.id,
          'An error occured'
        )
      );
  };

  wsClient.on('close', () => {});
  wsClient.on('error', () => {
    console.log('Ann error occured!');
  });
}

async function handleRequest(idx: number, data: WSCommand.IGenReq, player: Player, roomDB: any) {
  console.log(data.type);

  switch (data.type) {
    case 'reg': {
      const res = resTemplates.req;
      const dataResp = await player.authorisePlayer(idx, data.data);
      res.id = player.id;
      res.data = JSON.stringify(dataResp);
      return JSON.stringify(res);
    }
    case 'create_room': {
      const resUpdate = resTemplates.update_room;
      resUpdate.id = player.id;
      roomDB.createRoom(player);
      resUpdate.data = JSON.stringify(db.roomDB);
      return JSON.stringify(resUpdate);
    }
    case 'add_user_to_room': {
      const parsedData = JSON.parse(data.data);
      const roomToAdd = db.getRoom(parsedData.indexRoom);
      roomToAdd.roomUsers.push({
        name: player.name,
        index: db.clientDB.indexOf(player),
      });
      // const resUpdate = resTemplates.update_room;
      // resUpdate.id = player.id;
      // resUpdate.data = JSON.stringify(db.roomDB);
      const resCreate = resTemplates.create_game;
      resCreate.data = JSON.stringify({
        idGame: player.id,
        idPlayer: player.id,
      });

      return JSON.stringify(resCreate);
    }
    default:
      return JSON.stringify({
        type: 'unknown',
        data: '',
        id: player.id,
      });
  }
}

export { createWebsocketServer };
