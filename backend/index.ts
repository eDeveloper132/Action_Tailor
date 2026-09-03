import http from 'node:http';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';

import { connectDB, disconnectDB } from './config/db.ts';
import { initSocketServer } from './sockets/socket.ts';
import apiRoutes from './routes/index.ts';
import authRoutes from './routes/auth.routes.ts';
import customerRoutes from './routes/customer.routes.ts';
import measurementRoutes from './routes/measurement.routes.ts';
import orderRoutes from './routes/order.routes.ts';
import paymentRoutes from './routes/payment.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import { requestLogger, notFoundHandler, errorHandler } from './middlewares/index.ts';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Flexible multi-origin CORS for Admin (:3001), Customer (:3002), and configured origins
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (CORS_ORIGIN === '*') return callback(null, true);
      const allowed = CORS_ORIGIN.split(',').map((s) => s.trim());
      if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request Logger
app.use(requestLogger);

// Ensure MongoDB is connected before handling requests
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Root route for backend API status
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    name: 'Action Tailor Shared API & Backend',
    version: '1.0.0',
    services: {
      adminFrontendUrl: 'http://localhost:3001',
      customerFrontendUrl: 'http://localhost:3002',
      restApiBase: '/api',
      realtimeSocket: 'Socket.IO enabled',
    },
  });
});

// Tailoring REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);

// Error Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Start HTTP server & Socket.IO
if (!process.env.VERCEL) {
  initSocketServer(server);

  const startServer = async () => {
    server.listen(PORT, () => {
      console.log(
        chalk.bold.magenta(`\n🚀 Action Tailor Backend running on: ${chalk.underline(`http://localhost:${PORT}`)}`)
      );
      console.log(chalk.gray(`Mode: ${process.env.NODE_ENV || 'development'}\n`));
    });

    await connectDB();
  };

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
}

export { app, server };
export default app;

