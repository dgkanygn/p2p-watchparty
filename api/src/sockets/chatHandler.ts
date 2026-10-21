import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { CONSTANTS } from '../config/constants';
import { RoomManager } from '../services/roomManager';
import { ChatMessage } from '../models/types';

export function registerChatHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  socket.on('chat:send', (payload: { text: string }) => {
    if (!payload || typeof payload.text !== 'string') return;

    const trimmed = payload.text.trim();
    if (!trimmed || trimmed.length > CONSTANTS.MAX_CHAT_MESSAGE_LENGTH) return;

    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    const message: ChatMessage = {
      id: nanoid(10),
      senderId: socket.id,
      senderName: user.nickname,
      text: trimmed,
      timestamp: Date.now(),
      isSystem: false,
    };

    io.to(room.id).emit('chat:message', message);
  });
}
