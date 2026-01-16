import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { sequelize } from './db';
import logger from './config/logger';
import { setupWebSocketServer } from './services/websocket.service';
import http from 'http';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Create HTTP server
    const server = http.createServer(app);

    // Setup WebSocket server
    setupWebSocketServer(server);

    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Sync database models
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized successfully.');

    // Start the server
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});