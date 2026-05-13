import http from 'http';
import app from './app';
import config from './config/config';
import { initSocket } from './services/socketService';
import logger from './lib/logger';

const server = http.createServer(app);

// Attach Socket.io to the HTTP server
initSocket(server);

server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
});
