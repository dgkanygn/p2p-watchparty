import React, { useEffect, useRef } from 'react';
import { CameraOff, Video } from 'lucide-react';
import type { User } from '../../types';

interface CameraBoxProps {
  user: User;
  stream: MediaStream | null;
  isSelf?: boolean;
  isCameraActive?: boolean;
}

export const CameraBox: React.FC<CameraBoxProps> = ({
  user,
  stream,
  isSelf = false,
  isCameraActive = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideoStream = Boolean(stream && stream.getVideoTracks().length > 0);
  const showVideo = isSelf ? isCameraActive && hasVideoStream : hasVideoStream;

  useEffect(() => {
    if (videoRef.current) {
      if (showVideo && stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, showVideo]);

  return (
    <div className="relative aspect-video bg-app-surface border border-app-border rounded-sm overflow-hidden flex items-center justify-center">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Strictly muted per specification
          className={`w-full h-full object-cover ${isSelf ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 text-app-dim">
          <div className="w-10 h-10 rounded-full bg-app-hover border border-app-border flex items-center justify-center font-mono text-sm text-app-muted uppercase">
            {user.nickname.slice(0, 2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <CameraOff size={12} strokeWidth={1.75} />
            <span>Kamera Kapalı</span>
          </div>
        </div>
      )}

      {/* Overlay label */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded-sm text-[10px] font-mono text-app-text backdrop-blur-xs">
          {showVideo && <Video size={10} className="text-app-accent" />}
          <span className="truncate max-w-[80px]">
            {user.nickname} {isSelf && '(Sen)'}
          </span>
        </div>

        {user.isAdmin && (
          <span className="bg-app-accent-faint text-app-accent border border-app-accent/30 px-1 py-0.5 rounded-sm text-[9px] font-mono uppercase">
            Admin
          </span>
        )}
      </div>
    </div>
  );
};
