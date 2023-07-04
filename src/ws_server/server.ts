import Player from '../clientMgmt/player';
import ws from 'ws';
import Handler from './handler';
// import { WSCommand } from 'src/types';

const handler = new Handler();
let lastPlayerId = 0;

function createWebsocketServer(PORT: number) {
  const wsServer = new ws.Server({ port: PORT });
  console.log(`WebSocket server started on the ${PORT} port!`);
  wsServer.on('connection', onConnect);
}

function onConnect(wsClient: ws) {
  const newCommer = new Player(lastPlayerId);
  handler.addPlayerToDB(newCommer);
  lastPlayerId++;

  wsClient.onmessage = async function (event) {
    const messages = await handler.handleMessage(event.data, newCommer);
    messages?.forEach((message) => wsClient.send(message));
  };

  wsClient.on('close', () => {});
  wsClient.on('error', () => {
    console.log('Ann error occured!');
  });
}

export { createWebsocketServer };
