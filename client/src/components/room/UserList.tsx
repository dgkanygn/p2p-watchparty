import React from 'react';
import { Socket } from 'socket.io-client';
import { Shield, ShieldAlert, UserMinus, Video } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore';
import { Badge } from '../common/Badge';

interface UserListProps {
  socket: Socket;
}

export const UserList: React.FC<UserListProps> = ({ socket }) => {
  const { users, currentUser } = useRoomStore();
  const isAdmin = currentUser?.isAdmin || false;

  const handleTogglePermission = (userId: string, currentCanControl: boolean) => {
    socket.emit('user:set-permission', {
      targetUserId: userId,
      canControl: !currentCanControl,
    });
  };

  const handleKickUser = (userId: string, nickname: string) => {
    if (window.confirm(`${nickname} adlı kullanıcıyı odadan atmak istiyor musunuz?`)) {
      socket.emit('room:kick-user', { targetUserId: userId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-app-surface border border-app-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-app-border flex items-center justify-between shrink-0">
        <span className="text-xs font-mono text-app-muted uppercase tracking-wider">
          Katılımcılar ({users.length})
        </span>
      </div>

      {/* User Items */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {users.map((user) => {
          const isSelf = currentUser && user.id === currentUser.id;

          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 bg-app-bg border border-app-border rounded-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-app-hover border border-app-border flex items-center justify-center font-mono text-xs text-app-text shrink-0 uppercase">
                  {user.nickname.slice(0, 2)}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-app-text truncate max-w-[110px]">
                      {user.nickname}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-mono text-app-dim">(Sen)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    {user.isAdmin && <Badge variant="admin">Admin</Badge>}
                    {user.canControl && !user.isAdmin && (
                      <Badge variant="control">Kontrol</Badge>
                    )}
                    {user.hasCamera && (
                      <span
                        className="text-app-accent flex items-center gap-0.5 text-[10px]"
                        title="Kamera Açık"
                      >
                        <Video size={10} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Actions for other members */}
              {isAdmin && !isSelf && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePermission(user.id, user.canControl)}
                    className={`p-1.5 rounded-sm border transition-colors ${
                      user.canControl
                        ? 'bg-app-accent-faint text-app-accent border-app-accent/40 hover:bg-app-danger/10 hover:text-app-danger hover:border-app-danger/30'
                        : 'bg-app-hover text-app-muted border-app-border hover:text-app-text hover:border-app-border-focus'
                    }`}
                    title={
                      user.canControl
                        ? 'Video kontrol yetkisini geri al'
                        : 'Video kontrol yetkisi ver'
                    }
                  >
                    {user.canControl ? (
                      <ShieldAlert size={13} strokeWidth={1.75} />
                    ) : (
                      <Shield size={13} strokeWidth={1.75} />
                    )}
                  </button>

                  <button
                    onClick={() => handleKickUser(user.id, user.nickname)}
                    className="p-1.5 rounded-sm bg-app-hover text-app-muted border border-app-border hover:bg-app-danger/10 hover:text-app-danger hover:border-app-danger/30 transition-colors"
                    title="Odadan At"
                  >
                    <UserMinus size={13} strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
