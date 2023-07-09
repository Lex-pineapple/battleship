import Player from '../clientMgmt/player';
import ws from 'ws';
import Handler from './handler';
import SocketDB from '../db/socketDB';
import { IUpdateData } from 'src/types';

const handler = new Handler();
const socketDB = new SocketDB();
let lastPlayerId = 0;

function createWebsocketServer(PORT: number) {
  const wsServer = new ws.Server({ port: PORT });
  console.log(`WebSocket server started on the ${PORT} port!`);
  wsServer.on('connection', onConnect);
}

function onConnect(wsClient: ws) {
  const newCommer = new Player(lastPlayerId);
  handler.addPlayerToDB(newCommer);
  socketDB.addReckord(lastPlayerId, wsClient);
  lastPlayerId++;

  wsClient.onmessage = async function (event) {
    const message = await handler.handleMessage(event.data, newCommer);
    if (message) await handleCLientsUpdate(message, wsClient, newCommer);
  };

  wsClient.on('close', () => {});
  wsClient.on('error', () => {
    console.log('Ann error occured!');
  });
}

async function handleCLientsUpdate(data: IUpdateData, wsClient: ws, player: Player) {
  if (data.current && data.current instanceof Object) {
    data.current.data.forEach((item) => wsClient.send(item));
  }
  if (data.room && data.room instanceof Object) {
    data.room.data.forEach((item) => {
      const socket = socketDB.getReckordByID(item.id);
      item.data.forEach((rec) => {
        socket?.socket.send(rec);
      });
    });
  }
  if (data.game && data.game instanceof Object) {
    // console.log('data', data.game.data);
    // console.log('data.game', data.game);

    data.game.data.forEach((item) => {
      const socket = socketDB.getReckordByID(item.id);
      item.data.forEach((rec) => {
        // console.log('rec id', item.id, rec);

        socket?.socket.send(rec);
      });
    });
  }
  if (data.all && data.all instanceof Object) {
    for (let i = 0; i < socketDB.reckords.length; i++) {
      data.all.data.forEach((item) => socketDB.reckords[i].socket.send(item));
    }
  }

  if (data.botPlay.isPlay) {
    const message = await handler.handleMessage(data.botPlay.data, player);
    if (message) await handleCLientsUpdate(message, wsClient, player);
  }
}

export { createWebsocketServer };
