import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface CreateRoomFormProps {
  socket: Socket;
}

export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ socket }) => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [title, setTitle] = useState('');
  const [maxUsers, setMaxUsers] = useState<number>(4);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Lütfen bir kullanıcı adı girin.');
      return;
    }
    if (!title.trim()) {
      setError('Lütfen bir oda başlığı girin.');
      return;
    }

    setLoading(true);
    setError(null);

    socket.emit(
      'room:create',
      {
        nickname: nickname.trim(),
        title: title.trim(),
        maxUsers,
        password: password.trim() || null,
      },
      (res: { success: boolean; roomId?: string; error?: string }) => {
        setLoading(false);
        if (res.success && res.roomId) {
          navigate(`/room/${res.roomId}`);
        } else {
          setError(res.error || 'Oda oluşturulamadı.');
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-2.5 bg-app-danger/10 border border-app-danger/30 text-app-danger text-xs rounded-sm">
          {error}
        </div>
      )}

      <Input
        label="Kullanıcı Adı"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Örn. Mehmet"
        maxLength={20}
        required
      />

      <Input
        label="Oda Başlığı"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Örn. Akşam Sineması"
        maxLength={40}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-mono text-app-muted select-none">
          Kişi Sayısı Kapasitesi
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setMaxUsers(num)}
              className={`py-1.5 text-xs font-mono rounded-sm border transition-colors ${
                maxUsers === num
                  ? 'bg-app-accent text-black font-semibold border-app-accent'
                  : 'bg-app-surface text-app-muted border-app-border hover:border-app-border-focus'
              }`}
            >
              {num} Kişi
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Oda Şifresi"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="İsteğe bağlı"
        maxLength={30}
      />

      <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
        {loading ? 'Oluşturuluyor...' : 'Oda Oluştur'}
      </Button>
    </form>
  );
};
