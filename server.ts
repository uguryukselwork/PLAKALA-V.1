import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory data store for real-time messages & car registrations
interface RealtimeMessage {
  id: string;
  roomCode: string;
  plate: string;
  senderId: string;
  senderPhoto?: string;
  senderGender?: 'male' | 'female' | 'unspecified';
  text: string;
  timestamp: string;
  read: boolean;
}

interface RegisteredCar {
  plate: string;
  recoveryCode: string;
  deviceId: string;
  createdAt: string;
}

const messagesStore: RealtimeMessage[] = [];
const registeredCarsStore: Map<string, RegisteredCar> = new Map();

// Active SSE client connections
interface SSEClient {
  id: string;
  res: Response;
  plates?: string[];
  roomCode?: string;
  deviceId?: string;
}

let sseClients: SSEClient[] = [];

// Helper to broadcast event to matching clients
function broadcastEvent(
  eventType: string,
  data: any,
  filter?: { plate?: string; roomCode?: string; excludeClientId?: string }
) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  const disconnectedClients: string[] = [];

  sseClients.forEach((client) => {
    if (filter?.excludeClientId && client.id === filter.excludeClientId) return;
    
    // Delivery logic
    if (filter?.roomCode) {
      const matchRoom = client.roomCode && client.roomCode === filter.roomCode;
      const matchPlate = filter.plate && client.plates && client.plates.includes(filter.plate);
      if (!matchRoom && !matchPlate) return;
    } else if (filter?.plate) {
      if (client.plates && client.plates.length > 0 && !client.plates.includes(filter.plate)) return;
    }

    try {
      client.res.write(payload);
    } catch {
      disconnectedClients.push(client.id);
    }
  });

  if (disconnectedClients.length > 0) {
    sseClients = sseClients.filter((c) => !disconnectedClients.includes(c.id));
  }
}

// 1. Real-time Server-Sent Events stream endpoint
app.get('/api/realtime/events', (req: Request, res: Response) => {
  const { plate, plates, roomCode, deviceId } = req.query as {
    plate?: string;
    plates?: string;
    roomCode?: string;
    deviceId?: string;
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const rawPlates: string[] = [];
  if (plates) {
    rawPlates.push(...plates.split(','));
  }
  if (plate) {
    rawPlates.push(plate);
  }
  const normalizedPlates = rawPlates
    .map((p) => p.toUpperCase().replace(/\s+/g, ''))
    .filter(Boolean);

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newClient: SSEClient = {
    id: clientId,
    res,
    plates: normalizedPlates,
    roomCode,
    deviceId,
  };

  sseClients.push(newClient);

  // Send initial connection acknowledgement
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat ping every 15s to keep connection alive through proxies
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeatTimer);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// 2. Send Real-Time Message
app.post('/api/realtime/messages', (req: Request, res: Response) => {
  const {
    id,
    roomCode,
    plate,
    senderId,
    senderPhoto,
    senderGender,
    text,
  } = req.body;

  if (!plate || !text) {
    res.status(400).json({ error: 'Plaka ve mesaj metni gereklidir.' });
    return;
  }

  const cleanPlate = (plate as string).toUpperCase().trim();
  const normalizedPlateKey = cleanPlate.replace(/\s+/g, '');

  const newMsg: RealtimeMessage = {
    id: id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    roomCode: roomCode || `room_${normalizedPlateKey}`,
    plate: cleanPlate,
    senderId: senderId || 'anonymous',
    senderPhoto,
    senderGender,
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };

  messagesStore.push(newMsg);
  // Keep only last 1000 messages in memory
  if (messagesStore.length > 1000) {
    messagesStore.shift();
  }

  // Broadcast to all relevant clients (by roomCode and by Plate)
  broadcastEvent('new_message', newMsg, {
    plate: normalizedPlateKey,
    roomCode: newMsg.roomCode,
  });

  res.status(201).json({ success: true, message: newMsg });
});

// 2b. Broadcast Incoming Notification to Car Owner
app.post('/api/realtime/notifications', (req: Request, res: Response) => {
  const { id, targetPlate, reason, note, roomCode, senderId } = req.body;
  if (!targetPlate || !reason) {
    res.status(400).json({ error: 'Plaka ve bildirim nedeni gereklidir.' });
    return;
  }

  const cleanPlate = (targetPlate as string).toUpperCase().trim();
  const normalizedPlateKey = cleanPlate.replace(/\s+/g, '');

  const notifItem = {
    id: id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    targetPlate: cleanPlate,
    reason,
    note,
    roomCode,
    senderId,
    timestamp: Date.now(),
    timeFormatted: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    status: 'sent',
    isIncoming: true,
  };

  // Broadcast to any client that is listening on this plate
  broadcastEvent('incoming_notification', notifItem, {
    plate: normalizedPlateKey,
  });

  res.status(201).json({ success: true, notification: notifItem });
});

// 3. Get message history for room / plate
app.get('/api/realtime/messages', (req: Request, res: Response) => {
  const { roomCode, plate } = req.query as { roomCode?: string; plate?: string };

  let filtered = messagesStore;
  if (roomCode) {
    filtered = filtered.filter((m) => m.roomCode === roomCode);
  } else if (plate) {
    const cleanPlateKey = plate.toUpperCase().replace(/\s+/g, '');
    filtered = filtered.filter((m) => m.plate.replace(/\s+/g, '').toUpperCase() === cleanPlateKey);
  }

  res.json({ success: true, messages: filtered });
});

// 4. Typing status broadcast
app.post('/api/realtime/typing', (req: Request, res: Response) => {
  const { roomCode, plate, isTyping, senderId } = req.body;
  const cleanPlateKey = plate ? (plate as string).toUpperCase().replace(/\s+/g, '') : undefined;

  broadcastEvent('typing_status', { roomCode, plate, isTyping, senderId }, {
    roomCode,
    plate: cleanPlateKey,
  });

  res.json({ success: true });
});

// 5. Register Car
app.post('/api/realtime/cars/register', (req: Request, res: Response) => {
  const { plate, recoveryCode, deviceId } = req.body;
  if (!plate || !recoveryCode) {
    res.status(400).json({ error: 'Plaka ve kurtarma kodu zorunludur.' });
    return;
  }

  const cleanPlate = (plate as string).toUpperCase().trim();
  const normalizedKey = cleanPlate.replace(/\s+/g, '');

  const carData: RegisteredCar = {
    plate: cleanPlate,
    recoveryCode,
    deviceId: deviceId || 'unknown',
    createdAt: new Date().toISOString(),
  };

  registeredCarsStore.set(normalizedKey, carData);
  res.json({ success: true, car: carData });
});

// 6. Check Car status
app.get('/api/realtime/cars/check', (req: Request, res: Response) => {
  const { plate } = req.query as { plate?: string };
  if (!plate) {
    res.status(400).json({ error: 'Plaka parametresi gereklidir.' });
    return;
  }

  const normalizedKey = plate.toUpperCase().replace(/\s+/g, '');
  const car = registeredCarsStore.get(normalizedKey);

  res.json({
    exists: !!car,
    car: car ? { plate: car.plate, createdAt: car.createdAt } : null,
  });
});

// 7. Health Check
app.get('/api/realtime/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeConnections: sseClients.length,
    totalMessages: messagesStore.length,
    registeredCars: registeredCarsStore.size,
  });
});

// Vite middleware in dev or static files in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.static(path.resolve(__dirname, 'public')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Plakala Realtime Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
