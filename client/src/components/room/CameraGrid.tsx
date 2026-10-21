import React from 'react';
import { Video, VideoOff } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore';
import { CameraBox } from './CameraBox';
import { Button } from '../common/Button';

interface CameraGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isCameraActive: boolean;
  cameraError: string | null;
  toggleCamera: () => void;
}

export const CameraGrid: React.FC<CameraGridProps> = ({
  localStream,
  remoteStreams,
  isCameraActive,
  cameraError,
  toggleCamera,
}) => {
  const { currentUser, users } = useRoomStore();

  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-app-muted uppercase tracking-wider">
          Kameralar ({users.length} / 4)
        </span>

        <Button
          variant={isCameraActive ? 'danger' : 'secondary'}
          size="sm"
          onClick={toggleCamera}
          className="gap-1.5 text-xs"
        >
          {isCameraActive ? (
            <>
              <VideoOff size={13} strokeWidth={1.75} />
              <span>Kamerayı Kapat</span>
            </>
          ) : (
            <>
              <Video size={13} strokeWidth={1.75} />
              <span>Kamerayı Aç</span>
            </>
          )}
        </Button>
      </div>

      {cameraError && (
        <div className="p-2 bg-app-danger/10 border border-app-danger/30 text-app-danger text-xs rounded-sm">
          {cameraError}
        </div>
      )}

      {/* Grid of up to 4 users */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
        {/* Local user tile */}
        {currentUser && (
          <CameraBox
            user={currentUser}
            stream={localStream}
            isSelf={true}
            isCameraActive={isCameraActive}
          />
        )}

        {/* Remote peer tiles */}
        {otherUsers.map((user) => (
          <CameraBox
            key={user.id}
            user={user}
            stream={remoteStreams.get(user.id) || null}
            isSelf={false}
            isCameraActive={user.hasCamera}
          />
        ))}

        {/* Empty placeholder slots to indicate capacity */}
        {Array.from({ length: Math.max(0, 4 - users.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="aspect-video bg-app-surface/50 border border-dashed border-app-border rounded-sm flex flex-col items-center justify-center text-app-dim text-[11px] font-mono"
          >
            <span>Boş Slot</span>
          </div>
        ))}
      </div>
    </div>
  );
};
