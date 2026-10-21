import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/roomManager';

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  // room:create
  socket.on(
    'room:create',
    (
      payload: {
        title: string;
        nickname: string;
        maxUsers?: number;
        password?: string | null;
      },
      callback?: (response: { success: boolean; roomId?: string; error?: string }) => void
    ) => {
      try {
        const { room, user } = roomManager.createRoom({
          socketId: socket.id,
          nickname: payload.nickname,
          title: payload.title,
          maxUsers: payload.maxUsers,
          password: payload.password,
        });

        socket.join(room.id);

        const sanitized = roomManager.sanitizeRoom(room);
        socket.emit('room:joined', { room: sanitized, user });

        if (callback) {
          callback({ success: true, roomId: room.id });
        }
      } catch (err: any) {
        if (callback) {
          callback({ success: false, error: err.message || 'CREATE_FAILED' });
        }
      }
    }
  );

  // room:join
  socket.on(
    'room:join',
    (
      payload: {
        roomId: string;
        nickname: string;
        password?: string | null;
      },
      callback?: (response: { success: boolean; error?: string }) => void
    ) => {
      const result = roomManager.joinRoom({
        roomId: payload.roomId,
        socketId: socket.id,
        nickname: payload.nickname,
        password: payload.password,
      });

      if (!result.success || !result.room || !result.user) {
        if (callback) {
          callback({ success: false, error: result.error });
        }
        socket.emit('room:error', { message: result.error });
        return;
      }

      socket.join(result.room.id);

      const sanitized = roomManager.sanitizeRoom(result.room);
      // Confirm to joining user
      socket.emit('room:joined', { room: sanitized, user: result.user });

      // Notify other members
      socket.to(result.room.id).emit('room:user-joined', { user: result.user });

      if (callback) {
        callback({ success: true });
      }
    }
  );

  // room:leave
  socket.on('room:leave', () => {
    const roomId = roomManager.getRoomIdBySocket(socket.id);
    if (!roomId) return;

    socket.leave(roomId);
    const { user, newAdminId, roomDeleted } = roomManager.leaveRoom(socket.id);

    if (!roomDeleted && roomId) {
      io.to(roomId).emit('room:user-left', {
        userId: socket.id,
        newAdminId,
      });
      if (newAdminId) {
        io.to(roomId).emit('user:permission-updated', {
          userId: newAdminId,
          canControl: true,
        });
      }
    }
  });

  // room:kick-user
  socket.on('room:kick-user', (payload: { targetUserId: string }) => {
    const result = roomManager.kickUser(socket.id, payload.targetUserId);
    if (!result.success || !result.roomId) {
      socket.emit('error', { message: result.error || 'KICK_FAILED' });
      return;
    }

    const targetSocket = io.sockets.sockets.get(payload.targetUserId);
    if (targetSocket) {
      targetSocket.leave(result.roomId);
      targetSocket.emit('room:kicked', { reason: 'Oda yöneticisi tarafından çıkarıldınız.' });
    }

    io.to(result.roomId).emit('room:user-left', {
      userId: payload.targetUserId,
    });
  });

  // room:close
  socket.on('room:close', () => {
    const result = roomManager.closeRoom(socket.id);
    if (!result.success || !result.roomId) {
      socket.emit('error', { message: result.error || 'CLOSE_FAILED' });
      return;
    }

    io.to(result.roomId).emit('room:closed', {});

    // Disconnect room channels
    if (result.memberIds) {
      for (const mId of result.memberIds) {
        const s = io.sockets.sockets.get(mId);
        if (s) {
          s.leave(result.roomId);
        }
      }
    }
  });

  // user:set-permission
  socket.on(
    'user:set-permission',
    (payload: { targetUserId: string; canControl: boolean }) => {
      const result = roomManager.setPermission(
        socket.id,
        payload.targetUserId,
        payload.canControl
      );
      if (!result.success || !result.roomId) {
        socket.emit('error', { message: result.error || 'PERMISSION_FAILED' });
        return;
      }

      io.to(result.roomId).emit('user:permission-updated', {
        userId: payload.targetUserId,
        canControl: payload.canControl,
      });
    }
  );

  // camera:status-change
  socket.on('camera:status-change', (payload: { hasCamera: boolean }) => {
    const result = roomManager.setCameraStatus(socket.id, payload.hasCamera);
    if (!result.success || !result.roomId) return;

    socket.to(result.roomId).emit('camera:status-updated', {
      userId: socket.id,
      hasCamera: payload.hasCamera,
    });
  });
}
