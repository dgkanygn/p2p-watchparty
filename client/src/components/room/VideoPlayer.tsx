import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Play, Tv } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore';
import { useYouTubeSync } from '../../hooks/useYouTubeSync';
import { Button } from '../common/Button';

interface VideoPlayerProps {
  socket: Socket;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ socket }) => {
  const { roomId, currentUser } = useRoomStore();
  const canControl = Boolean(currentUser?.isAdmin || currentUser?.canControl);
  const [videoUrl, setVideoUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const elementId = 'yt-player-container';
  useYouTubeSync({
    socket,
    roomId,
    canControl,
    elementId,
  });

  const extractYouTubeId = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Direct ID check (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    // Standard youtube regex
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = trimmed.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    }

    return null;
  };

  const handleSourceChange = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    const videoId = extractYouTubeId(videoUrl);

    if (!videoId) {
      setUrlError('Geçerli bir YouTube video linki veya ID giriniz.');
      return;
    }

    socket.emit('video:change-source', { videoId });
    setVideoUrl('');
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Video Change Bar (Visible only to authorized members) */}
      {canControl ? (
        <form onSubmit={handleSourceChange} className="flex gap-2 w-full">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setUrlError(null);
            }}
            placeholder="YouTube video linki veya ID yapıştırın..."
            className="flex-1 bg-app-surface text-app-text border border-app-border rounded-sm px-3 py-1.5 text-xs placeholder:text-app-dim focus:outline-none focus:border-app-border-focus"
          />
          <Button type="submit" variant="primary" size="sm" className="gap-1 text-xs">
            <Play size={13} strokeWidth={1.75} fill="currentColor" />
            <span>Yükle</span>
          </Button>
        </form>
      ) : (
        <div className="text-[11px] font-mono text-app-dim flex items-center gap-1.5 py-0.5">
          <Tv size={13} strokeWidth={1.75} />
          <span>Yalnızca yönetici veya kontrol yetkisi olanlar video değiştirebilir.</span>
        </div>
      )}

      {urlError && <div className="text-xs text-app-danger">{urlError}</div>}

      {/* 16:9 Video Canvas */}
      <div className="relative w-full aspect-video bg-black border border-app-border rounded-sm overflow-hidden flex items-center justify-center">
        <div id={elementId} className="w-full h-full" />
      </div>
    </div>
  );
};
