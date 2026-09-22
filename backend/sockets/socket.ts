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

import { verifyToken, AUTH_COOKIE_NAME } from '../utils/jwt.ts';

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(';');
  for (const item of items) {
    const [name, ...rest] = item.split('=');
    if (name) {
      cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  }
  return cookies;
}

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
        const configured = process.env.CORS_ORIGIN || '';
        if (configured === '*') return callback(null, true);
        const adminUrl = process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001';
        const customerUrl = process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3002';
        const allowed = [
          adminUrl,
          customerUrl,
          ...configured.split(',').map((s) => s.trim()).filter(Boolean),
        ];
        if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Handshake authentication middleware
  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token =
        cookies[AUTH_COOKIE_NAME] ||
        (socket.handshake.auth?.token as string | undefined) ||
        (typeof socket.handshake.headers.authorization === 'string'
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '').trim()
          : undefined);

      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          socket.data.user = decoded;
          socket.data.userId = decoded.userId;
        }
      }
      return next();
    } catch (_err) {
      return next();
    }
  });

  io.on('connection', (socket: AppSocket) => {
    const user = socket.data.user;

    if (user) {
      console.log(
        chalk.cyan(`⚡ Authenticated socket connected: ${socket.id} (user: ${user.userId}, role: ${user.role || 'customer'})`)
      );

      // Join staff rooms
      if (user.role && ['admin', 'manager', 'staff'].includes(user.role)) {
        socket.join('staff');
        if (user.role === 'admin') socket.join('admin');
        if (user.role === 'manager') socket.join('manager');
      }

      // Join customer room
      if (user.customerProfile) {
        socket.join(`customer:${user.customerProfile}`);
      }

      // Join user-specific room
      socket.join(`user:${user.userId}`);
    } else {
      console.log(chalk.gray(`⚡ Public/Guest socket connected: ${socket.id}`));
      socket.join('public');
    }

    // Typed ping/pong event
    socket.on('ping', (data: PingPayload) => {
      socket.emit('pong', { ...data, timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', (reason) => {
      console.log(chalk.gray(`🔌 Socket disconnected: ${socket.id} (${reason})`));
    });
  });

  console.log(chalk.blue('✓ Socket.IO server initialized with multi-origin CORS & handshake auth'));
  return io;
};

export const getIO = (): AppSocketServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocketServer first.');
  }
  return io;
};
