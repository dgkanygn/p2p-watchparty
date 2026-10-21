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
  id: string;
  title: string;
  password?: string | null;
  maxUsers: number;
  users: Map<string, User> | User[];
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
