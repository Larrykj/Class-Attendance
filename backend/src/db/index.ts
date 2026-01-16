import { Sequelize, Dialect } from 'sequelize';
import { databaseOptions } from '../config/database';
import logger from '../config/logger';

// Create Sequelize instance
export const sequelize = new Sequelize(
  databaseOptions.database,
  databaseOptions.username,
  databaseOptions.password,
  {
    host: databaseOptions.host,
    port: databaseOptions.port,
    dialect: databaseOptions.dialect as Dialect,
    logging: (msg) => logger.debug(msg),
    pool: databaseOptions.pool,
  }
);

// Function to test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    logger.info('Connection to the database has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
};

export default sequelize;