import mongoose from 'mongoose';
import chalk from 'chalk';

let listenersRegistered = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

const registerListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    console.log(chalk.green(`✓ MongoDB Connected: ${mongoose.connection.host}`));
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(chalk.yellow('! MongoDB disconnected'));
  });

  mongoose.connection.on('reconnected', () => {
    console.log(chalk.green('✓ MongoDB reconnected'));
  });

  mongoose.connection.on('error', (err) => {
    console.error(chalk.red('✗ MongoDB connection error:'), err.message || err);
  });
};

export const getDatabaseStatus = () => {
  const readyState = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[readyState] || 'unknown',
    readyState,
    isConnected: readyState === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

export const connectDB = async (): Promise<typeof mongoose> => {
  registerListeners();

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/action_tailor';

  connectionPromise = mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
  }).finally(() => {
    connectionPromise = null;
  });

  try {
    const conn = await connectionPromise;
    return conn;
  } catch (error: any) {
    console.error(chalk.red(`✗ Failed to connect to MongoDB: ${error.message || error}`));
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log(chalk.yellow('! MongoDB disconnected through app termination'));
  }
};
