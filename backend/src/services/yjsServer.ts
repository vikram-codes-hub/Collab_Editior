import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

export const startYjsServer = (port: number) => {
  const wss = new WebSocketServer({ port });
  wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
  });
  console.log(`✅ y-websocket server running on ws://localhost:${port}`);
};
