import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import { CONSTANTS } from '../config/constants';
import { Room, User, VideoState, SanitizedRoom, VideoActionType } from '../models/types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map();

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.userToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public getRoomIdBySocket(socketId: string): string | undefined {
    return this.userToRoom.get(socketId);
  }

  public sanitizeRoom(room: Room): SanitizedRoom {
    return {
      id: room.id,
      title: room.title,
      hasPassword: Boolean(room.password),
      maxUsers: room.maxUsers,
      users: Array.from(room.users.values()),
      video: room.video,
      createdAt: room.createdAt,
    };
  }

  public createRoom(params: {
    socketId: string;
    nickname: string;
    title: string;
    maxUsers?: number;
    password?: string | null;
  }): { room: Room; user: User } {
    const { socketId, nickname, title, password } = params;
    let maxUsers = params.maxUsers || CONSTANTS.DEFAULT_MAX_USERS;
    if (maxUsers < CONSTANTS.MIN_ROOM_USERS) maxUsers = CONSTANTS.MIN_ROOM_USERS;
    if (maxUsers > CONSTANTS.MAX_ROOM_USERS) maxUsers = CONSTANTS.MAX_ROOM_USERS;

    const roomId = `room-${nanoid(6)}`;
    const user: User = {
      id: socketId,
      nickname: nickname.trim().slice(0, CONSTANTS.MAX_NICKNAME_LENGTH) || 'Host',
      isAdmin: true,
      canControl: true,
      hasCamera: false,
      joinedAt: Date.now(),
    };

    const initialVideo: VideoState = {
      videoId: 'dQw4w9WgXcQ', // default placeholder video
      currentTime: 0,
      isPlaying: false,
      updatedAt: Date.now(),
    };

    const room: Room = {
      id: roomId,
      title: title.trim().slice(0, CONSTANTS.MAX_TITLE_LENGTH) || 'İzleme Odası',
      password: password && password.trim().length > 0 ? password.trim() : null,
      maxUsers,
      users: new Map([[socketId, user]]),
      video: initialVideo,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.userToRoom.set(socketId, roomId);

    return { room, user };
  }

  public joinRoom(params: {
    roomId: string;
    socketId: string;
    nickname: string;
    password?: string | null;
  }): { success: boolean; room?: Room; user?: User; error?: string } {
    const { roomId, socketId, nickname, password } = params;
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (room.users.has(socketId)) {
      return { success: true, room, user: room.users.get(socketId) };
    }

    if (room.users.size >= room.maxUsers) {
      return { success: false, error: 'ROOM_FULL' };
    }

    if (room.password && room.password !== (password || '')) {
      return { success: false, error: 'INVALID_PASSWORD' };
    }

    const user: User = {
      id: socketId,
      nickname: nickname.trim().slice(0, CONSTANTS.MAX_NICKNAME_LENGTH) || 'Konuk',
      isAdmin: false,
      canControl: false,
      hasCamera: false,
      joinedAt: Date.now(),
    };

    room.users.set(socketId, user);
    this.userToRoom.set(socketId, roomId);

    return { success: true, room, user };
  }

  public leaveRoom(socketId: string): {
    roomId?: string;
    user?: User;
    newAdminId?: string;
    roomDeleted: boolean;
  } {
    const roomId = this.userToRoom.get(socketId);
    if (!roomId) {
      return { roomDeleted: false };
    }

    this.userToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) {
      return { roomId, roomDeleted: true };
    }

    const leavingUser = room.users.get(socketId);
    room.users.delete(socketId);

    // Garbage collection if room is empty
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      return { roomId, user: leavingUser, roomDeleted: true };
    }

    let newAdminId: string | undefined;
    if (leavingUser?.isAdmin) {
      // Transfer admin rights to earliest joined user
      let earliestUser: User | null = null;
      for (const u of room.users.values()) {
        if (!earliestUser || u.joinedAt < earliestUser.joinedAt) {
          earliestUser = u;
        }
      }
      if (earliestUser) {
        earliestUser.isAdmin = true;
        earliestUser.canControl = true;
        newAdminId = earliestUser.id;
      }
    }

    return { roomId, user: leavingUser, newAdminId, roomDeleted: false };
  }

  public kickUser(
    adminSocketId: string,
    targetUserId: string
  ): { success: boolean; error?: string; roomId?: string; kickedUser?: User } {
    const roomId = this.userToRoom.get(adminSocketId);
    if (!roomId) return { success: false, error: 'NOT_IN_ROOM' };

    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };

    const admin = room.users.get(adminSocketId);
    if (!admin || !admin.isAdmin) {
      return { success: false, error: 'FORBIDDEN' };
    }

    if (adminSocketId === targetUserId) {
      return { success: false, error: 'CANNOT_KICK_SELF' };
    }

    const kickedUser = room.users.get(targetUserId);
    if (!kickedUser) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    room.users.delete(targetUserId);
    this.userToRoom.delete(targetUserId);

    return { success: true, roomId, kickedUser };
  }

  public closeRoom(
    adminSocketId: string
  ): { success: boolean; roomId?: string; memberIds?: string[]; error?: string } {
    const roomId = this.userToRoom.get(adminSocketId);
    if (!roomId) return { success: false, error: 'NOT_IN_ROOM' };

    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };

    const admin = room.users.get(adminSocketId);
    if (!admin || !admin.isAdmin) {
      return { success: false, error: 'FORBIDDEN' };
    }

    const memberIds = Array.from(room.users.keys());
    for (const memberId of memberIds) {
      this.userToRoom.delete(memberId);
    }
    this.rooms.delete(roomId);

    return { success: true, roomId, memberIds };
  }

  public setPermission(
    adminSocketId: string,
    targetUserId: string,
    canControl: boolean
  ): { success: boolean; error?: string; targetUser?: User; roomId?: string } {
    const roomId = this.userToRoom.get(adminSocketId);
    if (!roomId) return { success: false, error: 'NOT_IN_ROOM' };

    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };

    const admin = room.users.get(adminSocketId);
    if (!admin || !admin.isAdmin) {
      return { success: false, error: 'FORBIDDEN' };
    }

    const targetUser = room.users.get(targetUserId);
    if (!targetUser) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    targetUser.canControl = canControl;
    return { success: true, targetUser, roomId };
  }

  public updateVideoState(
    socketId: string,
    action: VideoActionType,
    currentTime: number
  ): { success: boolean; error?: string; videoState?: VideoState; roomId?: string } {
    const roomId = this.userToRoom.get(socketId);
    if (!roomId) return { success: false, error: 'NOT_IN_ROOM' };

    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };

    const user = room.users.get(socketId);
    if (!user || (!user.isAdmin && !user.canControl)) {
      return { success: false, error: 'FORBIDDEN' };
    }

    const isPlaying = action === 'PLAY';
    room.video.currentTime = Math.max(0, currentTime);
    room.video.isPlaying = isPlaying;
    room.video.updatedAt = Date.now();

    return { success: true, videoState: room.video, roomId };
  }

  public changeVideoSource(
    socketId: string,
    videoId: string
  ): { success: boolean; error?: string; videoState?: VideoState; roomId?: string } {
    const roomId = this.userToRoom.get(socketId);
    if (!roomId) return { success: false, error: 'NOT_IN_ROOM' };

    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };

    const user = room.users.get(socketId);
    if (!user || (!user.isAdmin && !user.canControl)) {
      return { success: false, error: 'FORBIDDEN' };
    }

    room.video.videoId = videoId;
    room.video.currentTime = 0;
    room.video.isPlaying = true;
    room.video.updatedAt = Date.now();

    return { success: true, videoState: room.video, roomId };
  }

  public setCameraStatus(
    socketId: string,
    hasCamera: boolean
  ): { success: boolean; error?: string; roomId?: string; user?: User } {
    const roomId = this.userToRoom.get(socketId);
    if (!roomId) return { success: false, error: 'NOT_IN_ROOM' };

    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };

    const user = room.users.get(socketId);
    if (!user) return { success: false, error: 'USER_NOT_FOUND' };

    user.hasCamera = hasCamera;
    return { success: true, roomId, user };
  }

  public handleDisconnect(io: Server, socketId: string): void {
    const { roomId, user, newAdminId, roomDeleted } = this.leaveRoom(socketId);
    if (!roomId) return;

    if (!roomDeleted) {
      io.to(roomId).emit('room:user-left', {
        userId: socketId,
        newAdminId,
      });

      // If admin changed, broadcast permission update
      if (newAdminId) {
        io.to(roomId).emit('user:permission-updated', {
          userId: newAdminId,
          canControl: true,
        });
      }
    }
  }
}
