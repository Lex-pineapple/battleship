import Player from '../clientMgmt/player';
import ws from 'ws';
import Handler from './handler';
import SocketDB from 'src/db/socketDB';
// import { WSCommand } from 'src/types';

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
    // handleCLientsUpdate(message, wsClient);
  };

  wsClient.on('close', () => {});
  wsClient.on('error', () => {
    console.log('Ann error occured!');
  });
}

// function handleCLientsUpdate(data: IUpdateData, wsClient: ws) {}

export { createWebsocketServer };
