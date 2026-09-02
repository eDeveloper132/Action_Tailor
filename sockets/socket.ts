import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import chalk from 'chalk';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(chalk.cyan(`⚡ Socket connected: ${socket.id}`));

    // Example custom ping/pong event
    socket.on('ping', (data) => {
      socket.emit('pong', { ...data, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', (reason) => {
      console.log(chalk.gray(`🔌 Socket disconnected: ${socket.id} (${reason})`));
    });
  });

  console.log(chalk.blue('✓ Socket.IO server initialized'));
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocketServer first.');
  }
  return io;
};
