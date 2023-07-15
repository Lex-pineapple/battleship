import { createWebsocketServer } from './src/ws_server/server';
import { httpServer } from './src/http_server';

const HTTP_PORT = 8181;
const WS_PORT = 8080;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
const wsServer = createWebsocketServer(WS_PORT);
httpServer.listen(HTTP_PORT);

async function handleClose() {
  console.log('Stopping servers');
  httpServer.close();
  wsServer.close();
}

process.on('SIGHUP', handleClose);
process.on('SIGINT', handleClose);
process.on('SIGQUIT', handleClose);
process.on('SIGTERM', handleClose);
