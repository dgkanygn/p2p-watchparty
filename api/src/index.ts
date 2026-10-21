import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerRoomHandlers } from './sockets/roomHandler';
import { registerVideoHandlers } from './sockets/videoHandler';
import { registerChatHandlers } from './sockets/chatHandler';
import { registerWebRTCHandlers } from './sockets/webrtcHandler';
import { RoomManager } from './services/roomManager';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

// Health check and room existence check
app.get('/health', (_, res) => res.json({ status: 'healthy', uptime: process.uptime() }));

app.get('/api/room/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });
  return res.json({
    id: room.id,
    title: room.title,
    userCount: room.users.size,
    maxUsers: room.maxUsers,
    isProtected: Boolean(room.password),
  });
});

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket, roomManager);
  registerVideoHandlers(io, socket, roomManager);
  registerChatHandlers(io, socket, roomManager);
  registerWebRTCHandlers(io, socket, roomManager);

  socket.on('disconnect', () => {
    roomManager.handleDisconnect(io, socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[WatchVideo API] Running on port ${PORT}`);
});
