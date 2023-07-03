import Player from '../clientMgmt/player';
import DB from '../clientMgmt/db';
import ws from 'ws';
import DataValidator from '../clientMgmt/dataValidator';
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
  db.add(newCommer);
  lastPlayerId++;

  wsClient.onmessage = async function (event) {
    console.log(event.data);

    if (typeof event.data === 'string') {
      const pasredData = JSON.parse(event.data);
      if (typeof pasredData.data === 'string') pasredData.data = JSON.parse(pasredData.data);
      if (DataValidator.validateRawData(pasredData)) {
        const response = await newCommer.handleRequest(pasredData);
        console.log(JSON.stringify(response));

        wsClient.send(JSON.stringify(response));
      } else wsClient.send('error');
    }
  };

  wsClient.on('close', () => {});
  wsClient.on('error', () => {
    console.log('Ann error occured!');
  });
}

export { createWebsocketServer };
