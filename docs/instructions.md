# Real-Time Watch Party Web Application - Master Specification

> **Target Audience:** Autonomous AI Developer Agent & Engineers  
> **Repository Base:** `C:\Users\dogukan\Desktop\watchvideo`  
> **Subdirectories:** `client` (React + TS + Tailwind), `api` (Node.js + Express + Socket.io)

---

## 1. Executive Summary & Design Philosophy

The objective is to build a low-latency, real-time synchronized YouTube watch party application with WebRTC camera sharing (video-only, no audio), participant role management, and real-time chat.

### Non-Negotiable Product Constraints:
1. **No Mandatory Registration:** Users join or create rooms transiently using nicknames.
2. **In-Memory Lifespan:** Rooms exist strictly in server RAM. When all users leave or the admin terminates the room, its data is permanently deleted from memory.
3. **Strict Visual Aesthetic (Anti-AI Slop):**
   * **Prohibited:** Neon glow effects, multi-color gradient buttons/borders, bloated padding, emoji-heavy interfaces, card borders with colored left accents, and animated flashy decorative backgrounds.
   * **Required:** Strict dark palette dominated by deep muted blacks and terminal/forest greens. Monospaced or clean sans typography, sharp or minimal radiuses (`rounded-sm` / `rounded-md`), flat surfaces, 1px subtle borders, high information density, and functional minimalist UI.
   * **Customizable Tokens:** All colors must be managed via CSS variables in `client/src/index.css`.
4. **Room Capacity:** Enforced maximum of 4 concurrent users per room.

---

## 2. Technical Stack Specifications

### Frontend (`/client`)
* **Core:** React 18+ / TypeScript / Vite
* **Styling:** Tailwind CSS (configured to consume CSS variables)
* **Player Integration:** Native YouTube IFrame Player API (via standard script loader or lightweight typed wrapper)
* **Real-Time Client:** `socket.io-client`
* **P2P Video:** WebRTC `RTCPeerConnection` (Full Mesh, signaling via Socket.io)
* **State Management:** Zustand (for lightweight, performant decoupled stores) or React Context + useReducer
* **Icons:** `lucide-react` (monochrome, stroke width 1.5-1.75px)

### Backend (`/api`)
* **Runtime & Language:** Node.js (v18+) with TypeScript (`ts-node-dev` or `tsx` for dev, `tsc` for build)
* **Framework:** Express.js (minimal endpoints for health check and room pre-flight validation)
* **WebSocket Engine:** `socket.io`
* **Storage:** In-memory `Map<string, Room>` data structure with dedicated service layers.

---

## 3. Directory Layout and File Responsibilities

```text
watchvideo/
├── api/
│   ├── src/
│   │   ├── config/
│   │   │   └── constants.ts          # Max room sizes, limits, buffer sizes
│   │   ├── models/
│   │   │   └── types.ts              # Room, User, VideoState, ChatMessage interfaces
│   │   ├── services/
│   │   │   └── roomManager.ts        # In-memory Room CRUD and state operations
│   │   ├── sockets/
│   │   │   ├── index.ts              # Socket registration hub
│   │   │   ├── roomHandler.ts        # Join, leave, kick, permissions
│   │   │   ├── videoHandler.ts       # Play, pause, seek, sync
│   │   │   ├── webrtcHandler.ts      # Signaling (offer, answer, candidate)
│   │   │   └── chatHandler.ts        # Message dispatch & rate limits
│   │   └── index.ts                  # HTTP & Socket.io server bootloader
│   ├── package.json
│   └── tsconfig.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Button, Input, Modal, Badge
│   │   │   ├── home/                 # CreateRoomForm, JoinRoomPrompt
│   │   │   ├── room/
│   │   │   │   ├── VideoPlayer.tsx   # YouTube iframe player wrapper
│   │   │   │   ├── CameraGrid.tsx    # 4-slot WebRTC mesh video view
│   │   │   │   ├── CameraBox.tsx     # Single peer stream component
│   │   │   │   ├── ChatPanel.tsx     # Ring-buffered chat stream
│   │   │   │   ├── UserList.tsx      # Member roster with admin controls
│   │   │   │   └── RoomHeader.tsx    # Room info, invite URL copy, exit
│   │   ├── hooks/
│   │   │   ├── useSocket.ts          # Socket connection hook
│   │   │   ├── useYouTubeSync.ts     # Player lifecycle & synchronization math
│   │   │   └── useWebRTC.ts          # Mesh peer connections management
│   │   ├── stores/
│   │   │   ├── useRoomStore.ts       # Room state, participants, controls
│   │   │   └── useChatStore.ts       # Max 100-item sliding window chat store
│   │   ├── styles/
│   │   │   └── index.css             # Theme variables and resets
│   │   ├── App.tsx                   # Routing & modal guards
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.ts
└── PROJECT_BLUEPRINT.md
```

---

## 4. UI/UX Design System & Styling Rules

### CSS Variables (`client/src/index.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #090b09;       /* Deep matte black with faint forest undertone */
  --bg-secondary: #111411;     /* Surface panels, sidebar, inputs */
  --bg-tertiary: #171c17;      /* Hover states, item backgrounds */
  
  --border-muted: #1f271f;     /* Subtle division lines */
  --border-focus: #2e3d2e;     /* Active borders */
  
  --text-primary: #e6ede6;     /* Clean off-white */
  --text-secondary: #8c9c8c;   /* Neutral secondary labels */
  --text-muted: #525e52;       /* Subdued status text */
  
  --accent-base: #22c55e;      /* Terminal green */
  --accent-hover: #16a34a;
  --accent-faint: rgba(34, 197, 94, 0.08);
  
  --status-danger: #e11d48;
  --status-danger-bg: rgba(225, 29, 72, 0.1);
  --status-warning: #eab308;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
```

### Tailwind Config Integration (`client/tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--bg-primary)",
          surface: "var(--bg-secondary)",
          hover: "var(--bg-tertiary)",
          border: "var(--border-muted)",
          "border-focus": "var(--border-focus)",
          text: "var(--text-primary)",
          muted: "var(--text-secondary)",
          dim: "var(--text-muted)",
          accent: "var(--accent-base)",
          "accent-hover": "var(--accent-hover)",
          "accent-faint": "var(--accent-faint)",
          danger: "var(--status-danger)",
        }
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "4px"
      }
    },
  },
  plugins: [],
}
```

### Aesthetic Checkpoints:
* Buttons must have crisp 1px borders (`border border-app-border hover:border-app-accent`).
* No gradients on backgrounds or buttons. Solid flat fills only.
* No box-shadow glow effects (`shadow-[0_0_...px]` is strictly forbidden).

---

## 5. Domain Models and State Contracts

```typescript
// Shared Types (Implemented in api/src/models/types.ts & client/src/types/index.ts)

export interface User {
  id: string;               // Socket ID
  nickname: string;
  isAdmin: boolean;
  canControl: boolean;       // Granted by room admin
  hasCamera: boolean;
  joinedAt: number;
}

export interface VideoState {
  videoId: string | null;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;        // Server epoch ms when state mutated
}

export interface Room {
  id: string;               // Nanoid or short slug (e.g. "stream-7x9q")
  title: string;
  password?: string | null; // Optional plain string for ephemeral room
  maxUsers: number;         // Upper limit: 4
  users: Map<string, User>;
  video: VideoState;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}
```

---

## 6. Socket.IO Protocol & Event Registry

All communication occurs via the following strictly-typed contracts:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `room:create` | Client -> Server | `{ title, nickname, maxUsers, password? }` | Initializes new room, caller becomes Admin. Returns `{ roomId }`. |
| `room:join` | Client -> Server | `{ roomId, nickname, password? }` | Attempt join. Emits error if locked/full. |
| `room:joined` | Server -> Client | `{ room: SanitizedRoom, user: User }` | Confirmation with full initial state. |
| `room:user-joined` | Server -> Client | `{ user: User }` | Broadcast to peers inside the room. |
| `room:user-left` | Server -> Client | `{ userId: string, newAdminId?: string }` | Broadcast when peer leaves or disconnects. |
| `room:kick-user` | Client -> Server | `{ targetUserId: string }` | Admin-only instruction to expel peer. |
| `room:kicked` | Server -> Client | `{ reason: string }` | Direct event to expelled user socket. |
| `room:close` | Client -> Server | `{}` | Admin closes room; kicks all, wipes RAM. |
| `room:closed` | Server -> Client | `{}` | Directs all clients back to root `/`. |
| `user:set-permission`| Client -> Server | `{ targetUserId: string, canControl: boolean }`| Admin updates participant play/seek rights. |
| `user:permission-updated` | Server -> Client | `{ userId: string, canControl: boolean }` | Broadcast updated rights. |
| `video:change-source` | Client -> Server | `{ videoId: string }` | Loads new YouTube video (requires rights). |
| `video:action` | Client -> Server | `{ action: 'PLAY' \| 'PAUSE' \| 'SEEK', currentTime: number }` | Sent on player actions. |
| `video:sync` | Server -> Client | `{ videoId: string, isPlaying: boolean, currentTime: number, serverTime: number }` | Authoritative sync broadcast. |
| `video:request-sync` | Client -> Server | `{}` | Sent by new/desynced client to fetch clock. |
| `chat:send` | Client -> Server | `{ text: string }` | Submits message to the room. |
| `chat:message` | Server -> Client | `ChatMessage` | Broadcast to all room occupants. |
| `webrtc:offer` | Client -> Client | `{ to: string, from: string, sdp: RTCSessionDescriptionInit }` | Relayed via server. |
| `webrtc:answer` | Client -> Client | `{ to: string, from: string, sdp: RTCSessionDescriptionInit }` | Relayed via server. |
| `webrtc:ice-candidate` | Client -> Client | `{ to: string, from: string, candidate: RTCIceCandidateInit }` | Relayed via server. |
| `camera:status-change` | Client -> Server | `{ hasCamera: boolean }` | Broadcasts if local video enabled/disabled. |

---

## 7. Algorithms & Core Logic

### 7.1 Video Synchronization Engine

To eliminate infinite loop triggers (`Player Event -> Socket -> Remote Event -> Local Player -> Local Event -> Socket`) and accommodate network delays:

```
[ User Action (Play/Pause/Seek) ]
           │
           ▼
[ Check `canControl` or `isAdmin` ] ──(No)──> Ignore/Revert player
           │ (Yes)
           ▼
[ Mark `isLocalAction = true` ]
           │
           ▼
[ Emit `video:action` to Socket ]
           │
           ▼
[ Server updates state & adds server timestamp ]
           │
           ▼
[ Broadcast `video:sync` to other clients in room ]
           │
           ▼
[ Remote Client receives `video:sync` ]
           │
           ▼
[ Set `isRemoteAction = true` ]
           │
           ▼
[ Calculate drift: delta = abs(localTime - expectedTime) ]
           │
    ┌──────┴─────────────────────────────────┐
    ▼                                        ▼
[ delta > 1.5s ]                     [ delta <= 1.5s ]
    │                                        │
[ player.seekTo(expectedTime) ]      [ Maintain playback / ]
[ apply play/pause state ]           [ micro-adjust rate   ]
    │                                        │
    └──────────────────┬─────────────────────┘
                       ▼
[ Reset `isRemoteAction = false` after 300ms ]
```

#### Calculation of `expectedTime`:
$$\text{elapsed} = \frac{\text{Date.now}() - \text{serverTime}}{1000}$$
$$\text{expectedTime} = \text{isPlaying} ? (\text{currentTime} + \text{elapsed}) : \text{currentTime}$$

### 7.2 In-Memory Lifecycle & Auto-Garbage Collection (`roomManager.ts`)
1. Rooms are indexed in a primary map: `private rooms: Map<string, Room> = new Map()`.
2. A reverse lookup map maps sockets to room IDs: `private userToRoom: Map<string, string> = new Map()`.
3. When a socket disconnects (`socket.on('disconnect')`):
   * Remove socket from `userToRoom`.
   * Look up room: remove user from `room.users`.
   * **If `room.users.size === 0`:**
     * Clean up any active interval timers for that room.
     * `rooms.delete(roomId)`.
   * **If user was Admin and other users remain:**
     * Promote the earliest joined user (`joinedAt` min) to `isAdmin = true` and `canControl = true`.
     * Broadcast `room:user-left` with `newAdminId`.

### 7.3 Sliding Window Chat Queue (Memory & Render Safety)
To prevent DOM tree expansion and memory degradation over long viewing sessions:
* The store enforces a constant-time Ring Buffer / Window of 100 messages:
```typescript
// client/src/stores/useChatStore.ts
import { create } from 'zustand';
import { ChatMessage } from '../types';

const MAX_CHAT_MESSAGES = 100;

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => {
      const updated = [...state.messages, msg];
      if (updated.length > MAX_CHAT_MESSAGES) {
        return { messages: updated.slice(updated.length - MAX_CHAT_MESSAGES) };
      }
      return { messages: updated };
    }),
  clearChat: () => set({ messages: [] }),
}));
```

### 7.4 WebRTC Full-Mesh Logic (Max 4 Nodes, Video Only)
* **Configuration:**
  ```javascript
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };
  ```
* **Constraints (Save Bandwidth & CPU):**
  ```javascript
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { max: 320 }, height: { max: 240 }, frameRate: { max: 15 } },
    audio: false // STRICT: Chat is text-only; video is visual-only
  });
  ```
* **Peer Management:**
  * When a new peer joins, existing peers create an `RTCPeerConnection` for that peer, attach local stream tracks, create an offer, and send it through Socket.IO.
  * The new peer receives the offer, creates their matching peer connection, adds local tracks, creates an answer, and returns it.

---

## 8. Screen Flows & Functional Specifications

### 8.1 Landing Screen (`/`)
* **Minimalist Container:** Max-width 420px centered container.
* **Toggle Selector:** Two clean tab buttons: `[Oda Kur]` and `[Odaya Katıl]`.
* **State A: "Oda Kur" Form:**
  * `Kullanıcı Adı` (Text input, required, max 20 chars).
  * `Oda Başlığı` (Text input, required, max 40 chars).
  * `Kişi Sayısı` (Option buttons: 2, 3, 4 - default: 4).
  * `Oda Şifresi` (Password input, optional, placeholder: "İsteğe bağlı").
  * Submit Button: `[Oda Oluştur]`.
* **State B: "Odaya Katıl" Information:**
  * Informative panel:
    > "Doğrudan bir odaya katılmak için oda kurucusundan oda bağlantısını (link) isteyiniz."
  * Secondary manual entry field: "Oda Bağlantısı veya Kodu Yapıştır" with `[Katıl]` button.

### 8.2 Room Entry Guard / Modal (`/room/:roomId`)
When a user opens an invite URL:
1. Client makes a quick handshake or socket query `room:check { roomId }`.
2. If room does not exist: Show simple alert "Oda bulunamadı veya kapatılmış." with redirect button to `/`.
3. If room exists: Present Entry Modal:
   * Displays: Room Title, Current Capacity (e.g., `2 / 4 Kişi`).
   * Inputs:
     * `Kullanıcı Adı` (Required).
     * `Şifre` (Visible only if room has a password set).
   * Button: `[Odaya Gir]`.

### 8.3 In-Room Layout (`/room/:roomId`)
* **Responsive Breakpoints:**
  * **Desktop ($>1024\text{px}$):**
    * Top Bar: Room Title, Share Link Button (`navigator.clipboard`), User Counter, `[Odayı Kapat]` (Admin) or `[Ayrıl]`.
    * Left Area ($70\%$):
      * YouTube Player Container (Fixed 16:9 aspect ratio, sticky or prominent).
      * Video URL input bar (Visible only to users with control rights).
      * Camera Row/Grid below the player (4 tiles max, showing self + peers).
    * Right Sidebar ($30\%$):
      * Tabbed or Split Panel:
        * **Katılımcılar Listesi:** User items showing role badges (`[Admin]`, `[Yönetici]`), toggle camera status, and admin controls (`Yetki Ver/Al`, `Odadan At`).
        * **Sohbet:** Message list (last 100 items), bottom input bar with character counter ($200$ chars max).
  * **Mobile ($\le 768\text{px}$):**
    * Top: Sticky 16:9 Video Player.
    * Middle Navigation: Segmented switcher: `[Sohbet]` | `[Kameralar (2x2)]` | `[Katılımcılar]`.
    * Bottom: Contextual controls (Chat input bar when on Chat tab, Camera toggle button when on Kameralar tab).

---

## 9. API & Socket Backend Reference Implementation Plan

Agent must scaffold `/api` using the following package structure:

```json
{
  "name": "watchvideo-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "nanoid": "^3.3.7",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.7",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

### Server Boot Entry (`api/src/index.ts`)
```typescript
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerRoomHandlers } from './sockets/roomHandler';
import { registerVideoHandlers } from './sockets/videoHandler';
import { registerChatHandlers } from './sockets/chatHandler';
import { registerWebRTCHandlers } from './sockets/webrtcHandler';
import { RoomManager } from './services/roomManager';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

// Health check and room existence check
app.get('/health', (_, res) => res.json({ status: 'healthy', uptime: process.uptime() }));
app.get('/api/room/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });
  return res.json({
    id: room.id,
    title: room.title,
    userCount: room.users.size,
    maxUsers: room.maxUsers,
    isProtected: Boolean(room.password)
  });
});

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket, roomManager);
  registerVideoHandlers(io, socket, roomManager);
  registerChatHandlers(io, socket, roomManager);
  registerWebRTCHandlers(io, socket, roomManager);

  socket.on('disconnect', () => {
    roomManager.handleDisconnect(io, socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[WatchVideo API] Running on port ${PORT}`);
});
```

---

## 10. YouTube Player Integration Instructions (`client`)

Use the native YouTube IFrame API to avoid third-party library overhead.

### Initialization & Synchronization Hook (`client/src/hooks/useYouTubeSync.ts`)

```typescript
import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubeSyncProps {
  socket: Socket | null;
  roomId: string;
  canControl: boolean;
  elementId: string;
}

export const useYouTubeSync = ({ socket, roomId, canControl, elementId }: UseYouTubeSyncProps) => {
  const playerRef = useRef<any>(null);
  const isRemoteAction = useRef<boolean>(false);

  useEffect(() => {
    // 1. Load YouTube Script if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player(elementId, {
        playerVars: {
          autoplay: 1,
          controls: canControl ? 1 : 0, // Disable native controls if user has no rights
          disablekb: canControl ? 0 : 1,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: () => {
            socket?.emit('video:request-sync');
          },
          onStateChange: (event: any) => {
            if (isRemoteAction.current) return;
            if (!canControl) return;

            // 1: PLAYING, 2: PAUSED
            if (event.data === 1) {
              socket?.emit('video:action', {
                action: 'PLAY',
                currentTime: playerRef.current.getCurrentTime()
              });
            } else if (event.data === 2) {
              socket?.emit('video:action', {
                action: 'PAUSE',
                currentTime: playerRef.current.getCurrentTime()
              });
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [elementId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('video:sync', (data: { videoId: string; isPlaying: boolean; currentTime: number; serverTime: number }) => {
      if (!playerRef.current || !playerRef.current.seekTo) return;

      isRemoteAction.current = true;

      // Calculate elapsed drift
      const latency = (Date.now() - data.serverTime) / 1000;
      const expectedTime = data.isPlaying ? data.currentTime + latency : data.currentTime;
      const localTime = playerRef.current.getCurrentTime();

      if (Math.abs(localTime - expectedTime) > 1.5) {
        playerRef.current.seekTo(expectedTime, true);
      }

      if (data.isPlaying && playerRef.current.getPlayerState() !== 1) {
        playerRef.current.playVideo();
      } else if (!data.isPlaying && playerRef.current.getPlayerState() !== 2) {
        playerRef.current.pauseVideo();
      }

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 350);
    });

    return () => {
      socket.off('video:sync');
    };
  }, [socket]);

  return { player: playerRef };
};
```

---

## 11. Step-by-Step Implementation Roadmap for the Agent

When executing the build, follow this ordered progression:

1. **Step 1: Setup Backend (`/api`) Core & Models**
   * Initialize `package.json`, `tsconfig.json`.
   * Create `types.ts` with all models outlined in Section 5.
   * Implement `roomManager.ts` (CRUD, memory cleanup, disconnect handling).
   * Boot server in `index.ts`. Verify `/health` works.
2. **Step 2: Setup Backend Socket Handlers**
   * Wire `roomHandler.ts`: Room creation, room joining validation, kick, permissions.
   * Wire `videoHandler.ts`: Synchronization broadcast and rights checks.
   * Wire `chatHandler.ts`: Validate message length ($< 250$ chars) and broadcast.
   * Wire `webrtcHandler.ts`: Signalling relay (`offer`, `answer`, `ice-candidate`).
3. **Step 3: Setup Frontend Foundation (`/client`)**
   * Configure `src/index.css` with the complete CSS variable palette.
   * Update `tailwind.config.js` to reference the tokens.
   * Setup `src/types/index.ts` matching backend types.
   * Build base atom components: `Button.tsx`, `Input.tsx`, `Modal.tsx`.
4. **Step 4: Implement Home Screen & Navigation**
   * Create `/` route with clean tab switcher (`Oda Kur` / `Odaya Katıl`).
   * Create `/room/:roomId` route with join modal pre-check.
5. **Step 5: Implement In-Room Video & Sync**
   * Implement `VideoPlayer.tsx` using `useYouTubeSync.ts`.
   * Implement Admin/Operator control bar to change video URL/ID.
6. **Step 6: Implement WebRTC Mesh Camera Grid**
   * Implement `useWebRTC.ts` handling mesh connections up to 4 users.
   * Build `CameraGrid.tsx` and individual `CameraBox.tsx` with user labels and toggle switches.
7. **Step 7: Implement Chat & User Roster**
   * Build `ChatPanel.tsx` with the 100-message sliding window mechanism.
   * Build `UserList.tsx` showing admin badges, permission toggle buttons, and kick triggers.
8. **Step 8: Polish & Edge Cases**
   * Test user disconnection, empty room garbage collection.
   * Verify mobile layout responsiveness (tabbed video/chat/cameras).