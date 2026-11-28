import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT ?? 8080);

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
  console.log('client connected');

  socket.on('message', (data) => {
    const text = data.toString();

    // send to everyone EXCEPT the sender
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    });
  });

  socket.on('close', () => {
    console.log('client disconnected');
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);