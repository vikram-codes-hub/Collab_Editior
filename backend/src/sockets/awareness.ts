import { Server, Socket } from 'socket.io';

export const registerAwarenessHandlers = (_io: Server, socket: Socket) => {
  socket.on('awareness:update', (data: { roomId: string; state: object }) => {
    socket.to(data.roomId).emit('awareness:update', {
      socketId: socket.id,
      state:    data.state,
    });
  });
};
