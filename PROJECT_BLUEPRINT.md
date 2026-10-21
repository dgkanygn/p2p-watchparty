# Real-Time Watch Party - Project Blueprint

## Overview
Low-latency, real-time synchronized YouTube watch party application with WebRTC camera sharing (video-only), participant role management, and sliding-window real-time chat.

---

## Architecture

### Backend (`/api`)
- **Runtime:** Node.js + TypeScript (`tsx`)
- **Framework:** Express.js + Socket.io
- **Storage:** Ephemeral In-Memory (`Map<string, Room>`)
- **Ports:** Express & Socket.IO on `http://localhost:4000`
- **Endpoints:**
  - `GET /health`: Health check
  - `GET /api/room/:roomId`: Room pre-flight metadata (title, user count, password protected status)
- **Socket Events:**
  - Room Lifecycle: `room:create`, `room:join`, `room:joined`, `room:user-joined`, `room:user-left`, `room:kick-user`, `room:kicked`, `room:close`, `room:closed`
  - Roles & Permissions: `user:set-permission`, `user:permission-updated`
  - YouTube Video Synchronization: `video:change-source`, `video:action`, `video:sync`, `video:request-sync`
  - Real-Time Messaging: `chat:send`, `chat:message`
  - WebRTC Mesh Signaling: `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`, `camera:status-change`, `camera:status-updated`

### Frontend (`/client`)
- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **State Management:** Zustand (`useRoomStore`, `useChatStore`)
- **Real-Time Connection:** `socket.io-client` with auto-reconnection
- **Video Player:** Native YouTube IFrame Player API (`useYouTubeSync`) with drift calculation ($> 1.5$s correction)
- **WebRTC Mesh:** Full Mesh (`RTCPeerConnection`, Google & Twilio STUN, 320x240 @ 15fps, video-only)
- **Design System:** Strict muted black and terminal green palette via CSS variables in `index.css` (no glowing neon, 1px crisp borders, high-density layout)

---

## How to Run

### Backend (`api`)
```bash
cd api
npm install
npm run dev
```

### Frontend (`client`)
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.
