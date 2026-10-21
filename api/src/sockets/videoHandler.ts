import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/roomManager';
import { VideoActionType } from '../models/types';

export function registerVideoHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  // video:change-source
  socket.on('video:change-source', (payload: { videoId: string }) => {
    if (!payload?.videoId) return;

    const result = roomManager.changeVideoSource(socket.id, payload.videoId);
    if (!result.success || !result.roomId || !result.videoState) {
      socket.emit('error', { message: result.error || 'VIDEO_CHANGE_FAILED' });
      return;
    }

    io.to(result.roomId).emit('video:sync', {
      videoId: result.videoState.videoId,
      isPlaying: result.videoState.isPlaying,
      currentTime: result.videoState.currentTime,
      serverTime: Date.now(),
    });
  });

  // video:action
  socket.on(
    'video:action',
    (payload: { action: VideoActionType; currentTime: number }) => {
      const result = roomManager.updateVideoState(
        socket.id,
        payload.action,
        payload.currentTime
      );

      if (!result.success || !result.roomId || !result.videoState) {
        // Re-sync caller with authoritative state if unauthorized
        const room = roomManager.getRoomBySocket(socket.id);
        if (room) {
          const elapsed = room.video.isPlaying
            ? (Date.now() - room.video.updatedAt) / 1000
            : 0;
          socket.emit('video:sync', {
            videoId: room.video.videoId,
            isPlaying: room.video.isPlaying,
            currentTime: room.video.currentTime + elapsed,
            serverTime: Date.now(),
          });
        }
        return;
      }

      // Broadcast video:sync to other room participants (sender already applied locally)
      socket.to(result.roomId).emit('video:sync', {
        videoId: result.videoState.videoId,
        isPlaying: result.videoState.isPlaying,
        currentTime: result.videoState.currentTime,
        serverTime: Date.now(),
      });
    }
  );

  // video:request-sync
  socket.on('video:request-sync', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const elapsed = room.video.isPlaying
      ? (Date.now() - room.video.updatedAt) / 1000
      : 0;
    const currentCalculatedTime = room.video.currentTime + elapsed;

    socket.emit('video:sync', {
      videoId: room.video.videoId,
      isPlaying: room.video.isPlaying,
      currentTime: currentCalculatedTime,
      serverTime: Date.now(),
    });
  });
}
