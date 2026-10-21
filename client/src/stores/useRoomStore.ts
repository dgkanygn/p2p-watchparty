import { create } from 'zustand';
import type { SanitizedRoom, User, VideoState } from '../types';

interface RoomStore {
  roomId: string | null;
  room: SanitizedRoom | null;
  currentUser: User | null;
  users: User[];
  video: VideoState;
  isKicked: boolean;
  kickReason: string | null;
  isRoomClosed: boolean;
  error: string | null;

  setRoom: (room: SanitizedRoom, currentUser: User) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string, newAdminId?: string) => void;
  updateUserPermission: (userId: string, canControl: boolean) => void;
  updateUserCamera: (userId: string, hasCamera: boolean) => void;
  setVideoState: (video: Partial<VideoState>) => void;
  setKicked: (reason: string) => void;
  setRoomClosed: () => void;
  setError: (error: string | null) => void;
  resetRoom: () => void;
}

const initialVideoState: VideoState = {
  videoId: null,
  currentTime: 0,
  isPlaying: false,
  updatedAt: 0,
};

export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  room: null,
  currentUser: null,
  users: [],
  video: initialVideoState,
  isKicked: false,
  kickReason: null,
  isRoomClosed: false,
  error: null,

  setRoom: (room, currentUser) =>
    set({
      roomId: room.id,
      room,
      currentUser,
      users: room.users,
      video: room.video,
      isKicked: false,
      kickReason: null,
      isRoomClosed: false,
      error: null,
    }),

  addUser: (newUser) =>
    set((state) => {
      const exists = state.users.some((u) => u.id === newUser.id);
      if (exists) {
        return {
          users: state.users.map((u) => (u.id === newUser.id ? newUser : u)),
        };
      }
      return { users: [...state.users, newUser] };
    }),

  removeUser: (userId, newAdminId) =>
    set((state) => {
      const updatedUsers = state.users
        .filter((u) => u.id !== userId)
        .map((u) => {
          if (newAdminId && u.id === newAdminId) {
            return { ...u, isAdmin: true, canControl: true };
          }
          return u;
        });

      let updatedCurrentUser = state.currentUser;
      if (state.currentUser && state.currentUser.id === newAdminId) {
        updatedCurrentUser = {
          ...state.currentUser,
          isAdmin: true,
          canControl: true,
        };
      }

      return {
        users: updatedUsers,
        currentUser: updatedCurrentUser,
      };
    }),

  updateUserPermission: (userId, canControl) =>
    set((state) => {
      const updatedUsers = state.users.map((u) =>
        u.id === userId ? { ...u, canControl } : u
      );
      let updatedCurrentUser = state.currentUser;
      if (state.currentUser?.id === userId) {
        updatedCurrentUser = { ...state.currentUser, canControl };
      }
      return { users: updatedUsers, currentUser: updatedCurrentUser };
    }),

  updateUserCamera: (userId, hasCamera) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, hasCamera } : u
      ),
      currentUser:
        state.currentUser?.id === userId
          ? { ...state.currentUser, hasCamera }
          : state.currentUser,
    })),

  setVideoState: (videoUpdate) =>
    set((state) => ({
      video: { ...state.video, ...videoUpdate },
    })),

  setKicked: (reason) =>
    set({
      isKicked: true,
      kickReason: reason,
    }),

  setRoomClosed: () =>
    set({
      isRoomClosed: true,
    }),

  setError: (error) => set({ error }),

  resetRoom: () =>
    set({
      roomId: null,
      room: null,
      currentUser: null,
      users: [],
      video: initialVideoState,
      isKicked: false,
      kickReason: null,
      isRoomClosed: false,
      error: null,
    }),
}));
