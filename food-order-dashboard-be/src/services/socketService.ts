import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): void => {
  io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    // Vendor clients pass their vendorId in handshake auth to join their room
    const vendorId = socket.handshake.auth?.vendorId as string | undefined;
    if (vendorId) {
      socket.join(`vendor:${vendorId}`);
    }

    // Guest customers join the specific order room after placing an order
    socket.on('join:order', (orderId: string) => {
      if (typeof orderId === 'string' && orderId.length > 0) {
        socket.join(`order:${orderId}`);
      }
    });
  });
};

/** Emits a new order event to the vendor's room */
export const emitNewOrder = (vendorId: string, order: unknown): void => {
  io?.to(`vendor:${vendorId}`).emit('order:new', order);
};

/** Emits an order status change to the customer's order room */
export const emitOrderStatus = (orderId: string, status: string): void => {
  io?.to(`order:${orderId}`).emit('order:status', { orderId, status });
};

/** Emits an order event to the vendor's room (e.g. payment received) */
export const emitVendorOrderEvent = (vendorId: string, orderId: string, status: string): void => {
  io?.to(`vendor:${vendorId}`).emit('order:status', { orderId, status });
};
