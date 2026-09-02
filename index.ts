import http from 'node:http';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chalk from 'chalk';

import cookieParser from 'cookie-parser';
import { connectDB, disconnectDB } from './config/db.ts';
import { initSocketServer } from './sockets/socket.ts';
import apiRoutes from './routes/index.ts';
import viewRoutes from './routes/views.routes.ts';
import authRoutes from './routes/auth.routes.ts';
import customerRoutes from './routes/customer.routes.ts';
import measurementRoutes from './routes/measurement.routes.ts';
import orderRoutes from './routes/order.routes.ts';
import paymentRoutes from './routes/payment.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import { requestLogger, notFoundHandler, errorHandler, tsTranspiler } from './middlewares/index.ts';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middlewares
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(tsTranspiler);
app.use(express.static('public'));

// Request Logger
app.use(requestLogger);

// Ensure MongoDB is connected before handling requests (cached for serverless)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// View Routes
app.use('/', viewRoutes);

// Tailoring REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Error Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Start HTTP server & Socket.IO only when running in traditional/local environments (not Vercel serverless)
if (!process.env.VERCEL) {
  initSocketServer(server);

  const startServer = async () => {
    server.listen(PORT, () => {
      console.log(
        chalk.bold.magenta(`\n🚀 Server is running on: ${chalk.underline(`http://localhost:${PORT}`)}`)
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
