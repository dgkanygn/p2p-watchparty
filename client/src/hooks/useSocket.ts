import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRoomStore } from '../stores/useRoomStore';
import { useChatStore } from '../stores/useChatStore';
import type { ChatMessage, SanitizedRoom, User } from '../types';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    const serverUrl =
      import.meta.env.VITE_API_URL ||
      `http://${window.location.hostname}:4000`;

    socketInstance = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
};

export const useSocket = () => {
  const socketRef = useRef<Socket>(getSocket());
  const {
    setRoom,
    addUser,
    removeUser,
    updateUserPermission,
    updateUserCamera,
    setKicked,
    setRoomClosed,
  } = useRoomStore();
  const { addMessage } = useChatStore();

  useEffect(() => {
    const socket = socketRef.current;

    const handleRoomJoined = (data: { room: SanitizedRoom; user: User }) => {
      setRoom(data.room, data.user);
      addMessage({
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'Sistem',
        text: `Odaya katıldınız: ${data.room.title}`,
        timestamp: Date.now(),
        isSystem: true,
      });
    };

    const handleUserJoined = (data: { user: User }) => {
      addUser(data.user);
      addMessage({
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'Sistem',
        text: `${data.user.nickname} odaya katıldı.`,
        timestamp: Date.now(),
        isSystem: true,
      });
    };

    const handleUserLeft = (data: { userId: string; newAdminId?: string }) => {
      removeUser(data.userId, data.newAdminId);
      addMessage({
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'Sistem',
        text: `Bir katılımcı ayrıldı.`,
        timestamp: Date.now(),
        isSystem: true,
      });
    };

    const handlePermissionUpdated = (data: { userId: string; canControl: boolean }) => {
      updateUserPermission(data.userId, data.canControl);
    };

    const handleCameraStatusUpdated = (data: { userId: string; hasCamera: boolean }) => {
      updateUserCamera(data.userId, data.hasCamera);
    };

    const handleKicked = (data: { reason: string }) => {
      setKicked(data.reason || 'Odadan çıkarıldınız.');
    };

    const handleRoomClosed = () => {
      setRoomClosed();
    };

    const handleChatMessage = (msg: ChatMessage) => {
      addMessage(msg);
    };

    socket.on('room:joined', handleRoomJoined);
    socket.on('room:user-joined', handleUserJoined);
    socket.on('room:user-left', handleUserLeft);
    socket.on('user:permission-updated', handlePermissionUpdated);
    socket.on('camera:status-updated', handleCameraStatusUpdated);
    socket.on('room:kicked', handleKicked);
    socket.on('room:closed', handleRoomClosed);
    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:user-joined', handleUserJoined);
      socket.off('room:user-left', handleUserLeft);
      socket.off('user:permission-updated', handlePermissionUpdated);
      socket.off('camera:status-updated', handleCameraStatusUpdated);
      socket.off('room:kicked', handleKicked);
      socket.off('room:closed', handleRoomClosed);
      socket.off('chat:message', handleChatMessage);
    };
  }, [
    setRoom,
    addUser,
    removeUser,
    updateUserPermission,
    updateUserCamera,
    setKicked,
    setRoomClosed,
    addMessage,
  ]);

  return socketRef.current;
};
