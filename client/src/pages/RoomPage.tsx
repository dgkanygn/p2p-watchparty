import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { MessageSquare, Users, Video, AlertTriangle } from 'lucide-react';
import { useRoomStore } from '../stores/useRoomStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { RoomHeader } from '../components/room/RoomHeader';
import { VideoPlayer } from '../components/room/VideoPlayer';
import { CameraGrid } from '../components/room/CameraGrid';
import { ChatPanel } from '../components/room/ChatPanel';
import { UserList } from '../components/room/UserList';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

interface RoomPageProps {
  socket: Socket;
}

interface RoomInfo {
  id: string;
  title: string;
  userCount: number;
  maxUsers: number;
  isProtected: boolean;
}

export const RoomPage: React.FC<RoomPageProps> = ({ socket }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const {
    room,
    currentUser,
    isKicked,
    kickReason,
    isRoomClosed,
    resetRoom,
  } = useRoomStore();

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);
  const [roomNotFound, setRoomNotFound] = useState<boolean>(false);

  // Entry Modal State
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Mobile active tab: 'chat' | 'cameras' | 'users'
  const [mobileTab, setMobileTab] = useState<'chat' | 'cameras' | 'users'>('chat');

  // WebRTC mesh video hook
  const {
    localStream,
    remoteStreams,
    isCameraActive,
    cameraError,
    toggleCamera,
  } = useWebRTC(socket);

  const isInRoom = Boolean(room && currentUser && room.id === roomId);

  // Fetch room pre-flight info if not already joined
  useEffect(() => {
    if (isInRoom) {
      setLoadingInfo(false);
      return;
    }

    if (!roomId) {
      setRoomNotFound(true);
      setLoadingInfo(false);
      return;
    }

    let isMounted = true;
    const apiUrl =
      import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;

    fetch(`${apiUrl}/api/room/${roomId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('ROOM_NOT_FOUND');
        }
        return res.json();
      })
      .then((data: RoomInfo) => {
        if (isMounted) {
          setRoomInfo(data);
          setLoadingInfo(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRoomNotFound(true);
          setLoadingInfo(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [roomId, isInRoom]);

  // Handle Join Room from Modal
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setJoinError('Lütfen bir kullanıcı adı girin.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    socket.emit(
      'room:join',
      {
        roomId,
        nickname: nickname.trim(),
        password: password.trim() || null,
      },
      (res: { success: boolean; error?: string }) => {
        setIsJoining(false);
        if (!res.success) {
          if (res.error === 'INVALID_PASSWORD') {
            setJoinError('Hatalı oda şifresi.');
          } else if (res.error === 'ROOM_FULL') {
            setJoinError('Oda maksimum kapasiteye ulaştı.');
          } else {
            setJoinError(res.error || 'Odaya katılınamadı.');
          }
        }
      }
    );
  };

  // If Kicked or Room Closed
  if (isKicked) {
    return (
      <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-app-surface border border-app-danger/40 rounded-md p-6 flex flex-col items-center text-center gap-3">
          <AlertTriangle size={32} className="text-app-danger" />
          <h2 className="text-base font-semibold">Odadan Çıkarıldınız</h2>
          <p className="text-xs text-app-muted">
            {kickReason || 'Oda yöneticisi tarafından odadan çıkarıldınız.'}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              resetRoom();
              navigate('/');
            }}
            className="w-full mt-2"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  if (isRoomClosed) {
    return (
      <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-app-surface border border-app-border rounded-md p-6 flex flex-col items-center text-center gap-3">
          <AlertTriangle size={32} className="text-app-warning" />
          <h2 className="text-base font-semibold">Oda Kapatıldı</h2>
          <p className="text-xs text-app-muted">
            Oda yöneticisi odayı kapattı ve oda verileri silindi.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              resetRoom();
              navigate('/');
            }}
            className="w-full mt-2"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // If Room Not Found
  if (roomNotFound) {
    return (
      <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-app-surface border border-app-border rounded-md p-6 flex flex-col items-center text-center gap-3">
          <AlertTriangle size={32} className="text-app-warning" />
          <h2 className="text-base font-semibold">Oda Bulunamadı</h2>
          <p className="text-xs text-app-muted">
            Girdiğiniz oda mevcut değil veya kapatılmış.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="w-full mt-2"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // Pre-join Modal (if not yet in room)
  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center p-4">
        <Modal isOpen={true} title="Odaya Katıl" maxWidth="max-w-sm">
          {loadingInfo ? (
            <div className="py-6 text-center text-xs font-mono text-app-dim">
              Oda bilgileri yükleniyor...
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
              <div className="p-3 bg-app-hover border border-app-border rounded-sm flex flex-col gap-1">
                <span className="text-xs font-semibold text-app-text">
                  {roomInfo?.title || 'İzleme Odası'}
                </span>
                <span className="text-[11px] font-mono text-app-muted">
                  Kapasite: {roomInfo?.userCount} / {roomInfo?.maxUsers} Kişi
                </span>
              </div>

              {joinError && (
                <div className="p-2 bg-app-danger/10 border border-app-danger/30 text-app-danger text-xs rounded-sm">
                  {joinError}
                </div>
              )}

              <Input
                label="Kullanıcı Adı"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Örn: Ahmet"
                maxLength={20}
                required
              />

              {roomInfo?.isProtected && (
                <Input
                  label="Oda Şifresi"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre giriniz"
                  required
                />
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={isJoining}
                className="w-full mt-2"
              >
                {isJoining ? 'Katılınıyor...' : 'Odaya Gir'}
              </Button>
            </form>
          )}
        </Modal>
      </div>
    );
  }

  // Active Room Layout
  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-app-bg text-app-text lg:overflow-hidden">
      {/* Top Header Bar */}
      <RoomHeader socket={socket} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Area (Desktop ~68%, Mobile Full) */}
        <div className="w-full lg:w-[68%] p-3 sm:p-4 flex flex-col gap-4 overflow-y-auto min-h-0">
          {/* YouTube Player & URL Bar */}
          <VideoPlayer socket={socket} />

          {/* Camera Grid (Desktop view) */}
          <div className="hidden lg:block">
            <CameraGrid
              localStream={localStream}
              remoteStreams={remoteStreams}
              isCameraActive={isCameraActive}
              cameraError={cameraError}
              toggleCamera={toggleCamera}
            />
          </div>
        </div>

        {/* Right Sidebar (Desktop ~32%) */}
        <div className="hidden lg:flex w-full lg:w-[32%] border-l border-app-border flex-col p-3 gap-3 bg-app-bg overflow-hidden min-h-0">
          {/* Split: Katılımcılar (compact list max 180px) & Sohbet (flex-1) */}
          <div className="max-h-[190px] shrink-0 overflow-hidden flex flex-col">
            <UserList socket={socket} />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel socket={socket} />
          </div>
        </div>

        {/* Mobile View: Tabbed Layout (<= 1024px) */}
        <div className="lg:hidden flex-1 flex flex-col border-t border-app-border bg-app-surface min-h-[360px]">
          {/* Mobile Segmented Switcher */}
          <div className="flex border-b border-app-border bg-app-surface shrink-0">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                mobileTab === 'chat'
                  ? 'border-app-accent text-app-accent font-semibold bg-app-hover'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <MessageSquare size={13} strokeWidth={1.75} />
              <span>Sohbet</span>
            </button>

            <button
              onClick={() => setMobileTab('cameras')}
              className={`flex-1 py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                mobileTab === 'cameras'
                  ? 'border-app-accent text-app-accent font-semibold bg-app-hover'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <Video size={13} strokeWidth={1.75} />
              <span>Kameralar</span>
            </button>

            <button
              onClick={() => setMobileTab('users')}
              className={`flex-1 py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                mobileTab === 'users'
                  ? 'border-app-accent text-app-accent font-semibold bg-app-hover'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <Users size={13} strokeWidth={1.75} />
              <span>Katılımcılar</span>
            </button>
          </div>

          {/* Mobile Tab Content */}
          <div className="flex-1 p-2 min-h-0 overflow-hidden">
            {mobileTab === 'chat' && <ChatPanel socket={socket} />}
            {mobileTab === 'cameras' && (
              <div className="p-1 overflow-y-auto h-full">
                <CameraGrid
                  localStream={localStream}
                  remoteStreams={remoteStreams}
                  isCameraActive={isCameraActive}
                  cameraError={cameraError}
                  toggleCamera={toggleCamera}
                />
              </div>
            )}
            {mobileTab === 'users' && <UserList socket={socket} />}
          </div>
        </div>
      </div>
    </div>
  );
};
