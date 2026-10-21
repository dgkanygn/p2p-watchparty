import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/roomManager';

export function registerWebRTCHandlers(
  io: Server,
  socket: Socket,
  _roomManager: RoomManager
) {
  // webrtc:offer
  socket.on(
    'webrtc:offer',
    (payload: { to: string; sdp: any }) => {
      if (!payload?.to || !payload?.sdp) return;
      io.to(payload.to).emit('webrtc:offer', {
        from: socket.id,
        sdp: payload.sdp,
      });
    }
  );

  // webrtc:answer
  socket.on(
    'webrtc:answer',
    (payload: { to: string; sdp: any }) => {
      if (!payload?.to || !payload?.sdp) return;
      io.to(payload.to).emit('webrtc:answer', {
        from: socket.id,
        sdp: payload.sdp,
      });
    }
  );

  // webrtc:ice-candidate
  socket.on(
    'webrtc:ice-candidate',
    (payload: { to: string; candidate: any }) => {
      if (!payload?.to || !payload?.candidate) return;
      io.to(payload.to).emit('webrtc:ice-candidate', {
        from: socket.id,
        candidate: payload.candidate,
      });
    }
  );
}
