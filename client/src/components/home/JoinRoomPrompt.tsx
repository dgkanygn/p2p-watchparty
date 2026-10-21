import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Link2 } from 'lucide-react';

export const JoinRoomPrompt: React.FC = () => {
  const navigate = useNavigate();
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setError('Lütfen bir oda kodu veya bağlantısı girin.');
      return;
    }

    let roomId = trimmed;
    // Extract room id if full url is pasted
    if (trimmed.includes('/room/')) {
      const parts = trimmed.split('/room/');
      roomId = parts[parts.length - 1].split('?')[0].split('#')[0];
    }

    if (!roomId) {
      setError('Geçerli bir oda kodu bulunamadı.');
      return;
    }

    navigate(`/room/${roomId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-3 bg-app-hover border border-app-border rounded-sm flex items-start gap-2.5">
        <Link2 size={16} strokeWidth={1.75} className="text-app-accent shrink-0 mt-0.5" />
        <p className="text-xs text-app-muted leading-relaxed">
          Doğrudan bir odaya katılmak için oda kurucusundan oda bağlantısını (link) isteyiniz.
        </p>
      </div>

      <form onSubmit={handleJoin} className="flex flex-col gap-3">
        {error && (
          <div className="p-2 bg-app-danger/10 border border-app-danger/30 text-app-danger text-xs rounded-sm">
            {error}
          </div>
        )}

        <Input
          label="Oda Bağlantısı veya Kodu"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setError(null);
          }}
          placeholder="Örn: room-xyz123 veya link"
        />

        <Button type="submit" variant="secondary" className="w-full">
          Odaya Katıl
        </Button>
      </form>
    </div>
  );
};
