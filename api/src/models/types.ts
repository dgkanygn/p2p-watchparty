export interface User {
  id: string;               // Socket ID
  nickname: string;
  isAdmin: boolean;
  canControl: boolean;       // Granted by room admin
  hasCamera: boolean;
  joinedAt: number;
}

export interface VideoState {
  videoId: string | null;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;        // Server epoch ms when state mutated
}

export interface Room {
  id: string;               // Nanoid or short slug (e.g. "stream-7x9q")
  title: string;
  password?: string | null; // Optional plain string for ephemeral room
  maxUsers: number;         // Upper limit: 4
  users: Map<string, User>;
  video: VideoState;
  createdAt: number;
}

export interface SanitizedRoom {
  id: string;
  title: string;
  hasPassword: boolean;
  maxUsers: number;
  users: User[];
  video: VideoState;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export type VideoActionType = 'PLAY' | 'PAUSE' | 'SEEK';
