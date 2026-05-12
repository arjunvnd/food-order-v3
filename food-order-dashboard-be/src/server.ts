import http from 'http';
import app from './app';
import config from './config/config';
import { initSocket } from './services/socketService';

const server = http.createServer(app);

// Attach Socket.io to the HTTP server
initSocket(server);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});
