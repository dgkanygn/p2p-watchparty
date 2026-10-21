import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useRoomStore } from '../stores/useRoomStore';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { max: 320 },
    height: { max: 240 },
    frameRate: { max: 15 },
  },
  audio: false, // STRICT: Video-only per specification
};

export const useWebRTC = (socket: Socket | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const currentUser = useRoomStore((s) => s.currentUser);
  const users = useRoomStore((s) => s.users);

  // Helper to create a peer connection
  const createPeerConnection = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      // If already exists, return
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(targetUserId, pc);

      // Add local tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc:ice-candidate', {
            to: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming remote track
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(targetUserId, event.streams[0]);
            return next;
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          // Cleanup
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(targetUserId);
            return next;
          });
        }
      };

      return pc;
    },
    [socket]
  );

  // Start local camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCameraActive(true);

      // Broadcast camera status to room
      socket?.emit('camera:status-change', { hasCamera: true });

      // Add track to all existing peer connections or initiate offers
      peerConnectionsRef.current.forEach(async (pc, targetUserId) => {
        const senders = pc.getSenders();
        const videoTrack = stream.getVideoTracks()[0];
        const existingSender = senders.find((s) => s.track?.kind === 'video');

        if (existingSender) {
          await existingSender.replaceTrack(videoTrack);
        } else {
          pc.addTrack(videoTrack, stream);
          // Renegotiate
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('webrtc:offer', { to: targetUserId, sdp: offer });
          } catch (err) {
            console.error('Error renegotiating offer:', err);
          }
        }
      });

      // Initiate connection to all other peers in room if not yet connected
      if (currentUser) {
        users.forEach(async (peer) => {
          if (peer.id !== currentUser.id && !peerConnectionsRef.current.has(peer.id)) {
            const pc = createPeerConnection(peer.id);
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket?.emit('webrtc:offer', { to: peer.id, sdp: offer });
            } catch (err) {
              console.error('Error creating offer for peer:', err);
            }
          }
        });
      }
    } catch (err: any) {
      console.error('Failed to get camera access:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Kamera erişim izni reddedildi.'
          : 'Kamera açılamadı veya bulunamadı.'
      );
      setIsCameraActive(false);
      socket?.emit('camera:status-change', { hasCamera: false });
    }
  }, [socket, currentUser, users, createPeerConnection]);

  // Stop local camera
  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setIsCameraActive(false);

    // Remove video sender tracks from peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          pc.removeTrack(sender);
        }
      });
    });

    socket?.emit('camera:status-change', { hasCamera: false });
  }, [socket]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Socket signaling listener setup
  useEffect(() => {
    if (!socket) return;

    // When a remote peer sends an offer
    const handleOffer = async (data: { from: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const pc = createPeerConnection(data.from);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Flush any pending candidates
        const pending = pendingCandidatesRef.current.get(data.from) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current.delete(data.from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          to: data.from,
          sdp: answer,
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    // When a remote peer sends an answer
    const handleAnswer = async (data: { from: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const pc = peerConnectionsRef.current.get(data.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          const pending = pendingCandidatesRef.current.get(data.from) || [];
          for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current.delete(data.from);
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    };

    // When an ICE candidate arrives
    const handleIceCandidate = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        const pc = peerConnectionsRef.current.get(data.from);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          // Store pending candidate until remote description is set
          const pending = pendingCandidatesRef.current.get(data.from) || [];
          pending.push(data.candidate);
          pendingCandidatesRef.current.set(data.from, pending);
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    // When a peer leaves
    const handleUserLeft = (data: { userId: string }) => {
      const pc = peerConnectionsRef.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.userId);
      }
      pendingCandidatesRef.current.delete(data.userId);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    // When a new user joins, if we have camera, send them an offer
    const handleUserJoined = async (data: { user: { id: string } }) => {
      if (localStreamRef.current) {
        const pc = createPeerConnection(data.user.id);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', { to: data.user.id, sdp: offer });
        } catch (err) {
          console.error('Error creating offer for joined user:', err);
        }
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('room:user-left', handleUserLeft);
    socket.on('room:user-joined', handleUserJoined);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('room:user-left', handleUserLeft);
      socket.off('room:user-joined', handleUserJoined);
    };
  }, [socket, createPeerConnection]);

  // Clean up all streams and peer connections on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    isCameraActive,
    cameraError,
    toggleCamera,
    startCamera,
    stopCamera,
  };
};
