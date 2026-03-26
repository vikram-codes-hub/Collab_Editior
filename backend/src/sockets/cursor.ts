import { Server, Socket } from 'socket.io';

export const registerCursorHandlers = (io: Server, socket: Socket) => {
  socket.on('cursor:move', (data: { roomId: string; position: object; userId: string }) => {
    socket.to(data.roomId).emit('cursor:update', {
      userId:   data.userId,
      position: data.position,
    });
  });

  socket.on('room:join', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user:joined', { socketId: socket.id });
  });

  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user:left', { socketId: socket.id });
  });
};
