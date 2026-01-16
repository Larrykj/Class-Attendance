import WebSocket from 'ws';
import http from 'http';
import url from 'url';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';
import logger from '../config/logger';

// WebSocket server instance
let wss: WebSocket.Server;

// Store connected clients with their user information
interface Client extends WebSocket {
  isAlive: boolean;
  userId?: number;
  role?: string;
}

// Map of connected clients by user ID
const clients: Map<number, Client[]> = new Map();

/**
 * Set up WebSocket server
 */
export const setupWebSocketServer = (server: http.Server): void => {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws: Client, req: http.IncomingMessage) => {
    ws.isAlive = true;
    
    // Parse token from URL query parameters
    const queryParams = url.parse(req.url || '', true).query;
    const token = queryParams.token as string;
    
    // Authenticate client
    if (!token) {
      logger.warn('WebSocket connection attempt without token');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, jwtConfig.secret) as { id: number; role: string };
      
      // Set user info on client
      ws.userId = decoded.id;
      ws.role = decoded.role;
      
      // Add client to clients map
      if (!clients.has(decoded.id)) {
        clients.set(decoded.id, []);
      }
      clients.get(decoded.id)?.push(ws);
      
      logger.info(`WebSocket client connected: User ID ${decoded.id}, role ${decoded.role}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to attendance system WebSocket server',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      logger.warn('Invalid WebSocket authentication token', error);
      ws.close(1008, 'Invalid authentication token');
      return;
    }
    
    // Handle pong messages (keepalive)
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle client messages
    ws.on('message', (message: WebSocket.Data) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug(`Received WebSocket message from user ${ws.userId}:`, data);
        
        // Handle different message types if needed
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      if (ws.userId) {
        // Remove client from the map
        const userClients = clients.get(ws.userId);
        if (userClients) {
          const index = userClients.indexOf(ws);
          if (index !== -1) {
            userClients.splice(index, 1);
          }
          
          // If no more clients for this user, remove the user from the map
          if (userClients.length === 0) {
            clients.delete(ws.userId);
          }
        }
        
        logger.info(`WebSocket client disconnected: User ID ${ws.userId}`);
      }
    });
  });
  
  // Set up a heartbeat interval to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: Client) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  // Clear interval when server closes
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  logger.info('WebSocket server has been set up');
};

/**
 * Broadcast attendance update to relevant users
 */
export const broadcastAttendanceUpdate = (data: {
  attendanceId: number;
  classId: number;
  studentId: number;
  date: Date;
  status: string;
  verificationMethod: string;
  message: string;
}): void => {
  if (!wss) {
    logger.warn('WebSocket server not initialized, cannot broadcast attendance update');
    return;
  }
  
  try {
    const payload = {
      type: 'attendance_update',
      data,
      timestamp: new Date().toISOString()
    };
    
    // Send to the student
    const studentClients = clients.get(data.studentId);
    if (studentClients) {
      studentClients.forEach(client => {
        client.send(JSON.stringify(payload));
      });
    }
    
    // Send to teachers and admins
    wss.clients.forEach((client: Client) => {
      // Only send to authenticated clients that are teachers or admins
      if (client.readyState === WebSocket.OPEN && 
          client.userId !== data.studentId && // Not the student (already sent above)
          (client.role === 'teacher' || client.role === 'admin')) {
        client.send(JSON.stringify(payload));
      }
    });
    
    logger.debug(`Broadcast attendance update for student ${data.studentId} in class ${data.classId}`);
  } catch (error) {
    logger.error('Error broadcasting attendance update:', error);
  }
};

/**
 * Send message to specific user
 */
export const sendToUser = (userId: number, data: any): void => {
  if (!wss) {
    logger.warn('WebSocket server not initialized, cannot send message');
    return;
  }
  
  const userClients = clients.get(userId);
  if (!userClients || userClients.length === 0) {
    logger.debug(`No active WebSocket connections for user ${userId}`);
    return;
  }
  
  try {
    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    });
    
    logger.debug(`Sent WebSocket message to user ${userId}`);
  } catch (error) {
    logger.error(`Error sending WebSocket message to user ${userId}:`, error);
  }
};

export default {
  setupWebSocketServer,
  broadcastAttendanceUpdate,
  sendToUser,
};