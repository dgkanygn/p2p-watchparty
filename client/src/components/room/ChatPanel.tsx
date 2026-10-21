import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Send } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { useRoomStore } from '../../stores/useRoomStore';

interface ChatPanelProps {
  socket: Socket;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ socket }) => {
  const messages = useChatStore((s) => s.messages);
  const currentUser = useRoomStore((s) => s.currentUser);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_LENGTH = 200;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH) return;

    socket.emit('chat:send', { text: trimmed });
    setInputText('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-app-surface border border-app-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-app-border flex items-center justify-between shrink-0">
        <span className="text-xs font-mono text-app-muted uppercase tracking-wider">
          Oda Sohbeti
        </span>
        <span className="text-[10px] font-mono text-app-dim">
          Son {messages.length} mesaj
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs font-mono text-app-dim text-center p-4">
            Henüz mesaj yok. İlk mesajı yazın!
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div
                  key={msg.id}
                  className="py-1 px-2 text-center text-[11px] font-mono text-app-dim bg-app-hover/50 rounded-sm"
                >
                  {msg.text}
                </div>
              );
            }

            const isSelf = currentUser && msg.senderId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  isSelf ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 text-[10px] font-mono text-app-muted">
                  <span className={isSelf ? 'text-app-accent font-semibold' : ''}>
                    {isSelf ? 'Sen' : msg.senderName}
                  </span>
                  <span className="text-app-dim">{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`px-2.5 py-1.5 rounded-sm text-xs leading-relaxed break-words ${
                    isSelf
                      ? 'bg-app-accent-faint border border-app-accent/30 text-app-text'
                      : 'bg-app-hover border border-app-border text-app-text'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-2 border-t border-app-border bg-app-surface shrink-0 flex flex-col gap-1.5"
      >
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mesajınızı yazın..."
            maxLength={MAX_LENGTH}
            className="flex-1 bg-app-bg text-app-text border border-app-border rounded-sm px-3 py-1.5 text-xs placeholder:text-app-dim focus:outline-none focus:border-app-border-focus"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-app-accent text-black rounded-sm disabled:opacity-40 hover:bg-app-accent-hover transition-colors"
            title="Gönder"
          >
            <Send size={13} strokeWidth={2} />
          </button>
        </div>
        <div className="flex justify-end px-1">
          <span
            className={`text-[10px] font-mono ${
              inputText.length >= MAX_LENGTH ? 'text-app-danger' : 'text-app-dim'
            }`}
          >
            {inputText.length}/{MAX_LENGTH}
          </span>
        </div>
      </form>
    </div>
  );
};
