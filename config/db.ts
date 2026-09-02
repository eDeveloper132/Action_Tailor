import mongoose from 'mongoose';
import chalk from 'chalk';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/action_tailor';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(chalk.green(`✓ MongoDB Connected: ${conn.connection.host}`));
  } catch (error: any) {
    console.warn(chalk.yellow(`! MongoDB connection warning: ${error.message || error}`));
    console.log(chalk.gray('ℹ Server continuing in offline database mode...'));
  }

  mongoose.connection.on('disconnected', () => {
    console.warn(chalk.yellow('! MongoDB disconnected'));
  });

  mongoose.connection.on('error', (err) => {
    console.error(chalk.red('✗ MongoDB error:'), err);
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log(chalk.yellow('! MongoDB disconnected through app termination'));
};
