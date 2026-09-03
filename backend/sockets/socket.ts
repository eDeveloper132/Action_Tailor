import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import chalk from 'chalk';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  PingPayload,
} from './../types/index.ts';

type AppSocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: AppSocketServer | null = null;

export const initSocketServer = (httpServer: HttpServer): AppSocketServer => {
  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const configured = process.env.CORS_ORIGIN || '*';
        if (configured === '*') return callback(null, true);
        const allowed = configured.split(',').map((s) => s.trim());
        if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: AppSocket) => {
    console.log(chalk.cyan(`⚡ Socket connected: ${socket.id}`));

    // Typed ping/pong event
    socket.on('ping', (data: PingPayload) => {
      socket.emit('pong', { ...data, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', (reason) => {
      console.log(chalk.gray(`🔌 Socket disconnected: ${socket.id} (${reason})`));
    });
  });

  console.log(chalk.blue('✓ Socket.IO server initialized with multi-origin CORS'));
  return io;
};

export const getIO = (): AppSocketServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocketServer first.');
  }
  return io;
};
