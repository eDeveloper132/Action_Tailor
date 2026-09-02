import http from 'node:http';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chalk from 'chalk';

import { connectDB, disconnectDB } from './config/db.ts';
import { initSocketServer } from './sockets/socket.ts';
import apiRoutes from './routes/index.ts';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middlewares
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(chalk.gray(`[${new Date().toISOString()}] ${req.method} ${req.url}`));
  next();
});

// Routes
app.use('/', apiRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(chalk.red('Internal Server Error:'), err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize Socket.IO
initSocketServer(server);

// Start server and connect to database
const startServer = async () => {
  server.listen(PORT, () => {
    console.log(
      chalk.bold.magenta(`\n🚀 Server is running on: ${chalk.underline(`http://localhost:${PORT}`)}`)
    );
    console.log(chalk.gray(`Mode: ${process.env.NODE_ENV || 'development'}\n`));
  });

  await connectDB();
};

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(chalk.yellow(`\nReceived ${signal}. Shutting down gracefully...`));
  server.close(async () => {
    await disconnectDB();
    console.log(chalk.gray('Server closed. Process exiting.'));
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();

export { app, server };
