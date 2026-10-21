import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { Share2, Users, LogOut, Trash2, Check } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore';
import { Button } from '../common/Button';

interface RoomHeaderProps {
  socket: Socket;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({ socket }) => {
  const navigate = useNavigate();
  const { room, currentUser, users, resetRoom } = useRoomStore();
  const [copied, setCopied] = useState(false);

  const isAdmin = currentUser?.isAdmin || false;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleLeave = () => {
    socket.emit('room:leave');
    resetRoom();
    navigate('/');
  };

  const handleCloseRoom = () => {
    if (window.confirm('Odayı kapatmak istediğinize emin misiniz? Tüm katılımcılar çıkarılacak ve oda silinecek.')) {
      socket.emit('room:close');
      resetRoom();
      navigate('/');
    }
  };

  return (
    <header className="h-14 bg-app-surface border-b border-app-border px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold text-app-text truncate">
          {room?.title || 'İzleme Odası'}
        </h1>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-app-hover border border-app-border rounded-sm text-xs font-mono text-app-muted">
          <Users size={13} strokeWidth={1.75} />
          <span>
            {users.length} / {room?.maxUsers || 4}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyLink}
          className="gap-1.5 font-mono text-xs"
          title="Bağlantıyı Kopyala"
        >
          {copied ? (
            <>
              <Check size={14} strokeWidth={1.75} className="text-app-accent" />
              <span>Kopyalandı</span>
            </>
          ) : (
            <>
              <Share2 size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">Davet Et</span>
            </>
          )}
        </Button>

        {isAdmin ? (
          <Button
            variant="danger"
            size="sm"
            onClick={handleCloseRoom}
            className="gap-1.5 text-xs"
            title="Odayı Kapat"
          >
            <Trash2 size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Odayı Kapat</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="gap-1.5 text-xs text-app-muted hover:text-app-danger"
            title="Odadan Ayrıl"
          >
            <LogOut size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Ayrıl</span>
          </Button>
        )}
      </div>
    </header>
  );
};
