import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/roomManager';
import { registerRoomHandlers } from './roomHandler';
import { registerVideoHandlers } from './videoHandler';
import { registerChatHandlers } from './chatHandler';
import { registerWebRTCHandlers } from './webrtcHandler';

export function registerAllHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  registerRoomHandlers(io, socket, roomManager);
  registerVideoHandlers(io, socket, roomManager);
  registerChatHandlers(io, socket, roomManager);
  registerWebRTCHandlers(io, socket, roomManager);
}
