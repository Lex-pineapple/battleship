import { createWebsocketServer } from './src/ws_server/server';
import { httpServer } from './src/http_server';

const HTTP_PORT = 8181;
const WS_PORT = 8080;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
createWebsocketServer(WS_PORT);
httpServer.listen(HTTP_PORT);
