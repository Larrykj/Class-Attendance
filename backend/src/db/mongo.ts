import { MongoClient, Db } from 'mongodb';
import logger from '../config/logger';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'class_attendance_ke';

let client: MongoClient | null = null;
let db: Db | null = null;

export const getMongoDb = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  try {
    if (!client) {
      client = new MongoClient(MONGO_URI);
    }

    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    db = client.db(MONGO_DB_NAME);
    logger.info(`Connected to MongoDB database: ${MONGO_DB_NAME}`);
    return db;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export const closeMongoConnection = async (): Promise<void> => {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      logger.info('MongoDB connection closed');
    }
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};
