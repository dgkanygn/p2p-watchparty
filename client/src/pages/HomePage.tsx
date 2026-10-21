import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Tv, Plus, LogIn } from 'lucide-react';
import { CreateRoomForm } from '../components/home/CreateRoomForm';
import { JoinRoomPrompt } from '../components/home/JoinRoomPrompt';

interface HomePageProps {
  socket: Socket;
}

export const HomePage: React.FC<HomePageProps> = ({ socket }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-2 mb-6 text-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-app-surface border border-app-border flex items-center justify-center text-app-accent">
            <Tv size={18} strokeWidth={1.75} />
          </div>
          <span className="font-mono text-base font-semibold tracking-wider text-app-text">
            WATCHVIDEO
          </span>
          <span className="w-2 h-2 rounded-full bg-app-accent animate-pulse" />
        </div>
        <p className="text-xs font-mono text-app-muted">
          Gerçek zamanlı senkronize YouTube & WebRTC video odası
        </p>
      </div>

      {/* Minimalist Card Container */}
      <div className="w-full max-w-[420px] bg-app-surface border border-app-border rounded-md overflow-hidden shadow-2xl">
        {/* Tab Selector */}
        <div className="flex border-b border-app-border bg-app-bg">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-3 text-xs font-mono flex items-center justify-center gap-2 border-b-2 transition-colors ${
              tab === 'create'
                ? 'border-app-accent text-app-accent font-semibold bg-app-surface'
                : 'border-transparent text-app-muted hover:text-app-text'
            }`}
          >
            <Plus size={14} strokeWidth={1.75} />
            <span>Oda Kur</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-3 text-xs font-mono flex items-center justify-center gap-2 border-b-2 transition-colors ${
              tab === 'join'
                ? 'border-app-accent text-app-accent font-semibold bg-app-surface'
                : 'border-transparent text-app-muted hover:text-app-text'
            }`}
          >
            <LogIn size={14} strokeWidth={1.75} />
            <span>Odaya Katıl</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5">
          {tab === 'create' ? (
            <CreateRoomForm socket={socket} />
          ) : (
            <JoinRoomPrompt />
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-[11px] font-mono text-app-dim">
        Maksimum 4 kişi • P2P WebRTC kamera • Geçici RAM depolama
      </div>
    </div>
  );
};
