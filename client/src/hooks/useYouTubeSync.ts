import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useRoomStore } from '../stores/useRoomStore';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubeSyncProps {
  socket: Socket | null;
  roomId?: string | null;
  canControl: boolean;
  elementId: string;
}

export const useYouTubeSync = ({
  socket,
  canControl,
  elementId,
}: UseYouTubeSyncProps) => {
  const playerRef = useRef<any>(null);
  const isRemoteAction = useRef<boolean>(false);
  const currentVideoIdRef = useRef<string | null>(null);
  const canControlRef = useRef<boolean>(canControl);
  const setVideoState = useRoomStore((s) => s.setVideoState);

  useEffect(() => {
    canControlRef.current = canControl;
  }, [canControl]);

  useEffect(() => {
    let isMounted = true;

    // Load YouTube script if not present
    if (!window.YT) {
      const existingScript = document.getElementById('yt-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }

    const initPlayer = () => {
      if (!isMounted) return;
      const targetElement = document.getElementById(elementId);
      if (!targetElement) return;

      try {
        playerRef.current = new window.YT.Player(elementId, {
          playerVars: {
            autoplay: 1,
            controls: 1, // keep native controls accessible; unauthorized actions get reverted
            disablekb: 0,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              socket?.emit('video:request-sync');
            },
            onStateChange: (event: any) => {
              if (isRemoteAction.current) return;
              if (!canControlRef.current) {
                // If unauthorized user interacts with controls, request sync to revert
                socket?.emit('video:request-sync');
                return;
              }

              // 1: PLAYING, 2: PAUSED
              if (event.data === 1) {
                const currentTime = playerRef.current?.getCurrentTime() || 0;
                setVideoState({ isPlaying: true, currentTime });
                socket?.emit('video:action', {
                  action: 'PLAY',
                  currentTime,
                });
              } else if (event.data === 2) {
                const currentTime = playerRef.current?.getCurrentTime() || 0;
                setVideoState({ isPlaying: false, currentTime });
                socket?.emit('video:action', {
                  action: 'PAUSE',
                  currentTime,
                });
              }
            },
          },
        });
      } catch (err) {
        console.error('Error initializing YouTube player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [elementId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleVideoSync = (data: {
      videoId: string | null;
      isPlaying: boolean;
      currentTime: number;
      serverTime: number;
    }) => {
      setVideoState({
        videoId: data.videoId,
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
        updatedAt: data.serverTime,
      });

      if (!playerRef.current || !playerRef.current.seekTo) return;

      isRemoteAction.current = true;

      // Calculate elapsed drift
      const latency = (Date.now() - data.serverTime) / 1000;
      const expectedTime = data.isPlaying
        ? data.currentTime + latency
        : data.currentTime;

      // If videoId changed, load the new video
      if (data.videoId && data.videoId !== currentVideoIdRef.current) {
        currentVideoIdRef.current = data.videoId;
        if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId: data.videoId,
            startSeconds: Math.max(0, expectedTime),
          });
        }
      } else {
        const localTime =
          typeof playerRef.current.getCurrentTime === 'function'
            ? playerRef.current.getCurrentTime()
            : 0;

        if (Math.abs(localTime - expectedTime) > 1.5) {
          playerRef.current.seekTo(Math.max(0, expectedTime), true);
        }
      }

      // Sync play/pause state
      const state =
        typeof playerRef.current.getPlayerState === 'function'
          ? playerRef.current.getPlayerState()
          : -1;

      if (data.isPlaying && state !== 1) {
        playerRef.current.playVideo();
      } else if (!data.isPlaying && state !== 2) {
        playerRef.current.pauseVideo();
      }

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 350);
    };

    socket.on('video:sync', handleVideoSync);

    return () => {
      socket.off('video:sync', handleVideoSync);
    };
  }, [socket, setVideoState]);

  return { player: playerRef };
};
