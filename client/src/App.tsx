import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { HomePage } from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';

export const App = () => {
  const socket = useSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage socket={socket} />} />
        <Route path="/room/:roomId" element={<RoomPage socket={socket} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;